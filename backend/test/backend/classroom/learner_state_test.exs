defmodule Backend.Classroom.LearnerStateTest do
  use ExUnit.Case, async: true

  alias Backend.Classroom.LearnerState

  describe "to_map/1" do
    test "converts default struct to map" do
      map = LearnerState.to_map(%LearnerState{})

      assert map.understanding_score == 50
      assert map.confidence == 50
      assert map.fatigue == 0
      assert map.known_concepts == []
      assert map.misconceptions == []
      assert map.preferred_style == "examples"
      assert is_nil(map.time_remaining)
      assert map.topics_completed == []
      assert map.quiz_history == []
      assert map.recent_errors == []
    end

    test "converts customized struct to map" do
      state = %LearnerState{
        understanding_score: 80,
        confidence: 70,
        fatigue: 20,
        known_concepts: ["variables", "functions"],
        preferred_style: "visual",
        topics_completed: ["intro"]
      }

      map = LearnerState.to_map(state)
      assert map.understanding_score == 80
      assert map.known_concepts == ["variables", "functions"]
      assert map.preferred_style == "visual"
    end
  end

  describe "from_map/1" do
    test "returns default struct for nil" do
      state = LearnerState.from_map(nil)
      assert state == %LearnerState{}
    end

    test "rebuilds struct from string-keyed map" do
      map = %{
        "understanding_score" => 75,
        "confidence" => 60,
        "fatigue" => 10,
        "known_concepts" => ["loops"],
        "misconceptions" => ["off-by-one"],
        "preferred_style" => "hands-on",
        "time_remaining" => "2 hours",
        "topics_completed" => ["basics"],
        "quiz_history" => [%{"score" => 80}],
        "recent_errors" => ["syntax error"]
      }

      state = LearnerState.from_map(map)
      assert state.understanding_score == 75
      assert state.confidence == 60
      assert state.fatigue == 10
      assert state.known_concepts == ["loops"]
      assert state.misconceptions == ["off-by-one"]
      assert state.preferred_style == "hands-on"
      assert state.time_remaining == "2 hours"
      assert state.topics_completed == ["basics"]
      assert state.quiz_history == [%{"score" => 80}]
      assert state.recent_errors == ["syntax error"]
    end

    test "uses defaults for missing keys" do
      state = LearnerState.from_map(%{})

      assert state.understanding_score == 50
      assert state.confidence == 50
      assert state.fatigue == 0
      assert state.known_concepts == []
      assert state.preferred_style == "examples"
    end

    test "round-trips through to_map and from_map" do
      original = %LearnerState{
        understanding_score: 90,
        confidence: 85,
        known_concepts: ["recursion", "pattern matching"],
        topics_completed: ["basics", "functions"]
      }

      # to_map produces atom keys, from_map expects string keys (JSONB round-trip)
      map = LearnerState.to_map(original)
      json_map = map |> Jason.encode!() |> Jason.decode!()
      restored = LearnerState.from_map(json_map)

      assert restored.understanding_score == original.understanding_score
      assert restored.confidence == original.confidence
      assert restored.known_concepts == original.known_concepts
      assert restored.topics_completed == original.topics_completed
    end
  end
end
