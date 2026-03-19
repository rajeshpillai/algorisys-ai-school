# AI School

An open-source multi-agent interactive learning platform inspired by [OpenMAIC](https://github.com/THU-MAIC/OpenMAIC). AI School can teach **any subject** — programming, mathematics, history, science, languages — through dynamically generated AI agent teams that adapt to each learner.

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

**Multi-Agent Pipeline:**
```
User Request → Curriculum Planner → Role Synthesis → Orchestrator → Scene Engine → Teaching Agents → Learner Model → (loop)
```

See [plan.md](plan.md) for the full architecture and implementation plan.

## Prerequisites

- Elixir 1.18+ / Erlang/OTP 28+
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

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your LLM API key
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

The app runs at http://localhost:5173

## Project Structure

```
ai-school/
├── frontend/           SolidJS + Vite + TailwindCSS v4
├── backend/            Elixir + Phoenix
├── system-prompts/     Agent behavior definitions (7 prompts)
├── content/            Curated course content (markdown)
├── docker-compose.yml  PostgreSQL for development
├── plan.md             Full implementation plan
└── todo.md             Current progress tracker
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

## Bring Your Own Keys

AI School supports multiple LLM providers. Set your preferred provider in `backend/.env`:

```bash
# Use one of:
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...

LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...

LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
```

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0).
