# AI School — Claude Code Instructions

## Project Overview

Multi-agent AI classroom platform. Elixir/Phoenix backend + SolidJS frontend. Users describe a learning goal, and a pipeline of AI agents (Curriculum Planner → Role Synthesis → Orchestrator → Scene Engine → Teaching Agents → Learner Model) dynamically generates a teaching team and delivers interactive lessons.

## Tech Stack

- **Backend**: Elixir 1.15+, Phoenix 1.8, Ecto, PostgreSQL 17 (Docker)
- **Frontend**: SolidJS, TailwindCSS v4, Vite, TypeScript
- **LLM**: OpenAI / Anthropic / Ollama via unified client (`backend/lib/backend/llm/client.ex`)
- **Real-time**: Phoenix Channels (classroom streaming)

## Project Structure

```
ai-school/
├── backend/             # Elixir Phoenix app (port 4000)
│   └── lib/
│       ├── backend/     # Business logic: agents/, classroom/, content/, llm/
│       └── backend_web/ # Controllers, channels, router
├── frontend/            # SolidJS app (port 5173, proxies /api + /socket to 4000)
│   └── src/
│       ├── components/  # classroom/, content/, landing/, layout/, playground/, common/
│       ├── context/     # theme-context, classroom-context
│       ├── pages/       # landing, course-browser, lesson-page, classroom-page
│       └── lib/         # api-client, types, constants
├── system-prompts/      # 7 agent behavior markdown files
├── content/             # Curated courses (YAML + markdown)
└── docker-compose.yml   # PostgreSQL 17
```

## Dev Commands

```bash
# Database
docker compose up -d                          # start postgres
docker compose down                           # stop postgres

# Backend
cd backend && mix deps.get                    # install deps
cd backend && mix ecto.setup                  # create + migrate db
cd backend && mix phx.server                  # start server (port 4000)
cd backend && mix test                        # run tests
cd backend && mix format                      # format code
cd backend && mix precommit                   # compile (warnings-as-errors) + format + test

# Frontend
cd frontend && npm install                    # install deps
cd frontend && npm run dev                    # start dev server (port 5173)
cd frontend && npm run build                  # production build
```

## Coding Conventions

- **File/folder naming**: All lowercase-hyphenated (e.g., `chat-message.tsx`, `scene-engine.md`)
- **Frontend styling**: Custom CSS classes per component in `global.css`, NOT inline Tailwind utility soup. Use CSS variables for theming (light/dark via `.dark` class)
- **Backend**: Follow standard Elixir/Phoenix conventions. Contexts in `backend/`, web layer in `backend_web/`
- **System prompts**: Markdown files in `system-prompts/`, loaded and cached via ETS in `prompt_builder.ex`

## API Routes

All under `/api`:
- `GET /health` — health check
- `GET /subjects` — list subjects with courses
- `GET /courses/:id` — course with modules
- `GET /lessons/:id` — full lesson content
- `POST /classroom/start` — start session (`{ goal, learner_profile }` or `{ lesson_id }`)
- `GET /classroom/:id` — session state
- `POST /classroom/:id/message` — learner message
- `POST /classroom/:id/action` — learner action (next/ask/repeat/quiz/halt)

Phoenix Channel: `classroom:session_id` for real-time agent streaming.

## Environment Variables

Set in `backend/.env`:
- `LLM_PROVIDER` — `openai` | `anthropic` | `ollama`
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `OLLAMA_BASE_URL`
- `DATABASE_URL` (prod only)
- `SECRET_KEY_BASE` (prod only)

## Testing Policy

- **TDD for all new features**: Write tests first (red → green → refactor) before implementing any new functionality
- **Retrospective TDD for existing features**: Existing code that lacks tests must have tests added in TDD style — write a failing test that captures the expected behavior, then verify it passes against the existing implementation
- **Backend tests**: `cd backend && mix test` — use ExUnit with async where possible
- **Fast tests only** (skip LLM calls): `cd backend && mix test --exclude llm_integration`
- **Agent tests** are tagged `@moduletag :llm_integration` — they hit real LLM APIs and are slow (~200s)
- **E2E tests** (Playwright): `cd e2e && npm test` — requires frontend (port 5173) and backend (port 4000) running
- **E2E headed mode**: `cd e2e && npm run test:headed` — runs with visible browser
- **Frontend tests**: Component and integration tests for UI behavior
- **No code merges without tests**: Every PR must include tests for the changes it introduces

## Key Architecture Decisions

- **Dynamic agents**: Agents are NOT predefined — Role Synthesis generates a unique team per session based on learner profile and goal
- **GenServer per session**: Each classroom session is a supervised OTP process for stateful agent orchestration
- **Dual content modes**: Curated markdown courses (kata-style) + free-form AI-generated sessions
- **Streaming**: Agent responses stream to frontend via Phoenix Channels, not REST polling

## License

AGPL-3.0
