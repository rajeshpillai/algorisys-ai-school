defmodule Backend.Classroom.Session do
  @moduledoc """
  GenServer managing an individual classroom session.
  Orchestrates the agent pipeline: role synthesis -> orchestrator -> scene engine -> teaching agent.
  Broadcasts messages via PubSub for real-time streaming to connected clients.
  """

  use GenServer

  require Logger

  alias Backend.Agents.{CurriculumPlanner, RoleSynthesis, Orchestrator, SceneEngine, TeachingAgent}
  alias Backend.Classroom.{LearnerState, Store}

  defstruct [
    :id,
    :goal,
    :learner_profile,
    agents: [],
    messages: [],
    learner_state: %LearnerState{},
    curriculum_plan: nil,
    current_module_index: 0,
    current_lesson_index: 0,
    current_scene: nil,
    current_scene_spec: nil,
    current_topic: nil,
    current_agent: nil,
    orchestrator_decision: nil,
    state: :initializing
  ]

  # --- Client API ---

  def start_link(opts) do
    session_id = Keyword.fetch!(opts, :id)
    GenServer.start_link(__MODULE__, opts, name: via_tuple(session_id))
  end

  def get_state(session_id) do
    GenServer.call(via_tuple(session_id), :get_state, 10_000)
  catch
    :exit, _ -> {:error, :not_found}
  end

  def send_message(session_id, content) do
    GenServer.cast(via_tuple(session_id), {:message, content})
  end

  def send_action(session_id, action) do
    GenServer.cast(via_tuple(session_id), {:action, action})
  end

  defp via_tuple(session_id) do
    {:via, Registry, {Backend.SessionRegistry, session_id}}
  end

  # --- Server Callbacks ---

  @impl true
  def init(opts) do
    session_id = Keyword.fetch!(opts, :id)
    goal = Keyword.fetch!(opts, :goal)
    learner_profile = Keyword.get(opts, :learner_profile)

    case Store.load_session(session_id) do
      nil ->
        # New session — persist and start pipeline
        Store.create_session(session_id, goal, learner_profile)

        state = %__MODULE__{
          id: session_id,
          goal: goal,
          learner_profile: learner_profile,
          state: :initializing
        }

        # Delay pipeline start slightly to let WebSocket client connect
        Process.send_after(self(), :start_pipeline, 500)
        {:ok, state}

      persisted ->
        # Resume from DB
        state = rebuild_from_persisted(persisted)
        Logger.info("Resumed session #{session_id} from database")
        {:ok, state}
    end
  end

  @impl true
  def handle_call(:get_state, _from, state) do
    {total_lessons, completed_lessons} = curriculum_progress(state)

    reply = %{
      id: state.id,
      goal: state.goal,
      state: state.state,
      agents: Enum.map(state.agents, fn a -> a["name"] end),
      current_scene: state.current_scene,
      current_agent: state.current_agent,
      current_topic: state.current_topic,
      message_count: length(state.messages),
      curriculum: %{
        total_lessons: total_lessons,
        completed_lessons: completed_lessons,
        current_module_index: state.current_module_index,
        current_lesson_index: state.current_lesson_index
      }
    }

    {:reply, reply, state}
  end

  @impl true
  def handle_cast({:message, content}, %{state: session_state} = state)
      when session_state in [:waiting, :ready] do
    user_msg = %{role: "user", content: content}
    new_state = %{state | messages: state.messages ++ [user_msg], state: :teaching}

    # Persist user message
    Store.append_message(state.id, "user", content)

    # Spawn next turn pipeline in a task
    spawn_next_turn(new_state)

    {:noreply, new_state}
  end

  def handle_cast({:message, _content}, state) do
    Logger.warning("Message received while session is in state: #{state.state}")
    {:noreply, state}
  end

  def handle_cast({:action, action}, state) do
    Logger.info("Action received: #{inspect(action)} for session #{state.id}")
    {:noreply, state}
  end

  # --- All handle_info clauses grouped together ---

  @impl true
  def handle_info(:start_pipeline, state) do
    spawn_pipeline(state)
    {:noreply, state}
  end

  def handle_info({:pipeline_started, agents, decision, scene_spec, selected_agent, curriculum_plan}, state) do
    next_action = decision["next_action"] || %{}
    agent_name = next_action["agent"] || first_agent_name(agents)
    scene_type = next_action["scene"] || "lecture"

    new_state = %{state |
      agents: agents,
      curriculum_plan: curriculum_plan,
      orchestrator_decision: decision,
      current_scene: scene_type,
      current_scene_spec: scene_spec,
      current_topic: (decision["state_updates"] || %{})["focus_topic"] || state.goal,
      current_agent: agent_name,
      state: :teaching
    }

    Store.save_state(new_state)
    broadcast_progress(new_state)
    spawn_teaching(new_state, selected_agent, scene_spec)

    {:noreply, new_state}
  end

  def handle_info({:next_turn_ready, decision, scene_spec, selected_agent}, state) do
    next_action = decision["next_action"] || %{}
    agent_name = next_action["agent"] || state.current_agent || "Teacher"
    scene_type = next_action["scene"] || "lecture"

    new_state = %{state |
      orchestrator_decision: decision,
      current_scene: scene_type,
      current_scene_spec: scene_spec,
      current_topic: (decision["state_updates"] || %{})["focus_topic"] || state.current_topic || state.goal,
      current_agent: agent_name,
      state: :teaching
    }

    Store.save_state(new_state)
    spawn_teaching(new_state, selected_agent, scene_spec)

    {:noreply, new_state}
  end

  def handle_info({:teaching_done, agent_name, agent_role, full_text}, state) do
    agent_msg = %{role: "assistant", content: full_text}
    new_messages = state.messages ++ [agent_msg]

    # Advance curriculum position
    new_state = advance_curriculum(%{state | messages: new_messages, state: :waiting})

    # Persist assistant message and updated state
    Store.append_message(state.id, "assistant", full_text, agent_name, agent_role)
    Store.save_state(new_state)

    # Broadcast progress update to frontend
    broadcast_progress(new_state)

    # Auto-advance to next lesson if curriculum has more topics
    maybe_auto_advance(new_state)

    {:noreply, new_state}
  end

  def handle_info(:auto_advance, %{state: :waiting} = state) do
    {total, completed} = curriculum_progress(state)
    Logger.info("Auto-advancing: lesson #{completed + 1}/#{total} — #{state.current_topic}")

    broadcast(state.id, "agent_message", %{
      id: generate_id(),
      agent_name: "System",
      agent_role: "system",
      content: "Moving to next topic: **#{state.current_topic}** (#{completed + 1}/#{total})",
      timestamp: System.system_time(:millisecond)
    })

    new_state = %{state | state: :teaching}
    spawn_next_turn(new_state)
    {:noreply, new_state}
  end

  def handle_info(:auto_advance, state) do
    # If not in waiting state, ignore (teaching is already in progress)
    {:noreply, state}
  end

  def handle_info({:teaching_error, _reason}, state) do
    {:noreply, %{state | state: :waiting}}
  end

  def handle_info({:pipeline_error, reason}, state) do
    Logger.error("Pipeline error for session #{state.id}: #{inspect(reason)}")
    {:noreply, %{state | state: :waiting}}
  end

  def handle_info(msg, state) do
    Logger.debug("Session #{state.id} received unexpected message: #{inspect(msg)}")
    {:noreply, state}
  end

  # --- Pipeline Spawning (non-blocking) ---

  defp spawn_pipeline(state) do
    gen_server_pid = self()
    goal = state.goal
    learner_profile = state.learner_profile
    session_id = state.id
    learner_state = state.learner_state

    Task.start(fn ->
      broadcast(session_id, "agent_message", %{
        id: generate_id(),
        agent_name: "System",
        agent_role: "system",
        content: "Setting up your personalized learning session...",
        timestamp: System.system_time(:millisecond)
      })

      # Step 1: Role Synthesis
      agents =
        case RoleSynthesis.generate_team(goal, learner_profile) do
          {:ok, agents} ->
            Logger.info("Generated #{length(agents)} agents")

            broadcast(session_id, "agent_message", %{
              id: generate_id(),
              agent_name: "System",
              agent_role: "system",
              content: "Assembled a team of #{length(agents)} specialists: #{Enum.map_join(agents, ", ", & &1["name"])}",
              timestamp: System.system_time(:millisecond)
            })

            agents

          {:error, reason} ->
            Logger.error("Role synthesis failed: #{inspect(reason)}")
            [fallback_agent()]
        end

      # Step 2: Curriculum Planning
      curriculum_plan =
        case CurriculumPlanner.generate_plan(goal, learner_profile) do
          {:ok, plan} ->
            modules = plan["modules"] || []
            total_lessons = Enum.reduce(modules, 0, fn m, acc -> acc + length(m["lessons"] || []) end)
            total_minutes = plan["total_estimated_minutes"] || "?"

            broadcast(session_id, "agent_message", %{
              id: generate_id(),
              agent_name: "System",
              agent_role: "system",
              content: "Created a learning plan: #{length(modules)} modules, #{total_lessons} lessons (~#{total_minutes} min)",
              timestamp: System.system_time(:millisecond)
            })

            plan

          {:error, reason} ->
            Logger.error("Curriculum planner failed: #{inspect(reason)}")
            nil
        end

      # Determine first topic from curriculum
      first_topic = get_lesson_topic(curriculum_plan, 0, 0) || goal

      # Step 3: Orchestrator (now with curriculum plan)
      orchestrator_input = %{
        current_topic: first_topic,
        current_scene: nil,
        agents: agents,
        learner_state: learner_state,
        last_interaction: nil,
        goal: goal,
        curriculum_plan: curriculum_plan
      }

      decision =
        case Orchestrator.decide_next(orchestrator_input) do
          {:ok, decision} ->
            Logger.info("Orchestrator decision: #{inspect(decision["next_action"])}")
            decision

          {:error, reason} ->
            Logger.error("Orchestrator failed: #{inspect(reason)}, using fallback")
            %{
              "next_action" => %{"agent" => first_agent_name(agents), "scene" => "lecture", "action_type" => "explain"},
              "state_updates" => %{"focus_topic" => first_topic}
            }
        end

      next_action = decision["next_action"] || %{}
      agent_name = next_action["agent"] || first_agent_name(agents)
      action_type = next_action["action_type"] || "explain"
      selected_agent = find_agent(agents, agent_name)

      # Step 4: Scene Engine
      scene_spec =
        case SceneEngine.design_scene(first_topic, selected_agent, action_type, learner_state) do
          {:ok, spec} ->
            Logger.info("Scene engine designed: #{inspect((spec["scene"] || %{})["type"])}")
            spec

          {:error, reason} ->
            Logger.error("Scene engine failed: #{inspect(reason)}, using fallback")
            fallback_scene_spec_static(first_topic, selected_agent)
        end

      send(gen_server_pid, {:pipeline_started, agents, decision, scene_spec, selected_agent, curriculum_plan})
    end)
  end

  defp spawn_next_turn(state) do
    gen_server_pid = self()
    goal = state.goal
    current_topic = state.current_topic || goal
    agents = state.agents
    learner_state = state.learner_state
    last_interaction = build_last_interaction(state)
    curriculum_plan = state.curriculum_plan

    Task.start(fn ->
      orchestrator_input = %{
        current_topic: current_topic,
        current_scene: state.current_scene,
        agents: agents,
        learner_state: learner_state,
        last_interaction: last_interaction,
        goal: goal,
        curriculum_plan: curriculum_plan
      }

      decision =
        case Orchestrator.decide_next(orchestrator_input) do
          {:ok, decision} ->
            Logger.info("Orchestrator decision: #{inspect(decision["next_action"])}")
            decision

          {:error, reason} ->
            Logger.error("Orchestrator failed: #{inspect(reason)}, using fallback")
            %{
              "next_action" => %{"agent" => first_agent_name(agents), "scene" => "lecture", "action_type" => "explain"},
              "state_updates" => %{"focus_topic" => current_topic}
            }
        end

      next_action = decision["next_action"] || %{}
      agent_name = next_action["agent"] || first_agent_name(agents)
      action_type = next_action["action_type"] || "explain"
      selected_agent = find_agent(agents, agent_name)

      scene_spec =
        case SceneEngine.design_scene(current_topic, selected_agent, action_type, learner_state) do
          {:ok, spec} ->
            Logger.info("Scene engine designed: #{inspect((spec["scene"] || %{})["type"])}")
            spec

          {:error, reason} ->
            Logger.error("Scene engine failed: #{inspect(reason)}, using fallback")
            fallback_scene_spec_static(current_topic, selected_agent)
        end

      send(gen_server_pid, {:next_turn_ready, decision, scene_spec, selected_agent})
    end)
  end

  defp spawn_teaching(state, selected_agent, scene_spec) do
    session_id = state.id
    agent_name = selected_agent["name"] || "Teacher"
    agent_role = selected_agent["type"] || "teaching"
    gen_server_pid = self()
    conversation_history = state.messages
    learner_state = state.learner_state

    Task.start(fn ->
      callback = fn
        {:chunk, text} ->
          broadcast(session_id, "agent_chunk", %{
            agent_name: agent_name,
            agent_role: agent_role,
            content: text
          })

        {:done, full_text} ->
          broadcast(session_id, "agent_done", %{
            agent_name: agent_name,
            agent_role: agent_role
          })

          send(gen_server_pid, {:teaching_done, agent_name, agent_role, full_text})

        {:error, reason} ->
          Logger.error("Teaching agent streaming error: #{inspect(reason)}")

          broadcast(session_id, "agent_message", %{
            id: generate_id(),
            agent_name: "System",
            agent_role: "system",
            content: "An error occurred during teaching. Please try sending a message.",
            timestamp: System.system_time(:millisecond)
          })

          send(gen_server_pid, {:teaching_error, reason})
      end

      TeachingAgent.teach(
        selected_agent,
        scene_spec,
        conversation_history,
        learner_state,
        callback
      )
    end)
  end

  # --- Curriculum Helpers ---

  defp get_lesson_topic(nil, _mod_idx, _lesson_idx), do: nil

  defp get_lesson_topic(%{"modules" => modules}, mod_idx, lesson_idx) do
    case Enum.at(modules, mod_idx) do
      nil -> nil
      mod ->
        case Enum.at(mod["lessons"] || [], lesson_idx) do
          nil -> nil
          lesson -> lesson["title"] || lesson["concept"]
        end
    end
  end

  defp get_lesson_topic(_, _, _), do: nil

  defp advance_curriculum(%{curriculum_plan: nil} = state), do: state

  defp advance_curriculum(%{curriculum_plan: %{"modules" => modules}} = state) do
    mod_idx = state.current_module_index
    lesson_idx = state.current_lesson_index

    current_module = Enum.at(modules, mod_idx)
    lessons = (current_module && current_module["lessons"]) || []

    cond do
      # More lessons in current module
      lesson_idx + 1 < length(lessons) ->
        new_lesson_idx = lesson_idx + 1
        new_topic = get_lesson_topic(state.curriculum_plan, mod_idx, new_lesson_idx)

        %{state |
          current_lesson_index: new_lesson_idx,
          current_topic: new_topic || state.current_topic
        }

      # More modules
      mod_idx + 1 < length(modules) ->
        new_mod_idx = mod_idx + 1
        new_topic = get_lesson_topic(state.curriculum_plan, new_mod_idx, 0)

        %{state |
          current_module_index: new_mod_idx,
          current_lesson_index: 0,
          current_topic: new_topic || state.current_topic
        }

      # Curriculum complete
      true ->
        state
    end
  end

  defp advance_curriculum(state), do: state

  defp maybe_auto_advance(%{curriculum_plan: nil}), do: :ok

  defp maybe_auto_advance(state) do
    {total, completed} = curriculum_progress(state)

    if completed < total do
      # Brief pause before auto-advancing so the user can read
      Process.send_after(self(), :auto_advance, 2_000)
    else
      broadcast(state.id, "agent_message", %{
        id: generate_id(),
        agent_name: "System",
        agent_role: "system",
        content: "Curriculum complete! You've covered all #{total} lessons. Great work!",
        timestamp: System.system_time(:millisecond)
      })
    end

    :ok
  end

  defp broadcast_progress(state) do
    {total, completed} = curriculum_progress(state)

    if total > 0 do
      broadcast(state.id, "curriculum_progress", %{
        total_lessons: total,
        completed_lessons: completed,
        current_topic: state.current_topic,
        current_module_index: state.current_module_index,
        current_lesson_index: state.current_lesson_index
      })
    end
  end

  defp curriculum_progress(%{curriculum_plan: nil}), do: {0, 0}

  defp curriculum_progress(%{curriculum_plan: %{"modules" => modules}} = state) do
    total =
      Enum.reduce(modules, 0, fn m, acc ->
        acc + length(m["lessons"] || [])
      end)

    # Count lessons completed before current position
    completed =
      Enum.reduce(Enum.with_index(modules), 0, fn {mod, mod_idx}, acc ->
        lessons = mod["lessons"] || []

        cond do
          mod_idx < state.current_module_index ->
            acc + length(lessons)

          mod_idx == state.current_module_index ->
            acc + state.current_lesson_index

          true ->
            acc
        end
      end)

    {total, completed}
  end

  defp curriculum_progress(_state), do: {0, 0}

  # --- Persistence Helpers ---

  defp rebuild_from_persisted(persisted) do
    messages =
      Enum.map(persisted.messages, fn m ->
        %{role: m.role, content: m.content}
      end)

    %__MODULE__{
      id: persisted.id,
      goal: persisted.goal,
      learner_profile: persisted.learner_profile,
      agents: persisted.agents || [],
      messages: messages,
      learner_state: LearnerState.from_map(persisted.learner_state),
      curriculum_plan: persisted.curriculum_plan,
      current_module_index: persisted.current_module_index || 0,
      current_lesson_index: persisted.current_lesson_index || 0,
      current_scene: persisted.current_scene,
      current_scene_spec: persisted.current_scene_spec,
      current_topic: persisted.current_topic,
      current_agent: persisted.current_agent,
      orchestrator_decision: persisted.orchestrator_decision,
      state: String.to_existing_atom(persisted.state || "waiting")
    }
  end

  # --- Helpers ---

  defp broadcast(session_id, event, payload) do
    BackendWeb.Endpoint.broadcast("classroom:#{session_id}", event, payload)
  end

  defp generate_id do
    :crypto.strong_rand_bytes(12) |> Base.url_encode64(padding: false)
  end

  defp first_agent_name([agent | _]), do: agent["name"] || "Teacher"
  defp first_agent_name(_), do: "Teacher"

  defp find_agent(agents, name) do
    Enum.find(agents, List.first(agents) || fallback_agent(), fn agent ->
      agent["name"] == name
    end)
  end

  defp build_last_interaction(state) do
    case Enum.reverse(state.messages) do
      [last_user, last_agent | _] ->
        %{
          agent: state.current_agent || "Teacher",
          message_type: "response",
          summary:
            String.slice(to_string(last_agent[:content] || last_agent["content"]), 0, 200) <>
              " | User replied: " <>
              String.slice(to_string(last_user[:content] || last_user["content"]), 0, 200)
        }

      [last | _] ->
        %{
          agent: state.current_agent || "Learner",
          message_type: "message",
          summary: String.slice(to_string(last[:content] || last["content"]), 0, 200)
        }

      [] ->
        nil
    end
  end

  defp fallback_agent do
    %{
      "name" => "Concept Teacher",
      "type" => "teaching",
      "purpose" => "Explain concepts clearly with examples",
      "responsibility" => "Primary teaching and explanation",
      "behavior_style" => "Patient, clear, example-driven",
      "inputs" => ["topic", "learner_state"],
      "outputs" => ["explanation", "examples"],
      "activation_conditions" => ["always"],
      "collaborates_with" => [],
      "tools" => ["explain_concept"],
      "avoid" => ["being too abstract"]
    }
  end

  defp fallback_scene_spec_static(topic, selected_agent) do
    %{
      "scene" => %{
        "type" => "lecture",
        "objective" => "Introduce and explain #{topic}",
        "selected_agent" => selected_agent["name"] || "Teacher",
        "participating_agents" => [selected_agent["name"] || "Teacher"],
        "allowed_skills" => ["explain_concept", "simplify_explanation"],
        "input_requirements" => ["topic"],
        "execution_steps" => [
          "Introduce the topic with context",
          "Explain the core concept",
          "Provide a concrete example",
          "Summarize the key takeaway",
          "Ask a check question"
        ],
        "expected_outputs" => ["Clear explanation with example"],
        "entry_conditions" => ["Topic is defined"],
        "exit_conditions" => ["Learner acknowledges understanding"],
        "success_criteria" => ["Learner can restate the concept"]
      },
      "runtime_updates" => %{
        "should_capture" => ["understanding_signal"],
        "notes" => "Fallback lecture scene"
      }
    }
  end
end
