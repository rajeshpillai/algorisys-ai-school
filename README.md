# AI School

An open-source multi-agent interactive learning platform. AI School can teach **any subject** — programming, mathematics, history, science, languages — through dynamically generated AI agent teams that adapt to each learner.

## How It Works

1. **You describe your learning goal** — "Teach me calculus in 6 hours" or "Explain neural networks to an 8th grader"
2. **AI generates a custom teaching team** — a Curriculum Planner creates the lesson plan, then Role Synthesis assembles the right agents (e.g., Concept Teacher, Analogy Builder, Quiz Generator)
3. **Agents teach you interactively** — through structured scenes (lectures, discussions, exercises, quizzes) orchestrated by a decision engine that adapts to your understanding in real-time
4. **Predefined courses available too** — curated markdown-based courses (kata-style) for structured learning paths

## Architecture

```
Frontend (SolidJS + TailwindCSS v4)  ←→  Backend (Elixir + Phoenix)  ←→  LLM APIs
                                              ↕
                                     PostgreSQL + System Prompts + Content
```

### Multi-Agent Pipeline

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

Agents are **not** predefined. The Role Synthesis engine generates a unique team per session. For example:

- *"Teach me Rust, I'm a JS engineer"* → JS→Rust Translator, Ownership Specialist, Compiler Error Explainer, Code Coach
- *"Explain neural networks to an 8th grader"* → Concept Teacher, Analogy Builder, Visual Guide, Quiz Generator
- *"Teach me calculus in 6 hours"* → Foundations Teacher, Step-by-Step Coach, Problem Solver, Checkpoint Evaluator

See [plan.md](plan.md) for the full architecture and implementation plan.

## Prerequisites

- Elixir 1.15+ / Erlang/OTP 26+
- Node.js 20+
- Docker (for PostgreSQL)
- An LLM API key (OpenAI, Anthropic, or local Ollama)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/rajeshpillai/algorisys-ai-school.git
cd algorisys-ai-school
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

First run takes 30-60 seconds for initialization. Check readiness:
```bash
docker exec ai-school-postgres pg_isready -h localhost -U ai_school
```

### 3. Configure environment

Create `backend/.env` with your LLM API key:

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

### 4. Start the backend

```bash
cd backend
mix deps.get
mix ecto.setup
mix phx.server
```

The API runs at http://localhost:4000

### 5. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at http://localhost:5173 (proxies `/api/*` and `/socket/*` to the backend).

### Verify it works

```bash
curl http://localhost:5173/api/health
# → {"status":"ok"}
```

## Project Structure

```
ai-school/
├── frontend/              SolidJS + Vite + TailwindCSS v4
│   └── src/
│       ├── components/    classroom/, content/, landing/, layout/, playground/, common/
│       ├── context/       theme-context, classroom-context
│       ├── pages/         landing, course-browser, lesson-page, classroom-page
│       └── lib/           api-client, types, constants
├── backend/               Elixir + Phoenix
│   └── lib/
│       ├── backend/       Business logic: agents/, classroom/, content/, llm/
│       └── backend_web/   Controllers, channels, router
├── system-prompts/        Agent behavior definitions (7 prompts)
├── content/               Curated courses (YAML + markdown frontmatter)
├── docs/                  Developer reference (dev-commands.md)
├── docker-compose.yml     PostgreSQL 17
├── plan.md                Full architecture and implementation plan
└── todo.md                Current progress tracker
```

### System Prompts

| Prompt | Purpose |
|--------|---------|
| `architect-agent.md` | Design-time system architect |
| `orchestrator-agent.md` | Runtime decision engine — picks next agent, scene, adaptation |
| `role-synthesis-agent.md` | Dynamically generates agent teams per learner/goal |
| `scene-engine.md` | Designs structured learning scenes |
| `curriculum-planner.md` | Transforms goals into structured learning plans |
| `teaching-agent.md` | Delivers content within scenes |
| `learner-model.md` | Evaluates understanding, feeds signals to orchestrator |

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/subjects` | List all subjects with course summaries |
| GET | `/api/courses/:id` | Course with modules and lesson list |
| GET | `/api/lessons/:id` | Full lesson content |
| POST | `/api/classroom/start` | Start session (`{ goal, learner_profile }` or `{ lesson_id }`) |
| GET | `/api/classroom/:id` | Session state |
| POST | `/api/classroom/:id/message` | Learner sends a message |
| POST | `/api/classroom/:id/action` | Learner action (next/ask/repeat/quiz/halt) |

Real-time streaming via Phoenix Channel: `classroom:session_id`

## Bring Your Own Keys

AI School supports multiple LLM providers. Set your preferred provider in `backend/.env`:

```bash
# OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Anthropic
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Ollama (local)
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
```

## Development

See [docs/dev-commands.md](docs/dev-commands.md) for the full command reference.

```bash
# Run backend precommit checks (compile warnings-as-errors + format + test)
cd backend && mix precommit

# Format backend code
cd backend && mix format

# Run backend tests
cd backend && mix test

# Build frontend for production
cd frontend && npm run build
```

## Current Status

**Phase 1 (MVP) — Complete.** The full multi-agent pipeline is wired end-to-end: landing page → session start → curriculum planning → role synthesis → orchestrator → scene engine → teaching agents streaming via Phoenix Channels. DB persistence, session resume, and curriculum progress tracking are implemented.

See [todo.md](todo.md) for detailed progress and remaining work.

## Roadmap

- **Phase 2**: Quiz scenes with AI grading, code playground (sandboxed execution), learner adaptation loop
- **Phase 3**: Whiteboard/visualization scenes, multi-language playground, formula rendering (KaTeX)
- **Phase 4**: User auth, collaborative classrooms, community courses, analytics

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0).
