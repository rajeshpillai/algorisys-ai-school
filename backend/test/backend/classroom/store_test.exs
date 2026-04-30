defmodule Backend.Classroom.StoreTest do
  use Backend.DataCase, async: true

  alias Backend.Classroom.Store
  alias Backend.Classroom.LearnerState

  defp unique_id, do: "test-#{System.unique_integer([:positive])}"

  describe "create_session/3" do
    test "creates a session with required fields" do
      id = unique_id()
      assert {:ok, session} = Store.create_session(id, "Learn Elixir", "beginner")

      assert session.id == id
      assert session.goal == "Learn Elixir"
      assert session.learner_profile == "beginner"
      assert session.state == "initializing"
      assert session.agents == []
      assert session.current_module_index == 0
      assert session.current_lesson_index == 0
    end

    test "initializes default learner state" do
      id = unique_id()
      {:ok, session} = Store.create_session(id, "Learn Rust", nil)

      ls = session.learner_state
      # Ecto returns atom keys for freshly inserted records
      assert (ls["understanding_score"] || ls[:understanding_score]) == 50
      assert (ls["confidence"] || ls[:confidence]) == 50
      assert (ls["fatigue"] || ls[:fatigue]) == 0
      assert (ls["preferred_style"] || ls[:preferred_style]) == "examples"
      assert (ls["known_concepts"] || ls[:known_concepts]) == []
    end

    test "allows nil learner_profile" do
      id = unique_id()
      assert {:ok, session} = Store.create_session(id, "Learn Go", nil)
      assert is_nil(session.learner_profile)
    end

    test "rejects duplicate session id" do
      id = unique_id()
      {:ok, _} = Store.create_session(id, "Learn Python", nil)

      assert_raise Ecto.ConstraintError, fn ->
        Store.create_session(id, "Learn Python again", nil)
      end
    end
  end

  describe "load_session/1" do
    test "returns nil for nonexistent session" do
      assert is_nil(Store.load_session("nonexistent-id"))
    end

    test "loads a created session with preloaded messages" do
      id = unique_id()
      {:ok, _} = Store.create_session(id, "Learn calculus", "math student")

      loaded = Store.load_session(id)
      assert loaded.id == id
      assert loaded.goal == "Learn calculus"
      assert loaded.messages == []
    end

    test "loads messages ordered by position" do
      id = unique_id()
      {:ok, _} = Store.create_session(id, "Test ordering", nil)

      Store.append_message(id, "user", "first message")
      Store.append_message(id, "assistant", "second message", "Teacher", "teacher")
      Store.append_message(id, "user", "third message")

      loaded = Store.load_session(id)
      assert length(loaded.messages) == 3

      positions = Enum.map(loaded.messages, & &1.position)
      assert positions == [1, 2, 3]

      contents = Enum.map(loaded.messages, & &1.content)
      assert contents == ["first message", "second message", "third message"]
    end
  end

  describe "append_message/5" do
    test "appends a user message" do
      id = unique_id()
      {:ok, _} = Store.create_session(id, "Test messages", nil)

      assert {:ok, msg} = Store.append_message(id, "user", "Hello teacher")
      assert msg.session_id == id
      assert msg.role == "user"
      assert msg.content == "Hello teacher"
      assert msg.position == 1
      assert is_nil(msg.agent_name)
      assert is_nil(msg.agent_role)
    end

    test "appends an assistant message with agent info" do
      id = unique_id()
      {:ok, _} = Store.create_session(id, "Test agent msg", nil)

      assert {:ok, msg} = Store.append_message(id, "assistant", "Welcome!", "Prof Oak", "teacher")
      assert msg.agent_name == "Prof Oak"
      assert msg.agent_role == "teacher"
    end

    test "auto-increments position" do
      id = unique_id()
      {:ok, _} = Store.create_session(id, "Test positions", nil)

      {:ok, m1} = Store.append_message(id, "user", "msg 1")
      {:ok, m2} = Store.append_message(id, "assistant", "msg 2")
      {:ok, m3} = Store.append_message(id, "user", "msg 3")

      assert m1.position == 1
      assert m2.position == 2
      assert m3.position == 3
    end

    test "rejects invalid role" do
      id = unique_id()
      {:ok, _} = Store.create_session(id, "Test invalid role", nil)

      assert {:error, changeset} = Store.append_message(id, "invalid_role", "bad msg")
      assert changeset.valid? == false
    end
  end

  describe "save_state/1" do
    test "updates session fields from GenServer state" do
      id = unique_id()
      {:ok, _} = Store.create_session(id, "Learn physics", nil)

      gen_state = %{
        id: id,
        state: :teaching,
        agents: [%{"name" => "Physics Coach", "role" => "teacher"}],
        learner_state: %LearnerState{understanding_score: 75, confidence: 60},
        current_scene: "lecture",
        current_scene_spec: %{"type" => "lecture", "topic" => "Newton's Laws"},
        current_topic: "Newton's Laws",
        current_agent: "Physics Coach",
        orchestrator_decision: %{"action" => "teach", "agent" => "Physics Coach"},
        curriculum_plan: %{"modules" => [%{"title" => "Mechanics"}]},
        current_module_index: 0,
        current_lesson_index: 1
      }

      assert {:ok, updated} = Store.save_state(gen_state)
      assert updated.state == "teaching"
      assert updated.current_scene == "lecture"
      assert updated.current_topic == "Newton's Laws"
      assert updated.current_agent == "Physics Coach"
      assert updated.current_module_index == 0
      assert updated.current_lesson_index == 1
      assert length(updated.agents) == 1
      ls = updated.learner_state
      assert (ls["understanding_score"] || ls[:understanding_score]) == 75
      cp = updated.curriculum_plan
      assert (cp["modules"] || cp[:modules]) |> length() == 1
    end

    test "returns error for nonexistent session" do
      gen_state = %{
        id: "nonexistent-save-id",
        state: :teaching,
        agents: [],
        learner_state: %LearnerState{},
        current_scene: nil,
        current_scene_spec: nil,
        current_topic: nil,
        current_agent: nil,
        orchestrator_decision: nil,
        curriculum_plan: nil,
        current_module_index: 0,
        current_lesson_index: 0
      }

      assert {:error, :not_found} = Store.save_state(gen_state)
    end

    test "persists state transitions correctly" do
      id = unique_id()
      {:ok, _} = Store.create_session(id, "State transitions", nil)

      # Transition to teaching
      {:ok, _} =
        Store.save_state(%{
          id: id,
          state: :teaching,
          agents: [],
          learner_state: %LearnerState{},
          current_scene: "intro",
          current_scene_spec: nil,
          current_topic: "basics",
          current_agent: "Teacher",
          orchestrator_decision: nil,
          curriculum_plan: nil,
          current_module_index: 0,
          current_lesson_index: 0
        })

      loaded = Store.load_session(id)
      assert loaded.state == "teaching"
      assert loaded.current_topic == "basics"

      # Transition to waiting
      {:ok, _} =
        Store.save_state(%{
          id: id,
          state: :waiting,
          agents: [],
          learner_state: %LearnerState{},
          current_scene: "intro",
          current_scene_spec: nil,
          current_topic: "basics",
          current_agent: nil,
          orchestrator_decision: nil,
          curriculum_plan: nil,
          current_module_index: 0,
          current_lesson_index: 0
        })

      loaded = Store.load_session(id)
      assert loaded.state == "waiting"
      assert is_nil(loaded.current_agent)
    end
  end

  describe "round-trip integrity" do
    test "create → append messages → save state → load preserves everything" do
      id = unique_id()

      # Create
      {:ok, _} = Store.create_session(id, "Full round trip", "experienced dev")

      # Append messages
      {:ok, _} = Store.append_message(id, "user", "Teach me Elixir")

      {:ok, _} =
        Store.append_message(
          id,
          "assistant",
          "Let's start with pattern matching!",
          "Elixir Guide",
          "teacher"
        )

      # Save state
      {:ok, _} =
        Store.save_state(%{
          id: id,
          state: :teaching,
          agents: [%{"name" => "Elixir Guide", "role" => "teacher"}],
          learner_state: %LearnerState{understanding_score: 65, topics_completed: ["intro"]},
          current_scene: "lecture",
          current_scene_spec: %{"type" => "lecture"},
          current_topic: "Pattern Matching",
          current_agent: "Elixir Guide",
          orchestrator_decision: %{"action" => "teach"},
          curriculum_plan: %{
            "modules" => [%{"title" => "Basics", "lessons" => ["Intro", "Pattern Matching"]}]
          },
          current_module_index: 0,
          current_lesson_index: 1
        })

      # Load and verify full state
      loaded = Store.load_session(id)
      assert loaded.goal == "Full round trip"
      assert loaded.learner_profile == "experienced dev"
      assert loaded.state == "teaching"
      assert loaded.current_topic == "Pattern Matching"
      assert loaded.current_lesson_index == 1
      ls = loaded.learner_state
      assert (ls["understanding_score"] || ls[:understanding_score]) == 65
      assert (ls["topics_completed"] || ls[:topics_completed]) == ["intro"]
      assert length(loaded.messages) == 2
      assert hd(loaded.messages).content == "Teach me Elixir"
      assert List.last(loaded.messages).agent_name == "Elixir Guide"
    end
  end
end
