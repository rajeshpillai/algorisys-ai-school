# Rich Content Blocks

AI School supports rich content blocks that teaching agents can embed inline in chat messages. These render as interactive components instead of plain text.

## Supported Block Types

| Block Type | Fence | Renders As | Scene Type |
|---|---|---|---|
| `whiteboard` | `~~~whiteboard` | SVG diagram | whiteboard |
| `simulation` | `~~~simulation` | Sandboxed iframe (interactive HTML) | simulation |
| `slides` | `~~~slides` | Navigable slide deck | lecture |

## Format

All block types use the same fenced block syntax:

```
~~~blocktype
content here
~~~
```

Backtick fences (```) also work interchangeably with tilde fences (~~~).

## Block Types

### Whiteboard (SVG Diagrams)

Agents generate SVG markup for visual explanations — flowcharts, data structures, process diagrams, etc.

```
~~~whiteboard
<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
  <rect x="50" y="100" width="120" height="60" rx="8" fill="#3b82f6" opacity="0.15" stroke="#3b82f6"/>
  <text x="110" y="135" text-anchor="middle" font-size="14" fill="#334155">Input</text>
</svg>
~~~
```

**Security**: SVG is sanitized before rendering — `<script>` tags, event handlers (`onload`, `onclick`, etc.), and `javascript:` URLs are stripped.

**Guidelines for agents**:
- Use `viewBox="0 0 600 400"` (or similar reasonable dimensions)
- Use neutral colors: `#334155`, `#3b82f6`, `#10b981`, `#f59e0b`, `#ef4444`
- Label elements with `<text>` nodes
- For multi-step processes, use multiple `~~~whiteboard` blocks with text between them

### Simulation (Interactive HTML)

Agents generate self-contained HTML with vanilla JavaScript for interactive demos — visualizers, calculators, mini-games, etc.

```
~~~simulation
<!DOCTYPE html>
<html>
<head><style>body { font-family: sans-serif; padding: 1rem; }</style></head>
<body>
  <h3>Counter</h3>
  <p>Count: <span id="c">0</span></p>
  <button onclick="document.getElementById('c').textContent = ++window.n">+1</button>
  <script>window.n = 0;</script>
</body>
</html>
~~~
```

**Security**: Rendered in an `<iframe>` with `sandbox="allow-scripts"`. No `allow-same-origin` — the simulation cannot access the parent page, cookies, or storage.

**Guidelines for agents**:
- Vanilla JavaScript only (no external libraries — the iframe is sandboxed)
- Keep under 200 lines
- Include inline `<style>` for layout
- Add clear labels and instructions in the UI
- Include a Reset mechanism if stateful

### Slides (Presentation Decks)

Agents generate structured slide presentations as a JSON array.

```
~~~slides
[
  {
    "title": "What is X?",
    "body": "X is a concept that...\n\n- Point one\n- Point two"
  },
  {
    "title": "Code Example",
    "body": "```python\nx = 42\n```\n\nThe variable holds a value."
  },
  {
    "title": "Key Takeaway",
    "body": "Remember: $$E = mc^2$$"
  }
]
~~~
```

Each slide has:
- `title` (string) — displayed as a heading
- `body` (string) — markdown content, supports KaTeX formulas, code blocks, lists, etc.

**Navigation**: Prev/Next buttons, dot indicators, left/right arrow keys when focused.

**Guidelines for agents**:
- Aim for 3-7 slides per deck
- Keep each slide focused on one idea
- Use markdown features in body (bold, lists, code blocks, `$$...$$` formulas)

## Streaming Behavior

During streaming, if a block's opening fence is detected but no closing fence yet, a loading placeholder is shown:
- Whiteboard: "Generating diagram..."
- Simulation: "Building interactive simulation..."
- Slides: "Preparing presentation..."

Once the closing fence arrives, the placeholder is replaced with the rendered component.

## Playground

Visit `/playground` in the browser to test rich content rendering. The playground has:
- **Sample Content** tab — pre-built example with all three block types
- **Custom Input** tab — textarea where you can type/paste content with fenced blocks and see them render live

## Architecture

### Frontend

```
Agent message content (string)
  → parseRichContent()          [rich-content-parser.ts]
  → RichSegment[]               (markdown | whiteboard | simulation | slides | loading)
  → ChatMessage renders each    [chat-message.tsx]
    → registry lookup           [rich-block-registry.ts]
    → Dynamic component         (lazy-loaded)
```

**Rich Block Registry** (`frontend/src/lib/rich-block-registry.ts`): Single source of truth for all block types. Maps each block type to its loading message and lazy-loaded component.

**Rich Content Parser** (`frontend/src/lib/rich-content-parser.ts`): Builds regexes dynamically from the registry. No hardcoded block types.

**ChatMessage** (`frontend/src/components/classroom/chat-message.tsx`): Uses `Dynamic` component from registry — no hardcoded Switch/Match per block type.

### Backend

**Format Hints** (`backend/lib/backend/agents/teaching_agent.ex`): A `@format_hints` map keyed by scene type. When a scene matches, a system message is injected reminding the LLM to use the correct fenced block format.

**System Prompts** (`system-prompts/teaching-agent.md`): Scene-specific behavior section describes the output format for each scene type with examples.

## Adding a New Block Type

1. **Create the component** (e.g., `frontend/src/components/classroom/mermaid-viewer.tsx`)
   - Must accept a `content: string` prop
   - If the underlying component uses a different prop name, create a thin adapter

2. **Register it** in `frontend/src/lib/rich-block-registry.ts`:
   ```ts
   {
     blockType: 'mermaid',
     loadingMessage: 'Rendering diagram...',
     component: lazy(() => import('../components/classroom/mermaid-viewer')),
   }
   ```

3. **Add backend format hint** in `backend/lib/backend/agents/teaching_agent.ex` `@format_hints` map:
   ```elixir
   "mermaid_scene_type" => "Use ~~~mermaid blocks for diagrams..."
   ```

4. **Update the teaching agent prompt** in `system-prompts/teaching-agent.md` with the new scene behavior and example format.

That's it — the parser, ChatMessage, and loading placeholders pick it up automatically.
