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

  describe "merge_updates/2" do
    test "updates only the fields present in the partial map" do
      state = %LearnerState{understanding_score: 50, confidence: 60, preferred_style: "examples"}

      result = LearnerState.merge_updates(state, %{"understanding_score" => 75})

      assert result.understanding_score == 75
      assert result.confidence == 60
      assert result.preferred_style == "examples"
    end

    test "clamps numeric scores to 0..100" do
      state = %LearnerState{}

      assert LearnerState.merge_updates(state, %{"understanding_score" => 150}).understanding_score ==
               100

      assert LearnerState.merge_updates(state, %{"fatigue" => -10}).fatigue == 0
      assert LearnerState.merge_updates(state, %{"confidence" => 0}).confidence == 0
    end

    test "ignores non-integer score values" do
      state = %LearnerState{understanding_score: 50}

      assert LearnerState.merge_updates(state, %{"understanding_score" => "high"}).understanding_score ==
               50

      assert LearnerState.merge_updates(state, %{"understanding_score" => nil}).understanding_score ==
               50
    end

    test "union-merges known_concepts without duplicates" do
      state = %LearnerState{known_concepts: ["variables", "functions"]}

      result =
        LearnerState.merge_updates(state, %{"known_concepts" => ["functions", "loops"]})

      assert result.known_concepts == ["variables", "functions", "loops"]
    end

    test "union-merges topics_completed" do
      state = %LearnerState{topics_completed: ["intro"]}

      result =
        LearnerState.merge_updates(state, %{"topics_completed" => ["intro", "advanced"]})

      assert result.topics_completed == ["intro", "advanced"]
    end

    test "replaces misconceptions wholesale" do
      state = %LearnerState{misconceptions: ["old-belief", "another-old"]}

      result =
        LearnerState.merge_updates(state, %{"misconceptions" => ["new-belief"]})

      assert result.misconceptions == ["new-belief"]
    end

    test "replaces recent_errors wholesale" do
      state = %LearnerState{recent_errors: ["err1", "err2"]}

      result = LearnerState.merge_updates(state, %{"recent_errors" => []})

      assert result.recent_errors == []
    end

    test "appends quiz_history entries" do
      state = %LearnerState{quiz_history: [%{"score" => 70}]}

      result =
        LearnerState.merge_updates(state, %{"quiz_history" => [%{"score" => 85}]})

      assert result.quiz_history == [%{"score" => 70}, %{"score" => 85}]
    end

    test "accepts atom-keyed updates" do
      state = %LearnerState{}

      result =
        LearnerState.merge_updates(state, %{understanding_score: 80, known_concepts: ["x"]})

      assert result.understanding_score == 80
      assert result.known_concepts == ["x"]
    end

    test "ignores unknown keys" do
      state = %LearnerState{understanding_score: 50}

      result = LearnerState.merge_updates(state, %{"random_field" => "ignored"})

      assert result == state
    end

    test "preserves preferred_style when not provided" do
      state = %LearnerState{preferred_style: "visual"}

      result = LearnerState.merge_updates(state, %{"understanding_score" => 90})

      assert result.preferred_style == "visual"
    end

    test "updates time_remaining including explicit nil" do
      state = %LearnerState{time_remaining: "1 hour"}

      assert LearnerState.merge_updates(state, %{"time_remaining" => "30 min"}).time_remaining ==
               "30 min"

      assert LearnerState.merge_updates(state, %{"time_remaining" => nil}).time_remaining ==
               nil
    end

    test "filters non-binary entries from string list updates" do
      state = %LearnerState{}

      result =
        LearnerState.merge_updates(state, %{
          "known_concepts" => ["valid", 42, nil],
          "misconceptions" => ["m1", :atom]
        })

      assert result.known_concepts == ["valid"]
      assert result.misconceptions == ["m1"]
    end

    test "is a no-op when updates is not a map" do
      state = %LearnerState{understanding_score: 75}
      assert LearnerState.merge_updates(state, nil) == state
      assert LearnerState.merge_updates(state, "garbage") == state
    end
  end
end
