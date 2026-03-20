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
- [x] Auto-advance should ask for confirmation before moving to next topic/chapter
  - Show "Ready for next topic?" prompt with Continue / Ask Question buttons
  - Let user ask follow-up questions before advancing
  - Only auto-advance after user confirms (or configurable 30s timeout)

## User Settings
- [x] Allow users to set their own LLM API keys (provider, key) via UI
- [x] Settings modal — form for API key entry, provider selection (OpenAI/Anthropic/Ollama)
- [x] Keys stored in browser localStorage, passed to backend per session start
- [x] Pass user-provided keys to LLM client instead of server env vars

## Testing
- [x] Adopt TDD for all new features going forward (policy in CLAUDE.md)
- [x] Add retrospective tests for existing features:
  - [x] Backend: Session GenServer lifecycle (start, message, state transitions) — 20 tests
  - [x] Backend: Curriculum planner agent (plan generation, time extraction) — 9 tests
  - [x] Backend: Store module (create, save, load, append) — 15 tests
  - [x] Backend: LearnerState (to_map, from_map, round-trip) — 6 tests
  - [x] Backend: LLM streaming (chunk parsing, callback delivery) — 13 tests
  - [x] Backend: LLM client (code fences, JSON injection, providers) — 9 tests
  - [x] Backend: PromptBuilder (message builders, prompt loading) — 13 tests
  - [x] Backend: Orchestrator / SceneEngine / RoleSynthesis agents — 15 tests
  - [x] Backend: QuizGrader (single/multiple/short-answer grading) — 7 tests
  - [x] Frontend: Classroom context (connect, send, progress updates) — 22 tests
  - [x] Frontend: Chat stream rendering — 10 tests
  - [x] Integration: Landing → session → classroom end-to-end (Playwright e2e)
- [x] Playwright e2e test suite — 51 tests across 9 files
- Backend: 123 tests (93 fast + 30 LLM integration), 0 failures
- Frontend: 32 Vitest tests (22 classroom context + 10 chat stream)
- E2E: 51 Playwright tests covering health, landing, theme, settings, courses, classroom, navigation

## Integration & Verification
- [x] Frontend proxies /api/* to Phoenix backend
- [x] Landing → start session → classroom stream works end-to-end (e2e tested)
- [x] Agent messages stream via Phoenix Channel (no duplication)
- [x] Course browser displays curated content
- [x] Light/dark theme toggle works
- [x] Pause/resume control for curriculum auto-advance
- [x] BYOK settings passed through full stack

---

## Phase 2 — Feature Gaps (informed by ProductX analysis)

### Voice & Speech
- [ ] Text-to-Speech (TTS) for agent narration
  - [ ] TTS provider abstraction (OpenAI TTS, browser SpeechSynthesis as fallback)
  - [ ] Per-agent voice identity (same voice across session)
  - [ ] Mute/unmute toggle, volume control, playback speed (0.75x–2x)
- [ ] Speech-to-text (ASR) for user input
  - [ ] Whisper API integration or browser SpeechRecognition
  - [ ] Toggleable in settings

### Interactive Scenes
- [x] Whiteboard / drawing canvas — agent-generated SVG diagrams via ~~~whiteboard blocks
- [x] HTML simulation scenes — agent-generated interactive demos via ~~~simulation blocks (sandboxed iframe)
- [x] Formula rendering — KaTeX for math/science subjects
- [x] Rich content parser — unified pipeline for all block types with streaming placeholders
- [x] Test playground page — /playground route for visual QA of all rich content types
- [ ] Whiteboard enhancements
  - [ ] Canvas-based rendering with undo/redo (user can annotate)
  - [ ] Multi-slide whiteboard support (one per scene)
  - [ ] Zoom/pan controls for complex diagrams
- [ ] Simulation enhancements
  - [ ] Pre-built simulation templates (sorting, physics, data structures)
  - [ ] Communication between simulation iframe and parent (score reporting)

### Quiz & Grading Enhancements
- [x] Multiple question types: single-choice, multiple-choice, short-answer
- [x] AI grading for short-answer questions (LLM-based scoring + feedback)
- [x] Points-per-question scoring with summary view
- [x] Quiz header showing question count and topic

### Slide / Presentation Mode
- [x] Structured slide scenes — ~~~slides blocks with JSON array of {title, body} slides
- [x] SlideViewer component with Prev/Next navigation, dot indicators, keyboard support
- [x] Markdown + KaTeX + code blocks supported in slide body
- [x] Streaming placeholder ("Preparing presentation...")
- [ ] Slide animations and transitions (crossfade between slides)
- [ ] Fullscreen presentation mode (expand slide viewer to full viewport)
- [ ] Agent spotlight/laser pointer actions (highlight elements during teaching)
- [ ] Slide thumbnails sidebar for quick navigation
- [ ] Export slides as standalone HTML or PDF

### How Other Tools Handle Rich Teaching Content (Research Notes)
Reference products and their approaches — for future feature planning:

**Gamma / Beautiful.ai / Tome (AI slide generators)**
- Generate full slide decks from prompts with layout templates
- Use predefined visual themes (typography, color palettes, spacing)
- Support images, charts, icons alongside text
- Takeaway: We could add visual themes to SlideViewer and image generation per slide

**Brilliant.org (interactive learning)**
- Step-by-step interactive problems with immediate feedback
- Inline simulations (drag, manipulate, visualize)
- Progress tracking per concept
- Takeaway: Our simulation blocks could support structured step-through with state reporting

**Livebook (Elixir interactive notebooks)**
- Live code cells with immediate execution and output
- Markdown cells interspersed with code
- Mermaid diagram support
- Takeaway: We could add a ~~~code-editor block type for live coding exercises

**Jupyter / Google Colab (computational notebooks)**
- Cell-based: markdown + code + output interleaved
- Rich output (charts, tables, images, interactive widgets)
- Takeaway: Our fenced-block approach is similar but streamed — could add chart blocks (~~~chart with Vega-Lite spec)

**Khan Academy / Coursera (structured courses)**
- Video + transcript + interactive exercises in sequence
- Progress bars per module/lesson
- Spaced repetition for review
- Takeaway: We have curriculum progression — could add spaced repetition quizzes

**Possible future rich block types (extensibility plan):**
- ~~~chart — Vega-Lite/Chart.js spec for data visualizations
- ~~~code-editor — editable code with run button (sandboxed execution)
- ~~~mermaid — Mermaid.js diagrams (flowcharts, sequence diagrams, ER diagrams)
- ~~~timeline — visual timeline for historical/sequential content
- ~~~comparison — side-by-side comparison tables
- Adding any new type: update regex in rich-content-parser.ts → new component → new Match in chat-message.tsx → update teaching-agent prompt

### Content Input Methods
- [x] PDF upload and parsing — pdftotext extraction, source-grounded teaching, keyword excerpt injection per turn
- [ ] Web search augmentation — enrich generated content with live web results

### Export
- [ ] Export session as PowerPoint (.pptx) — editable slides from teaching scenes
- [ ] Export session as HTML — self-contained interactive replay
- [ ] Export as PDF — printable lesson summary

### Playback & Flow Control
- [ ] Lecture playback mode — replay pre-recorded agent monologues + actions
- [ ] Pause/resume mid-agent — soft-pause without ending session
- [ ] Playback speed control (0.75x, 1x, 1.5x, 2x)
- [ ] User can interrupt agent mid-response

### Discussion Modes
- [x] Multi-agent roundtable discussions — "roundtable" scene type, 2-4 agents take sequential turns, transcript-aware
- [x] Roundtable UI — panel discussion banner with topic and participants
- [ ] Discussion initiator pattern (trigger agent speaks first, others respond)
- [ ] Learner interjection mid-roundtable (pause between turns, let user respond)

### User Profile & Personalization
- [ ] User profile (avatar, nickname, bio/background)
- [ ] Agents address user by name and tailor to stated background
- [ ] Profile persisted in localStorage or DB

### Messaging Platform Integration (OpenClaw-style)
- [ ] Trigger classroom sessions from chat apps (Slack, Discord, Telegram)
- [ ] Send session link back to user in chat
- [ ] Webhook-based integration API

### Internationalization
- [ ] Multi-language UI support (English + additional languages)
- [ ] Language-aware prompt generation (LLM calls include language parameter)

### Session Management
- [x] Session list / history page — anonymous learner tracking via localStorage UUID, resume from DB
- [ ] Share generated classroom via URL
- [ ] Draft caching — unsent messages persist across page reloads

## Phase 3 — Advanced Features

### Project-Based Learning (PBL)
- [ ] Issue board UI (Kanban-style task tracking)
- [ ] Agent role assignments (management/development divisions)
- [ ] Agent-to-agent collaboration within project context

### Media Generation
- [ ] Image generation for slides (provider-agnostic: OpenAI DALL-E, etc.)
- [ ] Video generation / embedding in scenes
- [ ] Placeholder elements during async media generation

### Collaboration
- [ ] Multi-learner classroom (multiple users via Phoenix Channels)
- [ ] Shared whiteboard drawing
- [ ] Real-time presence indicators

### Analytics & Progress
- [ ] Learning analytics dashboard (time spent, topics covered, quiz scores)
- [ ] Learner model signals visible in UI (understanding level per topic)
- [ ] Progress export (CSV/JSON)

### Token Usage Optimization
- [ ] Trim conversation history sent to LLM (sliding window or summarization)
- [ ] Use cheaper models (gpt-4o-mini) for pipeline agents, reserve gpt-4o for teaching
- [ ] Cache role synthesis and curriculum plans — don't regenerate on resume
- [ ] Limit scene engine output size (compact JSON schema)
- [ ] Add token usage tracking per session (log prompt + completion tokens)
- [ ] Set max_tokens on LLM calls to cap runaway responses
- [ ] Debounce rapid user actions that trigger LLM calls

### Auth & Administration
- [ ] User authentication (email/password + OAuth)
- [ ] Admin panel (user management, API key management)
- [ ] Credit/usage tracking system
