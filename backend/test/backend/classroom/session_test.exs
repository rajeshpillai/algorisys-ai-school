defmodule Backend.Classroom.SessionTest do
  use Backend.DataCase, async: false

  alias Backend.Classroom.Session
  alias Backend.Classroom.SessionSupervisor
  alias Backend.Classroom.Store

  defp unique_id, do: "session-test-#{System.unique_integer([:positive])}"

  defp start_session(id, goal, profile \\ nil) do
    {:ok, pid} = SessionSupervisor.start_session(id, goal, profile)
    # Cancel the auto-scheduled :start_pipeline so LLM calls don't fire
    # The timer ref was set via Process.send_after in init
    :sys.get_state(pid)
    pid
  end

  defp get_raw_state(pid), do: :sys.get_state(pid)

  describe "start_link and init" do
    test "starts a new session with initializing state" do
      id = unique_id()
      pid = start_session(id, "Learn Elixir")

      state = get_raw_state(pid)
      assert state.id == id
      assert state.goal == "Learn Elixir"
      assert state.state == :initializing
      assert state.agents == []
      assert state.messages == []
      assert state.current_module_index == 0
      assert state.current_lesson_index == 0
    end

    test "persists session to database on init" do
      id = unique_id()
      _pid = start_session(id, "Learn Rust", "experienced dev")

      loaded = Store.load_session(id)
      assert loaded != nil
      assert loaded.goal == "Learn Rust"
      assert loaded.learner_profile == "experienced dev"
      assert loaded.state == "initializing"
    end

    test "resumes from database if session exists" do
      id = unique_id()

      # Create and populate a session in DB directly
      Store.create_session(id, "Learn Go", "beginner")
      Store.save_state(%{
        id: id, state: :waiting, agents: [%{"name" => "Go Coach"}],
        learner_state: %Backend.Classroom.LearnerState{understanding_score: 70},
        current_scene: "lecture", current_scene_spec: nil, current_topic: "goroutines",
        current_agent: "Go Coach", orchestrator_decision: nil, curriculum_plan: nil,
        current_module_index: 1, current_lesson_index: 2
      })
      Store.append_message(id, "user", "What are goroutines?")

      # Start GenServer — should resume
      {:ok, pid} = SessionSupervisor.start_session(id, "Learn Go", "beginner")
      state = get_raw_state(pid)

      assert state.state == :waiting
      assert state.current_topic == "goroutines"
      assert state.current_module_index == 1
      assert state.current_lesson_index == 2
      assert length(state.messages) == 1
      assert hd(state.agents)["name"] == "Go Coach"
    end
  end

  describe "get_state/1" do
    test "returns formatted state map" do
      id = unique_id()
      _pid = start_session(id, "Learn Python")

      result = Session.get_state(id)
      assert result.id == id
      assert result.goal == "Learn Python"
      assert result.state == :initializing
      assert result.agents == []
      assert result.message_count == 0
      assert result.curriculum.total_lessons == 0
      assert result.curriculum.completed_lessons == 0
    end

    test "returns error for nonexistent session" do
      assert {:error, :not_found} = Session.get_state("nonexistent-session")
    end
  end

  describe "handle_info :pipeline_started" do
    test "updates state with agents, curriculum, and begins teaching" do
      id = unique_id()
      pid = start_session(id, "Learn calculus")

      agents = [
        %{"name" => "Math Teacher", "type" => "teaching"},
        %{"name" => "Quiz Master", "type" => "assessment"}
      ]
      decision = %{
        "next_action" => %{"agent" => "Math Teacher", "scene" => "lecture"},
        "state_updates" => %{"focus_topic" => "Limits"}
      }
      scene_spec = %{"scene" => %{"type" => "lecture"}}
      selected_agent = %{"name" => "Math Teacher", "type" => "teaching"}
      curriculum = %{
        "modules" => [
          %{"title" => "Basics", "lessons" => [%{"title" => "Limits"}, %{"title" => "Derivatives"}]}
        ]
      }

      send(pid, {:pipeline_started, agents, decision, scene_spec, selected_agent, curriculum})
      # Give GenServer time to process
      Process.sleep(50)

      state = get_raw_state(pid)
      assert state.state == :teaching
      assert length(state.agents) == 2
      assert state.current_scene == "lecture"
      assert state.current_topic == "Limits"
      assert state.current_agent == "Math Teacher"
      assert state.curriculum_plan != nil
    end
  end

  describe "handle_info :teaching_done" do
    test "appends message, advances curriculum, transitions to awaiting_advance" do
      id = unique_id()
      pid = start_session(id, "Learn physics")

      # Set up state as if pipeline ran
      curriculum = %{
        "modules" => [
          %{"title" => "Mechanics", "lessons" => [
            %{"title" => "Newton's First Law"},
            %{"title" => "Newton's Second Law"}
          ]}
        ]
      }

      send(pid, {:pipeline_started,
        [%{"name" => "Physics Prof", "type" => "teaching"}],
        %{"next_action" => %{"agent" => "Physics Prof", "scene" => "lecture"},
          "state_updates" => %{"focus_topic" => "Newton's First Law"}},
        %{"scene" => %{"type" => "lecture"}},
        %{"name" => "Physics Prof", "type" => "teaching"},
        curriculum
      })
      Process.sleep(50)

      # Simulate teaching completion
      send(pid, {:teaching_done, "Physics Prof", "teaching", "Newton's first law states that..."})
      Process.sleep(50)

      state = get_raw_state(pid)
      # Now transitions to :awaiting_advance instead of :waiting (user confirmation needed)
      assert state.state == :awaiting_advance
      assert length(state.messages) == 1
      assert hd(state.messages).content == "Newton's first law states that..."
      # Curriculum should have advanced to next lesson
      assert state.current_lesson_index == 1
      assert state.current_topic == "Newton's Second Law"
    end

    test "persists message to database" do
      id = unique_id()
      pid = start_session(id, "Learn history")

      send(pid, {:pipeline_started,
        [%{"name" => "Historian", "type" => "teaching"}],
        %{"next_action" => %{"agent" => "Historian", "scene" => "lecture"},
          "state_updates" => %{"focus_topic" => "Ancient Rome"}},
        %{"scene" => %{"type" => "lecture"}},
        %{"name" => "Historian", "type" => "teaching"},
        nil
      })
      Process.sleep(50)

      send(pid, {:teaching_done, "Historian", "teaching", "Rome was founded in 753 BC..."})
      Process.sleep(50)

      loaded = Store.load_session(id)
      assert length(loaded.messages) == 1
      msg = hd(loaded.messages)
      assert msg.role == "assistant"
      assert msg.agent_name == "Historian"
      assert msg.content == "Rome was founded in 753 BC..."
    end
  end

  describe "handle_cast :message" do
    test "accepts messages when in waiting state and transitions to teaching" do
      id = unique_id()
      pid = start_session(id, "Learn Ruby")

      # Put session in waiting state
      send(pid, {:pipeline_started,
        [%{"name" => "Ruby Guide", "type" => "teaching"}],
        %{"next_action" => %{"agent" => "Ruby Guide", "scene" => "lecture"},
          "state_updates" => %{"focus_topic" => "Blocks"}},
        %{"scene" => %{"type" => "lecture"}},
        %{"name" => "Ruby Guide", "type" => "teaching"},
        nil
      })
      Process.sleep(50)
      send(pid, {:teaching_done, "Ruby Guide", "teaching", "Blocks are closures..."})
      Process.sleep(50)

      assert get_raw_state(pid).state == :waiting

      Session.send_message(id, "Can you explain more?")
      Process.sleep(50)

      state = get_raw_state(pid)
      assert state.state == :teaching
      assert length(state.messages) == 2
      assert List.last(state.messages) == %{role: "user", content: "Can you explain more?"}
    end

    test "ignores messages when not in waiting state" do
      id = unique_id()
      pid = start_session(id, "Learn Java")

      # Session starts in :initializing, should ignore messages
      Session.send_message(id, "Hello")
      Process.sleep(50)

      state = get_raw_state(pid)
      assert state.messages == []
    end

    test "persists user message to database" do
      id = unique_id()
      pid = start_session(id, "Learn CSS")

      # Get to waiting state
      send(pid, {:pipeline_started,
        [%{"name" => "CSS Expert", "type" => "teaching"}],
        %{"next_action" => %{"agent" => "CSS Expert", "scene" => "lecture"},
          "state_updates" => %{"focus_topic" => "Flexbox"}},
        %{"scene" => %{"type" => "lecture"}},
        %{"name" => "CSS Expert", "type" => "teaching"},
        nil
      })
      Process.sleep(50)
      send(pid, {:teaching_done, "CSS Expert", "teaching", "Flexbox is a layout model..."})
      Process.sleep(50)

      Session.send_message(id, "How do I center a div?")
      Process.sleep(50)

      loaded = Store.load_session(id)
      user_msgs = Enum.filter(loaded.messages, &(&1.role == "user"))
      assert length(user_msgs) == 1
      assert hd(user_msgs).content == "How do I center a div?"
    end
  end

  describe "error handling" do
    test "teaching_error transitions back to waiting" do
      id = unique_id()
      pid = start_session(id, "Learn SQL")

      # Put in teaching state
      send(pid, {:pipeline_started,
        [%{"name" => "DB Expert", "type" => "teaching"}],
        %{"next_action" => %{"agent" => "DB Expert", "scene" => "lecture"},
          "state_updates" => %{"focus_topic" => "JOINs"}},
        %{"scene" => %{"type" => "lecture"}},
        %{"name" => "DB Expert", "type" => "teaching"},
        nil
      })
      Process.sleep(50)
      assert get_raw_state(pid).state == :teaching

      send(pid, {:teaching_error, :timeout})
      Process.sleep(50)

      assert get_raw_state(pid).state == :waiting
    end

    test "pipeline_error transitions back to waiting" do
      id = unique_id()
      pid = start_session(id, "Learn Haskell")

      send(pid, {:pipeline_error, :llm_unavailable})
      Process.sleep(50)

      assert get_raw_state(pid).state == :waiting
    end
  end

  describe "curriculum progression" do
    test "advances through lessons within a module" do
      id = unique_id()
      pid = start_session(id, "Learn math")

      curriculum = %{
        "modules" => [
          %{"title" => "Algebra", "lessons" => [
            %{"title" => "Variables"},
            %{"title" => "Equations"},
            %{"title" => "Inequalities"}
          ]}
        ]
      }

      # Start pipeline
      send(pid, {:pipeline_started,
        [%{"name" => "Math Prof", "type" => "teaching"}],
        %{"next_action" => %{"agent" => "Math Prof", "scene" => "lecture"},
          "state_updates" => %{"focus_topic" => "Variables"}},
        %{"scene" => %{"type" => "lecture"}},
        %{"name" => "Math Prof", "type" => "teaching"},
        curriculum
      })
      Process.sleep(50)

      # Complete lesson 1
      send(pid, {:teaching_done, "Math Prof", "teaching", "Variables lesson done"})
      Process.sleep(50)
      state = get_raw_state(pid)
      assert state.current_lesson_index == 1
      assert state.current_topic == "Equations"

      # Simulate auto-advance → teaching → done for lesson 2
      send(pid, {:next_turn_ready,
        %{"next_action" => %{"agent" => "Math Prof", "scene" => "lecture"},
          "state_updates" => %{"focus_topic" => "Equations"}},
        %{"scene" => %{"type" => "lecture"}},
        %{"name" => "Math Prof", "type" => "teaching"}
      })
      Process.sleep(50)
      send(pid, {:teaching_done, "Math Prof", "teaching", "Equations lesson done"})
      Process.sleep(50)

      state = get_raw_state(pid)
      assert state.current_lesson_index == 2
      assert state.current_topic == "Inequalities"
    end

    test "advances to next module when current module is complete" do
      id = unique_id()
      pid = start_session(id, "Learn science")

      curriculum = %{
        "modules" => [
          %{"title" => "Physics", "lessons" => [%{"title" => "Forces"}]},
          %{"title" => "Chemistry", "lessons" => [%{"title" => "Atoms"}]}
        ]
      }

      send(pid, {:pipeline_started,
        [%{"name" => "Sci Teacher", "type" => "teaching"}],
        %{"next_action" => %{"agent" => "Sci Teacher", "scene" => "lecture"},
          "state_updates" => %{"focus_topic" => "Forces"}},
        %{"scene" => %{"type" => "lecture"}},
        %{"name" => "Sci Teacher", "type" => "teaching"},
        curriculum
      })
      Process.sleep(50)

      # Complete only lesson in module 1
      send(pid, {:teaching_done, "Sci Teacher", "teaching", "Forces done"})
      Process.sleep(50)

      state = get_raw_state(pid)
      assert state.current_module_index == 1
      assert state.current_lesson_index == 0
      assert state.current_topic == "Atoms"
    end

    test "curriculum_progress reports correct totals" do
      id = unique_id()
      pid = start_session(id, "Learn languages")

      curriculum = %{
        "modules" => [
          %{"title" => "Greetings", "lessons" => [%{"title" => "Hello"}, %{"title" => "Goodbye"}]},
          %{"title" => "Numbers", "lessons" => [%{"title" => "1-10"}, %{"title" => "11-100"}]}
        ]
      }

      send(pid, {:pipeline_started,
        [%{"name" => "Language Teacher", "type" => "teaching"}],
        %{"next_action" => %{"agent" => "Language Teacher", "scene" => "lecture"},
          "state_updates" => %{"focus_topic" => "Hello"}},
        %{"scene" => %{"type" => "lecture"}},
        %{"name" => "Language Teacher", "type" => "teaching"},
        curriculum
      })
      Process.sleep(50)

      result = Session.get_state(id)
      assert result.curriculum.total_lessons == 4
      assert result.curriculum.completed_lessons == 0

      # Complete first lesson
      send(pid, {:teaching_done, "Language Teacher", "teaching", "Hello lesson done"})
      Process.sleep(50)

      result = Session.get_state(id)
      assert result.curriculum.completed_lessons == 1
    end
  end

  describe "advance confirmation" do
    test "teaching_done with curriculum transitions to awaiting_advance" do
      id = unique_id()
      pid = start_session(id, "Learn CSS")

      curriculum = %{
        "modules" => [
          %{"title" => "Layout", "lessons" => [
            %{"title" => "Flexbox"},
            %{"title" => "Grid"}
          ]}
        ]
      }

      send(pid, {:pipeline_started,
        [%{"name" => "CSS Expert", "type" => "teaching"}],
        %{"next_action" => %{"agent" => "CSS Expert", "scene" => "lecture"},
          "state_updates" => %{"focus_topic" => "Flexbox"}},
        %{"scene" => %{"type" => "lecture"}},
        %{"name" => "CSS Expert", "type" => "teaching"},
        curriculum
      })
      Process.sleep(50)

      send(pid, {:teaching_done, "CSS Expert", "teaching", "Flexbox explained..."})
      Process.sleep(50)

      assert get_raw_state(pid).state == :awaiting_advance
    end

    test "continue action triggers advance from awaiting_advance" do
      id = unique_id()
      pid = start_session(id, "Learn JS")

      curriculum = %{
        "modules" => [
          %{"title" => "Basics", "lessons" => [
            %{"title" => "Variables"},
            %{"title" => "Functions"}
          ]}
        ]
      }

      send(pid, {:pipeline_started,
        [%{"name" => "JS Coach", "type" => "teaching"}],
        %{"next_action" => %{"agent" => "JS Coach", "scene" => "lecture"},
          "state_updates" => %{"focus_topic" => "Variables"}},
        %{"scene" => %{"type" => "lecture"}},
        %{"name" => "JS Coach", "type" => "teaching"},
        curriculum
      })
      Process.sleep(50)

      send(pid, {:teaching_done, "JS Coach", "teaching", "Variables explained..."})
      Process.sleep(50)
      assert get_raw_state(pid).state == :awaiting_advance

      # User confirms advance
      Session.send_action(id, "continue")
      Process.sleep(50)

      assert get_raw_state(pid).state == :teaching
    end

    test "user can send message during awaiting_advance" do
      id = unique_id()
      pid = start_session(id, "Learn SQL")

      curriculum = %{
        "modules" => [
          %{"title" => "Queries", "lessons" => [
            %{"title" => "SELECT"},
            %{"title" => "WHERE"}
          ]}
        ]
      }

      send(pid, {:pipeline_started,
        [%{"name" => "DB Expert", "type" => "teaching"}],
        %{"next_action" => %{"agent" => "DB Expert", "scene" => "lecture"},
          "state_updates" => %{"focus_topic" => "SELECT"}},
        %{"scene" => %{"type" => "lecture"}},
        %{"name" => "DB Expert", "type" => "teaching"},
        curriculum
      })
      Process.sleep(50)

      send(pid, {:teaching_done, "DB Expert", "teaching", "SELECT explained..."})
      Process.sleep(50)
      assert get_raw_state(pid).state == :awaiting_advance

      # User asks follow-up question instead of continuing
      Session.send_message(id, "Can you explain JOINs?")
      Process.sleep(50)

      state = get_raw_state(pid)
      assert state.state == :teaching
      assert length(state.messages) == 2
    end

    test "teaching_done without curriculum stays in waiting" do
      id = unique_id()
      pid = start_session(id, "Learn Docker")

      send(pid, {:pipeline_started,
        [%{"name" => "DevOps Guide", "type" => "teaching"}],
        %{"next_action" => %{"agent" => "DevOps Guide", "scene" => "lecture"},
          "state_updates" => %{"focus_topic" => "Containers"}},
        %{"scene" => %{"type" => "lecture"}},
        %{"name" => "DevOps Guide", "type" => "teaching"},
        nil
      })
      Process.sleep(50)

      send(pid, {:teaching_done, "DevOps Guide", "teaching", "Containers explained..."})
      Process.sleep(50)

      assert get_raw_state(pid).state == :waiting
    end
  end
end
