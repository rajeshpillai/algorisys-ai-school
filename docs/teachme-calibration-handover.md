# Handover — Porting teachme's calibration into ai-school

> **Status:** Plan ready, **no code written yet.** This doc is a handover from a session that
> analyzed the `teachme` skill against this repo's orchestration. Pick up here and implement.
> **Decision (confirmed with user):** implement all three changes **in this repo**
> (`algorisys-ai-school-trial`).

## Background — what was compared

`teachme` (a Claude Code skill at `~/lab/skills/teachme`) teaches via a **fade**:
worked example (*I do*) → faded/completion example (*we do*) → independent problem (*you do*),
calibrated to a 3-bucket level (novice / developing / proficient) by **explicit, symmetric rules**
("each success: show less, ask more, raise difficulty; each failure: shrink the step, add an
example back").

This repo calibrates via a two-stage LLM pipeline: **Learner Model** scores the learner and emits
signals → **Orchestrator** picks the next agent/scene/adaptation. Richer state (continuous 0–100
scores, per-concept misconceptions, quiz history) but **judgment-driven**, not rule-driven.

### The core finding (this is *why* we're doing #1)

The Learner Model computes 8 carefully-thresholded **signals** — but they are **only logged and
then discarded**. They never reach the Orchestrator.

- [`learner_model.ex:143`](../backend/lib/backend/agents/learner_model.ex#L143) `log_signals/2`
  logs the active signals and returns nothing from them. `apply_response/3` returns only the merged
  `%LearnerState{}` — signals are dropped.
- [`orchestrator.ex:57`](../backend/lib/backend/agents/orchestrator.ex#L57) `build_input/1` passes
  only `understanding_score, confidence, fatigue, recent_errors, time_remaining, preferred_style`
  to the LLM — **no signals, no misconceptions, no known_concepts**.

So the two-stage architecture is, in practice, a one-stage judgment call with extra logging. The
only place a computed value deterministically drives behavior is quiz difficulty
([`session.ex:730`](../backend/lib/backend/classroom/session.ex#L730)).

Also missing entirely: **the fade**. Scenes are selected from a flat menu by momentary *need*
("confusion → Simplifier"), never by *position in a progression*. That's #2.

---

## The three changes (do them in this order — they have a real dependency)

```
#1 signals flow  →  #3 guardrails  →  #2 the fade
   (the fix)         (cheap, indep)     (depends on #1's signals reaching the decision layer)
```

`#2` depends on `#1`: a `scaffold_level` that advances on success needs `mastery_detected` /
`ready_to_advance` to actually reach the decision layer first. Do not build #2 on the
discarded-signals plumbing.

Project policy (CLAUDE.md): **TDD** — write/extend tests first. Touch points already have tests:
`backend/test/backend/classroom/learner_state_test.exs`,
`.../agents/learner_model_test.exs`, `.../agents/orchestrator_test.exs`,
`.../agents/scene_engine_test.exs`. `LearnerModel.apply_response/3` is already public *specifically*
so the merge logic is unit-testable without an LLM call — lean on that.

---

### #1 — Make signals load-bearing (non-negotiable; fixes a latent bug)

**a. `LearnerState` struct** — [`learner_state.ex`](../backend/lib/backend/classroom/learner_state.ex)
- Add field `signals: %{}` (full map of the 8 booleans, string keys; LLM produces the current view →
  replace wholesale, don't merge).
- Update `defstruct`, `@type t`, `to_map/1`, `from_map/1` (JSONB round-trip; default `%{}`).
- (`misconceptions` and `known_concepts` already exist on the struct — they just aren't *passed on*.)

**b. `LearnerModel.apply_response/3`** — [`learner_model.ex:74`](../backend/lib/backend/agents/learner_model.ex#L74)
- Keep `log_signals/2`. After building the merged struct, **capture** signals onto it:
  ```elixir
  signals = extract_signals(response)            # response["signals"] || response[:signals] || %{}, stringify keys
  merged  = LearnerState.merge_updates(prior_state, normalized)
  {:ok, %{merged | signals: signals}}
  ```
- Extend `learner_model_test.exs`: assert `apply_response` surfaces `signals` onto the returned state.

**c. `Orchestrator.build_input/1`** — [`orchestrator.ex:57`](../backend/lib/backend/agents/orchestrator.ex#L57)
- Add to the `learner_state:` sub-map: `signals: learner.signals`, `misconceptions: learner.misconceptions`,
  `known_concepts: learner.known_concepts`.

**d. `orchestrator-agent.md`** — [system prompt](../system-prompts/orchestrator-agent.md)
- Document the new `learner_state.signals` / `misconceptions` / `known_concepts` input fields.
- Add a rule: **honor the signals** (e.g. `needs_remediation` → revisit, `mastery_detected` →
  accelerate / fade) rather than re-deriving from raw scores.

**e. Deterministic pre-filter** in `session.ex` (the teachme "rules over judgment" move)
- Add a small pure helper, e.g. `deterministic_override(learner_state)` returning an optional
  decision map. Start conservative — **one rule**: `needs_break` (signal) ⇒ force a `recap` scene
  (action `recap`) and **skip the Orchestrator LLM call** entirely.
- Wire it into both `spawn_pipeline` and `spawn_next_turn` just before
  `Orchestrator.decide_next(...)` ([`session.ex:520`](../backend/lib/backend/classroom/session.ex#L520)
  and [`:592`](../backend/lib/backend/classroom/session.ex#L592)): if an override exists, use it as
  `decision`; otherwise call the LLM as today. Keep the function extensible (more gates later).

---

### #3 — Stop-asking switch + anti-patterns (prompt-only, independent, cheap)

Edit **`teaching-agent.md`** — [system prompt](../system-prompts/teaching-agent.md). Add two blocks
(port wholesale from teachme `references/socratic-method.md`):

1. **"When to stop asking and just tell"** — tell *cleanly and fully*, then hand control back with a
   question. Triggers: learner lacks an un-derivable prerequisite; frustrated / looping / asked
   twice for the answer; the thing is arbitrary (syntax, an API name — nothing to reason out); they
   came for a result not a lesson. This is the guard against Socratic *stonewalling*.
2. **Anti-patterns (do NOT do)** — the guessing game (rejecting all answers but the one word in your
   head), Socratic stonewalling, interrogation (rapid-fire questions with no worked material),
   false praise ("Great!" for a wrong answer), two-new-things-at-once.

These complement the existing `## THINGS TO AVOID` block; keep that, add these.

---

### #2 — The fade as a first-class `scaffold_level` (the real project; depends on #1)

**a. `LearnerState`** — add `scaffold_level: "worked"` (one of `"worked" | "faded" | "independent"`;
default `"worked"` = novice, show more). Add to `defstruct`, `@type`, `to_map`, `from_map`.

**b. Deterministic transition** — pure, unit-testable function on `LearnerState`, e.g.
`recalc_scaffold(state)` that reads `state.signals` and steps the level:
- `mastery_detected` **or** `ready_to_advance` ⇒ advance one notch (worked→faded→independent).
- `needs_remediation` **or** `needs_simplification` ⇒ revert one notch (independent→faded→worked).
- else unchanged. (Symmetric, exactly like teachme's success/failure rules.)
Call it in `LearnerModel.apply_response/3` right after signals are set, so the returned state is
fully derived in one place: `{:ok, merged |> Map.put(:signals, signals) |> LearnerState.recalc_scaffold()}`.
Unit-test the transitions in `learner_state_test.exs`.

**c. Wire `scaffold_level` into the decision + design layers**
- `Orchestrator.build_input` — add `scaffold_level`; in `orchestrator-agent.md` explain it maps to
  *I-do / we-do / you-do* and should bias scene/action choice.
- `SceneEngine.build_input` — [`scene_engine.ex:65`](../backend/lib/backend/agents/scene_engine.ex#L65)
  add `scaffold_level` to the `learner_state:` sub-map; in `scene-engine.md` instruct: `worked` ⇒
  fully worked example w/ self-explanation prompts; `faded` ⇒ completion problem (blank the last
  step first, then earlier); `independent` ⇒ pose a fresh problem, minimal scaffold.
- `teaching-agent.md` — add `scaffold_level` to the documented `learner_state` input and a behavior
  rule mirroring the three modes (this ties #2 to #3's edits).

---

## Architectural through-line (the "why", keep it in mind while editing)

- **teachme trusts rules; ai-school trusts judgment.** These changes don't replace the LLM
  judgment — they add a thin deterministic spine (signals that actually flow, a `needs_break` gate,
  a `scaffold_level` fade) *under* it, so quality doesn't depend on the Orchestrator making a good
  call every single turn.
- **ai-school's richer state is currently underused** — it dies at the Orchestrator boundary. #1
  is mostly about *consuming* state the system already computes.
- **The missing primitive is the fade** — #2 gives the system the *motion* (progression) it lacks;
  today `understanding_score: 75` says "doing well" but nothing says "therefore remove a scaffold."

## Suggested commit slicing

1. `#1` signals flow + deterministic `needs_break` gate (+ tests) — self-contained, shippable alone.
2. `#3` teaching-agent guardrails — prompt-only, independent.
3. `#2` scaffold_level fade across struct / learner-model / orchestrator / scene-engine / prompts
   (+ transition tests) — the big one, builds on #1.

## Verify

`cd backend && mix test` (fast: `--exclude llm_integration`). Confirm the Elixir toolchain is present
first (`.tool-versions` pins it); the analysis session was launched from a different working dir and
did not run `mix`.
