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
- [ ] Classroom session GenServer — full implementation
- [ ] Role synthesis service — call LLM with role-synthesis prompt
- [ ] Orchestrator service — call LLM with orchestrator prompt
- [ ] Scene engine service — call LLM with scene-engine prompt
- [ ] Teaching agent service — execute scenes via LLM
- [ ] Classroom channel — real-time agent message streaming
- [ ] REST endpoints — classroom (start/message/action)
- [ ] DB migrations (sessions, learner state)

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
- [ ] Phoenix Channel client integration
- [ ] Course browser page — fetch + display courses from API
- [ ] Lesson page — tabbed view with content/classroom tabs
- [ ] Classroom page — connect to channel, stream agent messages
- [ ] Landing page — wire "Start Learning" to API

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

## Integration & Verification
- [ ] Frontend proxies /api/* to Phoenix backend
- [ ] Landing → start session → classroom stream works end-to-end
- [ ] Agent messages stream via Phoenix Channel
- [ ] Course browser displays curated content
- [ ] Light/dark theme toggle works
