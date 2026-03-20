import { createSignal, For, Suspense } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import TopBar from '../components/layout/top-bar';
import { parseRichContent } from '../lib/rich-content-parser';
import { renderMarkdown } from '../lib/markdown-renderer';
import { getBlockDefinition, getLoadingMessage } from '../lib/rich-block-registry';

const SAMPLE_CONTENT = `Let me explain **binary search** with a presentation, a diagram, and an interactive demo.

~~~slides
[
  {
    "title": "What is Binary Search?",
    "body": "Binary search is an efficient algorithm for finding an item in a **sorted** list.\\n\\nTime complexity: $$O(\\\\log n)$$\\n\\nCompare this to linear search: $$O(n)$$"
  },
  {
    "title": "How It Works",
    "body": "1. Start with the middle element\\n2. If target equals middle, we're done\\n3. If target < middle, search the left half\\n4. If target > middle, search the right half\\n5. Repeat until found or range is empty"
  },
  {
    "title": "Code Example",
    "body": "\`\`\`python\\ndef binary_search(arr, target):\\n    low, high = 0, len(arr) - 1\\n    while low <= high:\\n        mid = (low + high) // 2\\n        if arr[mid] == target:\\n            return mid\\n        elif arr[mid] < target:\\n            low = mid + 1\\n        else:\\n            high = mid - 1\\n    return -1\\n\`\`\`"
  },
  {
    "title": "Key Takeaway",
    "body": "Binary search cuts the search space in half each step.\\n\\nFor a list of **1,000,000** items, it needs at most **20 comparisons** (since $$\\\\log_2 1000000 \\\\approx 20$$)."
  }
]
~~~

Here's a visual diagram of the process:

~~~whiteboard
<svg viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
  <style>text { font-family: sans-serif; }</style>
  <rect x="10" y="60" width="50" height="40" rx="4" fill="#3b82f6" opacity="0.15" stroke="#3b82f6"/>
  <text x="35" y="85" text-anchor="middle" font-size="14" fill="#334155">1</text>
  <rect x="70" y="60" width="50" height="40" rx="4" fill="#3b82f6" opacity="0.15" stroke="#3b82f6"/>
  <text x="95" y="85" text-anchor="middle" font-size="14" fill="#334155">3</text>
  <rect x="130" y="60" width="50" height="40" rx="4" fill="#3b82f6" opacity="0.15" stroke="#3b82f6"/>
  <text x="155" y="85" text-anchor="middle" font-size="14" fill="#334155">5</text>
  <rect x="190" y="60" width="50" height="40" rx="4" fill="#10b981" opacity="0.3" stroke="#10b981" stroke-width="2"/>
  <text x="215" y="85" text-anchor="middle" font-size="14" font-weight="bold" fill="#10b981">7</text>
  <rect x="250" y="60" width="50" height="40" rx="4" fill="#3b82f6" opacity="0.15" stroke="#3b82f6"/>
  <text x="275" y="85" text-anchor="middle" font-size="14" fill="#334155">9</text>
  <rect x="310" y="60" width="50" height="40" rx="4" fill="#3b82f6" opacity="0.15" stroke="#3b82f6"/>
  <text x="335" y="85" text-anchor="middle" font-size="14" fill="#334155">11</text>
  <rect x="370" y="60" width="50" height="40" rx="4" fill="#3b82f6" opacity="0.15" stroke="#3b82f6"/>
  <text x="395" y="85" text-anchor="middle" font-size="14" fill="#334155">13</text>
  <text x="215" y="40" text-anchor="middle" font-size="12" fill="#10b981" font-weight="bold">mid</text>
  <line x1="215" y1="45" x2="215" y2="58" stroke="#10b981" stroke-width="2"/>
  <text x="300" y="140" text-anchor="middle" font-size="13" fill="#64748b">Sorted array — target: 7 — found at mid!</text>
</svg>
~~~

Now try this interactive binary search:

~~~simulation
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: sans-serif; padding: 1rem; margin: 0; background: #f8fafc; }
  h3 { margin: 0 0 0.75rem; color: #1e293b; }
  .array { display: flex; gap: 4px; margin: 0.75rem 0; }
  .cell { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
    border: 2px solid #cbd5e1; border-radius: 6px; font-weight: 600; font-size: 15px;
    background: white; transition: all 0.3s; }
  .cell.active { border-color: #3b82f6; background: #eff6ff; }
  .cell.mid { border-color: #f59e0b; background: #fef3c7; }
  .cell.found { border-color: #10b981; background: #d1fae5; }
  .cell.out { opacity: 0.3; }
  .controls { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
  button { padding: 0.4rem 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px;
    background: white; cursor: pointer; font-size: 0.85rem; }
  button:hover { background: #f1f5f9; }
  button.primary { background: #3b82f6; color: white; border-color: #3b82f6; }
  input { width: 60px; padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.85rem; }
  .log { margin-top: 0.75rem; font-size: 0.8rem; color: #64748b; min-height: 1.5rem; }
</style>
</head>
<body>
  <h3>Binary Search Visualizer</h3>
  <div class="array" id="arr"></div>
  <div class="controls">
    <label>Target: <input type="number" id="target" value="7" min="1" max="19"></label>
    <button class="primary" onclick="step()">Step</button>
    <button onclick="reset()">Reset</button>
  </div>
  <div class="log" id="log">Click "Step" to begin searching.</div>
  <script>
    var data = [1,2,3,5,7,8,9,11,13,15,17,19];
    var low, high, mid, found, done;
    function reset() {
      low = 0; high = data.length - 1; mid = -1; found = false; done = false;
      document.getElementById('log').textContent = 'Click "Step" to begin searching.';
      draw();
    }
    function draw() {
      var el = document.getElementById('arr');
      el.innerHTML = '';
      for (var i = 0; i < data.length; i++) {
        var c = document.createElement('div');
        c.className = 'cell';
        c.textContent = data[i];
        if (found && i === mid) c.className += ' found';
        else if (i === mid) c.className += ' mid';
        else if (!done && i >= low && i <= high) c.className += ' active';
        else if (done && !found) c.className += ' out';
        else if (i < low || i > high) c.className += ' out';
        el.appendChild(c);
      }
    }
    function step() {
      if (done) return;
      var target = parseInt(document.getElementById('target').value);
      if (low > high) {
        document.getElementById('log').textContent = 'Not found! ' + target + ' is not in the array.';
        done = true; draw(); return;
      }
      mid = Math.floor((low + high) / 2);
      if (data[mid] === target) {
        document.getElementById('log').textContent = 'Found ' + target + ' at index ' + mid + '!';
        found = true; done = true;
      } else if (data[mid] < target) {
        document.getElementById('log').textContent = 'arr[' + mid + ']=' + data[mid] + ' < ' + target + ' → search right half';
        low = mid + 1;
      } else {
        document.getElementById('log').textContent = 'arr[' + mid + ']=' + data[mid] + ' > ' + target + ' → search left half';
        high = mid - 1;
      }
      draw();
    }
    reset();
  </script>
</body>
</html>
~~~`;

export default function RichContentPlayground() {
  const [customContent, setCustomContent] = createSignal('');
  const [activeTab, setActiveTab] = createSignal<'sample' | 'custom'>('sample');

  const currentContent = () => activeTab() === 'sample' ? SAMPLE_CONTENT : customContent();
  const segments = () => parseRichContent(currentContent());

  const renderSegment = (segment: { type: string; content?: string; blockType?: string }) => {
    if (segment.type === 'markdown') {
      return <div class="playground-markdown" innerHTML={renderMarkdown(segment.content!)} />;
    }
    if (segment.type === 'loading') {
      return (
        <div class="playground-loading">
          <div class="playground-loading-spinner" />
          <span>{getLoadingMessage(segment.blockType!)}</span>
        </div>
      );
    }
    const def = getBlockDefinition(segment.type);
    if (def) {
      return (
        <Suspense fallback={
          <div class="playground-loading">
            <div class="playground-loading-spinner" />
            <span>{def.loadingMessage}</span>
          </div>
        }>
          <Dynamic component={def.component} content={segment.content!} />
        </Suspense>
      );
    }
    return <div class="playground-markdown" innerHTML={renderMarkdown(segment.content || '')} />;
  };

  return (
    <>
      <TopBar />
      <div class="playground-container">
        <div class="playground-header">
          <h1 class="playground-title">Rich Content Playground</h1>
          <p class="playground-subtitle">Test slides, whiteboard, and simulation rendering</p>
        </div>

        <div class="playground-tabs">
          <button
            class="playground-tab"
            classList={{ 'playground-tab--active': activeTab() === 'sample' }}
            onClick={() => setActiveTab('sample')}
          >
            Sample Content
          </button>
          <button
            class="playground-tab"
            classList={{ 'playground-tab--active': activeTab() === 'custom' }}
            onClick={() => setActiveTab('custom')}
          >
            Custom Input
          </button>
        </div>

        {activeTab() === 'custom' && (
          <div class="playground-editor">
            <textarea
              class="playground-textarea"
              placeholder={`Type or paste content with ~~~whiteboard, ~~~simulation, or ~~~slides blocks...\n\nExample:\nHere is a diagram:\n\n~~~whiteboard\n<svg viewBox="0 0 200 100"><rect width="100" height="50" fill="#3b82f6" rx="8"/><text x="50" y="30" text-anchor="middle" fill="white">Hello</text></svg>\n~~~`}
              value={customContent()}
              onInput={(e) => setCustomContent(e.currentTarget.value)}
              rows={12}
            />
          </div>
        )}

        <div class="playground-preview-label">Preview</div>
        <div class="playground-message">
          {segments().length > 0 ? (
            <For each={segments()}>
              {(segment) => renderSegment(segment as any)}
            </For>
          ) : (
            <div class="playground-empty">Enter content above to see the preview</div>
          )}
        </div>
      </div>

      <style>{`
        .playground-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
        }

        .playground-header {
          margin-bottom: 1.5rem;
        }

        .playground-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 0.25rem;
        }

        .playground-subtitle {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin: 0;
        }

        .playground-tabs {
          display: flex;
          gap: 0;
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .playground-tab {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-muted);
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }

        .playground-tab:hover {
          color: var(--text-primary);
        }

        .playground-tab--active {
          color: var(--accent-color);
          border-bottom-color: var(--accent-color);
        }

        .playground-editor {
          margin-bottom: 1rem;
        }

        .playground-textarea {
          width: 100%;
          font-family: monospace;
          font-size: 0.8rem;
          line-height: 1.5;
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-secondary);
          color: var(--text-primary);
          resize: vertical;
          box-sizing: border-box;
        }

        .playground-textarea::placeholder {
          color: var(--text-muted);
          opacity: 0.6;
        }

        .playground-textarea:focus {
          outline: none;
          border-color: var(--accent-color);
        }

        .playground-preview-label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
        }

        .playground-message {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 1.25rem;
        }

        .playground-markdown {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .playground-markdown p {
          margin: 0 0 0.5rem;
        }

        .playground-markdown strong {
          color: var(--text-primary);
        }

        .playground-empty {
          font-size: 0.85rem;
          color: var(--text-muted);
          text-align: center;
          padding: 2rem;
        }

        .playground-loading {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin: 0.75rem 0;
          padding: 1rem 1.25rem;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-secondary);
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        .playground-loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid var(--border-color);
          border-top-color: var(--accent-color);
          border-radius: 50%;
          animation: playground-spin 0.8s linear infinite;
        }

        @keyframes playground-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
