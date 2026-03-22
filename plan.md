# AI School — Implementation Plan

## Context

We're building an open AI school platform — a multi-agent interactive classroom that can teach **any subject** (math, history, science, languages, programming, etc.), not just coding. Existing kata projects (react-katas, nodejs-katas, golang-katas, etc.) serve as reference for frontend patterns.

We use a **dynamic agent generation system** — agents are synthesized per-session based on learner profile, topic, and constraints. Content can be curated (markdown) or AI-generated.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│  Frontend (SolidJS + TailwindCSS v4 + Vite)              │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Landing  │  │  Course   │  │ Lesson   │  │Classroom│  │
│  │  Page    │  │  Browser  │  │  Page    │  │  Page   │  │
│  └──────────┘  └───────────┘  └──────────┘  └─────────┘  │
│         CodeMirror | Chat Stream | Quiz | Slides          │
└────────────────────────┬─────────────────────────────────┘
                         │ REST + SSE
┌────────────────────────┴─────────────────────────────────┐
│  Backend (Elixir + Phoenix)                               │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Content  │  │  Agent    │  │ Sandbox  │  │  Scene  │  │
│  │ Loader   │  │Orchestrat.│  │ Executor │  │  Engine │  │
│  └──────────┘  └───────────┘  └──────────┘  └─────────┘  │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐               │
│  │   Role   │  │  Learner  │  │   LLM    │               │
│  │Synthesis │  │  Model    │  │  Client  │               │
│  └──────────┘  └───────────┘  └──────────┘               │
│         LLM Client (OpenAI / Anthropic / Ollama)          │
└──────────────────────────────────────────────────────────┘
                         │
┌────────────────────────┴─────────────────────────────────┐
│  System Prompts (agent behavior definitions)              │
│  Content (Markdown + YAML frontmatter)                    │
└──────────────────────────────────────────────────────────┘
```

---

## Multi-Agent Pipeline

The system processes a learning request through this pipeline:

```
User Request ("Teach me calculus in 6 hours")
  │
  ▼
┌─────────────────────┐
│ Curriculum Planner   │  → structured learning plan (modules, milestones, pacing)
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ Role Synthesis       │  → dynamic agent team (4-8 roles tailored to learner)
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ Orchestrator         │  → decides which agent acts, which scene runs, when to adapt
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ Scene Engine         │  → designs structured interaction (lecture, quiz, exercise, etc.)
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ Teaching Agents      │  → execute the scene, deliver content, interact with learner
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ Learner Model        │  → evaluates understanding, feeds signals back to orchestrator
└─────────────────────┘
```

### System Prompts (existing in `system-prompts/`)

| Prompt | Role | Status |
|--------|------|--------|
| `architect-agent.md` | Meta-level system design (design-time only) | Done |
| `orchestrator-agent.md` | Runtime decision engine — picks next agent, scene, adaptation | Done |
| `role-synthesis-agent.md` | Generates dynamic agent teams per learner/goal | Done |
| `scene-engine.md` | Designs structured learning scenes | Done |
| `curriculum-planner.md` | Turns goals into structured learning plans | Done |
| `teaching-agent.md` | Template for agents that deliver content in scenes | Done |
| `learner-model.md` | Evaluates learner state, feeds signals to orchestrator | Done |

### Dynamic Agent Generation (not static roles)

Agents are **NOT** predefined. The Role Synthesis engine generates them per-session. Examples:

For "Teach me Rust, I'm a JavaScript engineer":
- JS→Rust Translator, Ownership Specialist, Compiler Error Explainer, Socratic Questioner, Code Coach

For "Explain neural networks to an 8th grader":
- Concept Teacher, Analogy Builder, Visual Guide, Peer Learner, Quiz Generator

For "Teach me calculus in 6 hours":
- Foundations Teacher, Step-by-Step Coach, Problem Solver, Checkpoint Evaluator

### Orchestration

The orchestrator (backed by `orchestrator-agent.md` prompt) is an Elixir GenServer that:
1. Receives learner state + available agents + current scene
2. Calls LLM with orchestrator prompt → gets structured JSON decision
3. Dispatches to the selected agent via the scene engine
4. Streams response to frontend via Phoenix Channels / SSE
5. Updates learner model after each interaction

**Why Elixir**: OTP GenServers are ideal for stateful agent sessions. Each classroom session is a supervised process. Phoenix Channels provide native real-time streaming. Fault tolerance via supervision trees.

---

## Project Folder Structure

```
ai-school/
├── frontend/                              # SolidJS + Vite + TailwindCSS v4
│   ├── src/
│   │   ├── index.tsx                      # entry, router setup
│   │   ├── app.tsx                        # root component with providers
│   │   ├── routes.ts                      # route constants
│   │   ├── global.css                     # css variables, tailwind import
│   │   ├── lib/
│   │   │   ├── api-client.ts              # fetch + SSE helpers
│   │   │   ├── constants.ts
│   │   │   └── types.ts
│   │   ├── context/
│   │   │   ├── theme-context.tsx           # light/dark
│   │   │   └── classroom-context.tsx       # active session state
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── sidebar.tsx
│   │   │   │   ├── top-bar.tsx
│   │   │   │   └── theme-toggle.tsx
│   │   │   ├── landing/
│   │   │   │   ├── subject-card.tsx
│   │   │   │   └── hero-section.tsx
│   │   │   ├── classroom/
│   │   │   │   ├── agent-avatar.tsx
│   │   │   │   ├── chat-message.tsx
│   │   │   │   ├── chat-stream.tsx         # SSE-driven message list
│   │   │   │   ├── classroom-panel.tsx
│   │   │   │   ├── participant-list.tsx
│   │   │   │   └── user-input.tsx
│   │   │   ├── content/
│   │   │   │   ├── slide-viewer.tsx
│   │   │   │   ├── quiz-panel.tsx
│   │   │   │   ├── discussion-panel.tsx
│   │   │   │   └── markdown-content.tsx
│   │   │   ├── playground/
│   │   │   │   ├── code-panel.tsx
│   │   │   │   ├── output-panel.tsx
│   │   │   │   ├── resize-handle.tsx
│   │   │   │   └── playground-tab.tsx
│   │   │   └── common/
│   │   │       ├── loading-spinner.tsx
│   │   │       └── modal.tsx
│   │   └── pages/
│   │       ├── landing.tsx
│   │       ├── course-browser.tsx
│   │       ├── lesson-page.tsx
│   │       ├── classroom-page.tsx
│   │       └── not-found.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                               # Elixir + Phoenix
│   ├── lib/
│   │   ├── ai_school/                     # business logic (contexts)
│   │   │   ├── content/                   # content loading from markdown
│   │   │   │   ├── loader.ex              # parse markdown + frontmatter
│   │   │   │   ├── course.ex              # course schema/struct
│   │   │   │   └── lesson.ex              # lesson schema/struct
│   │   │   ├── classroom/                 # classroom session management
│   │   │   │   ├── session.ex             # GenServer per classroom session
│   │   │   │   ├── session_supervisor.ex  # DynamicSupervisor for sessions
│   │   │   │   └── learner_state.ex       # learner model struct
│   │   │   ├── agents/                    # agent orchestration
│   │   │   │   ├── orchestrator.ex        # orchestrator (calls LLM w/ orchestrator prompt)
│   │   │   │   ├── role_synthesis.ex      # dynamic agent team generation
│   │   │   │   ├── scene_engine.ex        # scene design and execution
│   │   │   │   ├── curriculum_planner.ex  # goal → structured learning plan
│   │   │   │   ├── teaching_agent.ex      # executes scenes, delivers content
│   │   │   │   └── learner_model.ex       # evaluates understanding signals
│   │   │   ├── llm/                       # LLM provider abstraction
│   │   │   │   ├── client.ex              # unified API (OpenAI/Anthropic/Ollama)
│   │   │   │   ├── streaming.ex           # SSE stream handling
│   │   │   │   └── prompt_builder.ex      # loads system prompts, builds messages
│   │   │   └── sandbox/                   # code execution
│   │   │       └── executor.ex            # sandboxed code runner (Port/System.cmd)
│   │   ├── ai_school_web/                 # Phoenix web layer
│   │   │   ├── controllers/
│   │   │   │   ├── course_controller.ex
│   │   │   │   ├── lesson_controller.ex
│   │   │   │   ├── classroom_controller.ex
│   │   │   │   ├── playground_controller.ex
│   │   │   │   └── health_controller.ex
│   │   │   ├── channels/
│   │   │   │   ├── classroom_channel.ex   # real-time agent streaming
│   │   │   │   └── user_socket.ex
│   │   │   ├── router.ex
│   │   │   └── endpoint.ex
│   │   └── ai_school/application.ex       # OTP application + supervision tree
│   ├── config/
│   │   ├── config.exs
│   │   ├── dev.exs
│   │   └── runtime.exs                    # LLM API keys, runtime config
│   ├── test/
│   ├── mix.exs
│   └── mix.lock
│
├── system-prompts/                        # agent behavior definitions
│   ├── architect-agent.md                 # design-time system architect
│   ├── orchestrator-agent.md              # runtime decision engine
│   ├── role-synthesis-agent.md            # dynamic agent team generator
│   ├── scene-engine.md                    # scene design (rename from skill-execution.md)
│   ├── curriculum-planner.md              # goal → learning plan (TO CREATE)
│   ├── teaching-agent.md                  # content delivery template (TO CREATE)
│   └── learner-model.md                   # understanding evaluator (TO CREATE)
│
├── content/                               # curated course content (markdown)
│   ├── programming/
│   │   ├── course.yaml
│   │   └── module-01-basics/
│   │       ├── 01-hello-world.md
│   │       └── 02-variables.md
│   ├── mathematics/
│   │   ├── course.yaml
│   │   └── module-01-algebra/
│   └── history/
│       ├── course.yaml
│       └── module-01-ancient/
│
├── plan.md
└── .gitignore
```

---

## Content Data Model

### Hierarchy

```
Subject (programming, mathematics, history, ...)
  └── Course (python-fundamentals, algebra-i, ...)
       └── Module (module-01-basics, module-02-types, ...)
            └── Lesson (01-hello-world.md)
                 └── Activities (slide, quiz, discussion, playground)
```

### course.yaml

```yaml
id: python-fundamentals
subject: programming
title: Python Fundamentals
description: Learn Python from scratch
language: python
modules:
  - id: module-01-basics
    title: Getting Started
    sequence: 1
  - id: module-02-data-types
    title: Data Types
    sequence: 2
```

### Lesson Markdown (01-hello-world.md)

```markdown
---
id: hello-world
module: module-01-basics
sequence: 1
title: "Hello, World!"
activity_types: [slide, quiz, playground]
difficulty: beginner
estimated_minutes: 10
---

## Slide
Main teaching content rendered as lesson material.

## Discussion
Seed prompt for AI classroom discussion.

## Quiz
- question: What does print() do?
  type: single
  options: [Displays output, Reads input, Creates a file]
  answer: 0

## Playground
```python
# Try it yourself
print("Hello, World!")
```

## Solution
```python
print("Hello, World!")
```
```

---

## API Endpoints

### Content (REST — static, from markdown)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/subjects` | List all subjects with course summaries |
| GET | `/api/courses/:id` | Course with modules and lesson list |
| GET | `/api/lessons/:id` | Full lesson content |

### Classroom (REST + Phoenix Channels)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/classroom/start` | Start session. Body: `{ goal, learner_profile }` or `{ lesson_id }`. Spawns GenServer, returns `{ session_id, agents, plan }` |
| POST | `/api/classroom/:id/message` | Learner sends a message |
| POST | `/api/classroom/:id/action` | Learner action: next/ask/repeat/quiz/halt |

**Phoenix Channel**: `classroom:session_id` — real-time bidirectional streaming of agent messages, scene transitions, learner state updates.

### Playground & Quiz

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/playground/run` | Execute code `{ code, language }` |
| POST | `/api/quiz/submit` | Grade answers `{ session_id, answers }` |
| GET | `/api/health` | Health check |

---

## Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Subject grid with cards |
| Course Browser | `/courses/:courseId` | Sidebar nav + module list |
| Lesson Page | `/courses/:courseId/:moduleId/:lessonId` | Tabbed: Content, Classroom, Quiz, Playground |
| Classroom | `/classroom/:sessionId` | Full-screen AI classroom |

---

## Styling Approach

- TailwindCSS v4 with `@tailwindcss/vite` plugin
- **Custom CSS classes** for each component (not inline utility soup)
- CSS variables for theming (light/dark via `.dark` class toggle)
- Pattern from golang-katas `global.css` as reference

---

## Implementation Phases

### Phase 1 — MVP (Complete)
**Backend (Elixir)**:
- Phoenix project setup with JSON API
- Content loader (parse markdown + frontmatter from `content/` dir)
- LLM client (OpenAI-compatible API, streaming support)
- Prompt builder (loads system prompts, constructs messages)
- Classroom GenServer (session lifecycle, agent turn management)
- Orchestrator (calls LLM with orchestrator prompt, returns JSON decision)
- Role synthesis (calls LLM to generate agent team from goal + learner profile)
- Scene engine (calls LLM to design scenes)
- Teaching agent (executes scenes via LLM, streams responses)
- Phoenix Channel for real-time classroom streaming
- REST endpoints for content, classroom, health

**Frontend (SolidJS)**:
- Vite + SolidJS + TailwindCSS v4 scaffold
- Landing page with "Start Learning" input (free-form goal)
- Classroom page with chat stream (Phoenix Channel client)
- Agent avatars, message bubbles, participant list
- Light/dark theme toggle
- Course browser (for curated content)

**System Prompts**:
- Complete all 7 prompts (3 existing + rename 1 + create 3 new)

**Content**:
- One sample curated course (Python Fundamentals, ~5 lessons)

### Phase 2 — Full Classroom
- Learner model (understanding tracking, adaptation signals)
- Curriculum planner agent (goal → structured plan)
- Quiz scene type with AI grading
- Code playground (sandboxed execution via Port)
- Adaptation loop (orchestrator reacts to learner model signals)
- Session persistence (Ecto + SQLite/Postgres)

### Phase 3 — Rich Experience
- Whiteboard/visualization scenes
- Multiple code languages in playground
- TTS for agent speech (optional)
- User auth + progress tracking
- Formula rendering (KaTeX) for math subjects

### Phase 4 — Community & Scale
- User-contributed courses
- Collaborative classroom (multiple learners via Channels)
- Export as PDF/slides
- Analytics dashboard
- Course rating/reviews
- OpenClaw-style messaging integration (Slack, Discord, Telegram) — users trigger classroom sessions from chat apps, receive session links back

---

## Key Reference Files (from existing katas)

Frontend patterns (SolidJS + TailwindCSS + CodeMirror):
- Playground code panel: `golang-katas/frontend/src/components/kata/live-code-tab.tsx`
- Sidebar navigation: `golang-katas/frontend/src/components/layout/sidebar.tsx`
- Theme CSS variables: `golang-katas/frontend/src/global.css`
- API client pattern: `golang-katas/frontend/src/lib/api-client.ts`
- Resizable panels: `golang-katas/frontend/src/components/kata/resize-handle.tsx`

Content patterns:
- Kata loader (markdown + frontmatter): `golang-katas/backend/internal/services/kata-loader.go`
- Content format: `sql-katas/katas/phase-00/*.md`

---

## Verification

1. `mix phx.server` starts backend (port 4000), `npm run dev` starts frontend (port 5173)
2. Frontend proxies `/api/*` to backend
3. Landing page lets user type a learning goal
4. Starting a session calls role synthesis → returns agent team
5. Classroom page connects via Phoenix Channel, streams agent messages
6. Orchestrator cycles through agents, scene engine designs interactions
7. Learner can send messages, agents respond contextually
8. Course browser shows curated content from `content/` directory
9. Theme toggle switches light/dark correctly
