# AI School — MVP Todo

## System Prompts
- [x] architect-agent.md
- [x] orchestrator-agent.md
- [x] role-synthesis-agent.md
- [x] scene-engine.md (renamed from skill-execution.md)
- [x] curriculum-planner.md
- [x] teaching-agent.md
- [x] learner-model.md

## Backend (Elixir + Phoenix)
- [x] Phoenix project scaffold
- [x] Ecto + Postgrex (PostgreSQL via docker-compose)
- [x] CORS configured for frontend dev server
- [x] Repo module + DB config (dev/test/prod)
- [x] Stub controllers (health, course, lesson, classroom)
- [x] API routes wired in router
- [x] Phoenix Channel stub (classroom channel)
- [x] Session GenServer + DynamicSupervisor stubs
- [x] Business logic module stubs (content, agents, llm)
- [x] Config: LLM API keys loaded from env vars (runtime.exs)
- [x] LLM client (`llm/client.ex`) — unified OpenAI/Anthropic/Ollama via Req
- [x] LLM streaming (`llm/streaming.ex`) — SSE stream handling
- [x] Prompt builder (`llm/prompt_builder.ex`) — load system prompts, build messages
- [x] Content loader (`content/loader.ex`) — parse markdown + YAML frontmatter
- [x] REST endpoints — content (course/lesson controllers wired to loader)
- [x] Classroom session GenServer — full implementation
- [x] Role synthesis service — call LLM with role-synthesis prompt
- [x] Orchestrator service — call LLM with orchestrator prompt
- [x] Scene engine service — call LLM with scene-engine prompt
- [x] Teaching agent service — execute scenes via LLM
- [x] Classroom channel — real-time agent message streaming
- [x] REST endpoints — classroom (start/message/action)
- [x] DB migrations (sessions, messages tables)
- [x] Ecto schemas (Session, Message)
- [x] Store module — persistence boundary (create, save, load, append)
- [x] Session GenServer — persist at state transitions, resume from DB

## Frontend (SolidJS + TailwindCSS v4)
- [x] Vite + SolidJS + TailwindCSS v4 scaffold
- [x] Global CSS (theme variables, light/dark)
- [x] Router setup (@solidjs/router)
- [x] API client + types
- [x] Theme context + toggle component
- [x] Layout: sidebar, top-bar
- [x] Landing page — hero + "Start Learning" input + subject cards
- [x] Classroom components: chat-stream, chat-message, agent-avatar
- [x] Classroom components: participant-list, user-input, classroom-panel
- [x] Content components: markdown-content, slide-viewer, quiz-panel
- [x] Playground components: code-panel, output-panel, resize-handle
- [x] Common components: loading-spinner, modal
- [x] Phoenix Channel client integration
- [x] Course browser page — fetch + display courses from API
- [x] Lesson page — tabbed view with content/classroom tabs
- [x] Classroom page — connect to channel, stream agent messages
- [x] Landing page — wire "Start Learning" to API

## Infrastructure
- [x] docker-compose.yml (PostgreSQL 17)
- [x] .env.example
- [x] .gitignore
- [x] AGPL-3.0 LICENSE
- [x] README.md with setup instructions
- [x] docs/dev-commands.md

## Content
- [x] Python Fundamentals course.yaml
- [x] Module 01: Getting Started (3 lessons)
- [x] Module 02: Data Types (2 lessons)

## Curriculum-Driven Progression
- [x] Wire curriculum planner agent into pipeline (prompt exists, not called)
- [x] Generate structured syllabus on session start (topics, time allocation, sequence)
- [x] Track curriculum progress in session state (current topic index, time spent, topics remaining)
- [x] Auto-advance on scene complete — orchestrator initiates next topic without user prompt
- [x] Persist curriculum plan in session (DB: add curriculum_plan JSONB column)
- [x] Broadcast curriculum_progress event to frontend
- [x] Show progress indicator in classroom UI (progress bar + topic/count)
- [ ] Auto-advance should ask for confirmation before moving to next topic/chapter
  - Show "Ready for next topic?" prompt with Continue / Ask Question buttons
  - Let user ask follow-up questions before advancing
  - Only auto-advance after user confirms (or configurable timeout)

## User Settings
- [ ] Allow users to set their own LLM API keys (provider, key) via UI
- [ ] Settings page — form for API key entry, provider selection (OpenAI/Anthropic/Ollama)
- [ ] Backend endpoint to store/validate keys per user session
- [ ] Pass user-provided keys to LLM client instead of server env vars

## Testing
- [ ] Adopt TDD for all new features going forward
- [ ] Add retrospective tests for existing features:
  - [ ] Backend: Session GenServer lifecycle (start, message, state transitions)
  - [ ] Backend: Curriculum planner agent (plan generation, time extraction)
  - [ ] Backend: Store module (create, save, load, append)
  - [ ] Backend: LLM streaming (chunk parsing, callback delivery)
  - [ ] Backend: Orchestrator / SceneEngine / RoleSynthesis agents
  - [ ] Frontend: Classroom context (connect, send, progress updates)
  - [ ] Frontend: Chat stream rendering
  - [ ] Integration: Landing → session → classroom end-to-end

## Integration & Verification
- [x] Frontend proxies /api/* to Phoenix backend
- [ ] Landing → start session → classroom stream works end-to-end
- [ ] Agent messages stream via Phoenix Channel (no duplication)
- [x] Course browser displays curated content
- [x] Light/dark theme toggle works
