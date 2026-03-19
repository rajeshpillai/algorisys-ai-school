defmodule Backend.Classroom.Session do
  @moduledoc """
  GenServer managing an individual classroom session.
  Orchestrates the agent pipeline: role synthesis -> orchestrator -> scene engine -> teaching agent.
  Broadcasts messages via PubSub for real-time streaming to connected clients.
  """

  use GenServer

  require Logger

  alias Backend.Agents.{RoleSynthesis, Orchestrator, SceneEngine, TeachingAgent}
  alias Backend.Classroom.LearnerState

  defstruct [
    :id,
    :goal,
    :learner_profile,
    agents: [],
    messages: [],
    learner_state: %LearnerState{},
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

    state = %__MODULE__{
      id: session_id,
      goal: goal,
      learner_profile: learner_profile,
      state: :initializing
    }

    # Start the pipeline asynchronously in a Task
    spawn_pipeline(state)

    {:ok, state}
  end

  @impl true
  def handle_call(:get_state, _from, state) do
    reply = %{
      id: state.id,
      goal: state.goal,
      state: state.state,
      agents: Enum.map(state.agents, fn a -> a["name"] end),
      current_scene: state.current_scene,
      current_agent: state.current_agent,
      message_count: length(state.messages)
    }

    {:reply, reply, state}
  end

  @impl true
  def handle_cast({:message, content}, %{state: session_state} = state)
      when session_state in [:waiting, :ready] do
    user_msg = %{role: "user", content: content}
    new_state = %{state | messages: state.messages ++ [user_msg], state: :teaching}

    broadcast(state.id, {:agent_message, %{
      id: generate_id(),
      agent_name: "Learner",
      agent_role: "learner",
      content: content,
      timestamp: System.system_time(:millisecond)
    }})

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
  def handle_info({:pipeline_started, agents, decision, scene_spec, selected_agent}, state) do
    next_action = decision["next_action"] || %{}
    agent_name = next_action["agent"] || first_agent_name(agents)
    scene_type = next_action["scene"] || "lecture"

    new_state = %{state |
      agents: agents,
      orchestrator_decision: decision,
      current_scene: scene_type,
      current_scene_spec: scene_spec,
      current_topic: (decision["state_updates"] || %{})["focus_topic"] || state.goal,
      current_agent: agent_name,
      state: :teaching
    }

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

    spawn_teaching(new_state, selected_agent, scene_spec)

    {:noreply, new_state}
  end

  def handle_info({:teaching_done, agent_name, agent_role, full_text}, state) do
    agent_msg = %{role: "assistant", content: full_text}
    new_messages = state.messages ++ [agent_msg]

    broadcast(state.id, {:agent_message, %{
      id: generate_id(),
      agent_name: agent_name,
      agent_role: agent_role,
      content: full_text,
      timestamp: System.system_time(:millisecond)
    }})

    {:noreply, %{state | messages: new_messages, state: :waiting}}
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
      broadcast(session_id, {:agent_message, %{
        id: generate_id(),
        agent_name: "System",
        agent_role: "system",
        content: "Setting up your personalized learning session...",
        timestamp: System.system_time(:millisecond)
      }})

      # Step 1: Role Synthesis
      agents =
        case RoleSynthesis.generate_team(goal, learner_profile) do
          {:ok, agents} ->
            Logger.info("Generated #{length(agents)} agents")

            broadcast(session_id, {:agent_message, %{
              id: generate_id(),
              agent_name: "System",
              agent_role: "system",
              content: "Assembled a team of #{length(agents)} specialists: #{Enum.map_join(agents, ", ", & &1["name"])}",
              timestamp: System.system_time(:millisecond)
            }})

            agents

          {:error, reason} ->
            Logger.error("Role synthesis failed: #{inspect(reason)}")
            [fallback_agent()]
        end

      # Step 2: Orchestrator
      orchestrator_input = %{
        current_topic: goal,
        current_scene: nil,
        agents: agents,
        learner_state: learner_state,
        last_interaction: nil,
        goal: goal
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
              "state_updates" => %{"focus_topic" => goal}
            }
        end

      next_action = decision["next_action"] || %{}
      agent_name = next_action["agent"] || first_agent_name(agents)
      action_type = next_action["action_type"] || "explain"
      selected_agent = find_agent(agents, agent_name)

      # Step 3: Scene Engine
      scene_spec =
        case SceneEngine.design_scene(goal, selected_agent, action_type, learner_state) do
          {:ok, spec} ->
            Logger.info("Scene engine designed: #{inspect((spec["scene"] || %{})["type"])}")
            spec

          {:error, reason} ->
            Logger.error("Scene engine failed: #{inspect(reason)}, using fallback")
            fallback_scene_spec_static(goal, selected_agent)
        end

      send(gen_server_pid, {:pipeline_started, agents, decision, scene_spec, selected_agent})
    end)
  end

  defp spawn_next_turn(state) do
    gen_server_pid = self()
    goal = state.goal
    current_topic = state.current_topic || goal
    agents = state.agents
    learner_state = state.learner_state
    last_interaction = build_last_interaction(state)

    Task.start(fn ->
      orchestrator_input = %{
        current_topic: current_topic,
        current_scene: state.current_scene,
        agents: agents,
        learner_state: learner_state,
        last_interaction: last_interaction,
        goal: goal
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
          Phoenix.PubSub.broadcast(
            Backend.PubSub,
            "classroom:#{session_id}",
            {:agent_chunk, %{agent_name: agent_name, content: text}}
          )

        {:done, full_text} ->
          send(gen_server_pid, {:teaching_done, agent_name, agent_role, full_text})

          Phoenix.PubSub.broadcast(
            Backend.PubSub,
            "classroom:#{session_id}",
            {:agent_done, %{agent_name: agent_name}}
          )

        {:error, reason} ->
          Logger.error("Teaching agent streaming error: #{inspect(reason)}")

          Phoenix.PubSub.broadcast(
            Backend.PubSub,
            "classroom:#{session_id}",
            {:agent_message, %{
              id: generate_id(),
              agent_name: "System",
              agent_role: "system",
              content: "An error occurred during teaching. Please try sending a message.",
              timestamp: System.system_time(:millisecond)
            }}
          )

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

  # --- Helpers ---

  defp broadcast(session_id, message) do
    Phoenix.PubSub.broadcast(Backend.PubSub, "classroom:#{session_id}", message)
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
