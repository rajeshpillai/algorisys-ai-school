const templates: Record<string, string> = {
  'bubble-sort': `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: sans-serif; padding: 1rem; margin: 0; background: #f8fafc; }
  h3 { margin: 0 0 0.75rem; color: #1e293b; font-size: 1.1rem; }
  .bars { display: flex; align-items: flex-end; gap: 3px; height: 180px; margin: 0.75rem 0; }
  .bar { flex: 1; border-radius: 3px 3px 0 0; transition: height 0.2s, background 0.2s;
    display: flex; align-items: flex-end; justify-content: center; padding-bottom: 2px;
    font-size: 0.7rem; color: white; font-weight: 600; min-width: 20px; }
  .bar.comparing { background: #f59e0b !important; }
  .bar.swapping { background: #ef4444 !important; }
  .bar.sorted { background: #10b981 !important; }
  .bar.default { background: #3b82f6; }
  .controls { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
  button { padding: 0.4rem 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px;
    background: white; cursor: pointer; font-size: 0.85rem; }
  button:hover { background: #f1f5f9; }
  button.primary { background: #3b82f6; color: white; border-color: #3b82f6; }
  .stats { margin-top: 0.75rem; font-size: 0.8rem; color: #64748b; }
  .stats span { font-weight: 600; color: #1e293b; }
</style>
</head>
<body>
  <h3>Bubble Sort Visualizer</h3>
  <div class="bars" id="bars"></div>
  <div class="controls">
    <button class="primary" onclick="step()">Step</button>
    <button onclick="autoPlay()">Auto Play</button>
    <button onclick="init()">Reset</button>
  </div>
  <div class="stats">
    Comparisons: <span id="comps">0</span> | Swaps: <span id="swaps">0</span> |
    <span id="status">Click Step or Auto Play to begin</span>
  </div>
  <script>
    var arr, i, j, comps, swaps, done, interval;
    function init() {
      clearInterval(interval);
      arr = [38, 27, 43, 3, 9, 82, 10, 55, 19, 64, 31, 47];
      i = 0; j = 0; comps = 0; swaps = 0; done = false;
      document.getElementById('comps').textContent = '0';
      document.getElementById('swaps').textContent = '0';
      document.getElementById('status').textContent = 'Click Step or Auto Play to begin';
      draw([]);
    }
    function draw(highlights) {
      var el = document.getElementById('bars');
      el.innerHTML = '';
      var max = Math.max.apply(null, arr);
      for (var k = 0; k < arr.length; k++) {
        var bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = (arr[k] / max * 160) + 'px';
        if (highlights.indexOf(k) >= 0) bar.className += ' comparing';
        else if (done || k >= arr.length - i) bar.className += ' sorted';
        else bar.className += ' default';
        bar.textContent = arr[k];
        el.appendChild(bar);
      }
    }
    function step() {
      if (done) return;
      if (j < arr.length - 1 - i) {
        comps++;
        document.getElementById('comps').textContent = comps;
        if (arr[j] > arr[j + 1]) {
          var tmp = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = tmp;
          swaps++;
          document.getElementById('swaps').textContent = swaps;
          draw([j, j + 1]);
          document.getElementById('status').textContent = 'Swapped ' + arr[j] + ' and ' + arr[j+1];
        } else {
          draw([j, j + 1]);
          document.getElementById('status').textContent = arr[j] + ' <= ' + arr[j+1] + ', no swap';
        }
        j++;
      } else {
        j = 0; i++;
        if (i >= arr.length - 1) {
          done = true;
          clearInterval(interval);
          draw([]);
          document.getElementById('status').textContent = 'Sort complete!';
          parent.postMessage({ type: 'complete', value: 1, label: 'Sort completed!' }, '*');
          parent.postMessage({ type: 'score', value: Math.max(0, 100 - swaps * 2), label: 'Efficiency' }, '*');
        } else {
          draw([]);
          document.getElementById('status').textContent = 'Pass ' + (i + 1) + ' starting...';
        }
      }
    }
    function autoPlay() {
      if (done) return;
      clearInterval(interval);
      interval = setInterval(function() { if (done) clearInterval(interval); else step(); }, 300);
    }
    init();
  </script>
</body>
</html>`,

  'stack-queue': `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: sans-serif; padding: 1rem; margin: 0; background: #f8fafc; }
  h3 { margin: 0 0: 0.75rem; color: #1e293b; font-size: 1.1rem; }
  .tabs { display: flex; gap: 0; margin: 0.75rem 0 0.5rem; border-bottom: 2px solid #e2e8f0; }
  .tab { padding: 0.4rem 1rem; font-size: 0.85rem; font-weight: 500; border: none;
    background: none; cursor: pointer; color: #64748b; border-bottom: 2px solid transparent;
    margin-bottom: -2px; }
  .tab.active { color: #3b82f6; border-bottom-color: #3b82f6; }
  .viz { display: flex; gap: 4px; min-height: 50px; margin: 0.75rem 0; padding: 0.5rem;
    border: 1px solid #e2e8f0; border-radius: 6px; background: white; align-items: center;
    flex-wrap: wrap; }
  .viz.vertical { flex-direction: column-reverse; min-height: 120px; align-items: stretch; }
  .item { padding: 0.4rem 0.8rem; border-radius: 4px; font-size: 0.85rem; font-weight: 600;
    text-align: center; animation: fadeIn 0.2s; }
  .item.stack { background: #ede9fe; color: #7c3aed; border: 1px solid #c4b5fd; }
  .item.queue { background: #dbeafe; color: #2563eb; border: 1px solid #93c5fd; }
  .controls { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
  input { width: 80px; padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.85rem; }
  button { padding: 0.4rem 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px;
    background: white; cursor: pointer; font-size: 0.85rem; }
  button:hover { background: #f1f5f9; }
  button.primary { background: #3b82f6; color: white; border-color: #3b82f6; }
  button.danger { background: #ef4444; color: white; border-color: #ef4444; }
  .log { margin-top: 0.75rem; font-size: 0.8rem; color: #64748b; min-height: 1.5rem; }
  .empty { color: #94a3b8; font-size: 0.85rem; padding: 1rem; text-align: center; }
  @keyframes fadeIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
</style>
</head>
<body>
  <h3>Stack & Queue Demo</h3>
  <div class="tabs">
    <button class="tab active" onclick="switchMode('stack')" id="tab-stack">Stack (LIFO)</button>
    <button class="tab" onclick="switchMode('queue')" id="tab-queue">Queue (FIFO)</button>
  </div>
  <div class="viz vertical" id="viz"></div>
  <div class="controls">
    <input type="text" id="val" placeholder="Value..." maxlength="10">
    <button class="primary" onclick="push()">Push</button>
    <button class="danger" onclick="pop()">Pop</button>
    <button onclick="reset()">Clear</button>
  </div>
  <div class="log" id="log">Add items to see the data structure in action.</div>
  <script>
    var items = [], mode = 'stack', ops = 0;
    function switchMode(m) {
      mode = m;
      document.getElementById('tab-stack').className = m === 'stack' ? 'tab active' : 'tab';
      document.getElementById('tab-queue').className = m === 'queue' ? 'tab active' : 'tab';
      var viz = document.getElementById('viz');
      viz.className = m === 'stack' ? 'viz vertical' : 'viz';
      reset();
    }
    function draw() {
      var viz = document.getElementById('viz');
      viz.innerHTML = '';
      if (items.length === 0) {
        viz.innerHTML = '<div class="empty">Empty — push an item</div>';
        return;
      }
      for (var i = 0; i < items.length; i++) {
        var el = document.createElement('div');
        el.className = 'item ' + mode;
        el.textContent = items[i];
        viz.appendChild(el);
      }
    }
    function push() {
      var val = document.getElementById('val').value.trim();
      if (!val) return;
      items.push(val);
      ops++;
      document.getElementById('val').value = '';
      draw();
      document.getElementById('log').textContent = 'Pushed "' + val + '" — size: ' + items.length;
      parent.postMessage({ type: 'progress', value: ops, label: ops + ' operations' }, '*');
    }
    function pop() {
      if (items.length === 0) {
        document.getElementById('log').textContent = 'Cannot pop — ' + mode + ' is empty!';
        return;
      }
      ops++;
      var val;
      if (mode === 'stack') { val = items.pop(); }
      else { val = items.shift(); }
      draw();
      document.getElementById('log').textContent = (mode === 'stack' ? 'Popped' : 'Dequeued') + ' "' + val + '" — size: ' + items.length;
      if (items.length === 0) {
        parent.postMessage({ type: 'complete', value: 1, label: 'All items removed' }, '*');
      }
      parent.postMessage({ type: 'progress', value: ops, label: ops + ' operations' }, '*');
    }
    function reset() { items = []; ops = 0; draw(); document.getElementById('log').textContent = 'Cleared.'; }
    draw();
  </script>
</body>
</html>`,

  'projectile-motion': `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: sans-serif; padding: 1rem; margin: 0; background: #f8fafc; }
  h3 { margin: 0 0 0.5rem; color: #1e293b; font-size: 1.1rem; }
  canvas { border: 1px solid #e2e8f0; border-radius: 6px; background: white; width: 100%; }
  .controls { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin: 0.5rem 0; }
  .slider-group { display: flex; flex-direction: column; gap: 2px; }
  .slider-group label { font-size: 0.75rem; color: #64748b; font-weight: 500; }
  .slider-group input[type=range] { width: 120px; }
  .slider-group .val { font-size: 0.8rem; font-weight: 600; color: #1e293b; }
  button { padding: 0.4rem 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px;
    background: white; cursor: pointer; font-size: 0.85rem; }
  button.primary { background: #3b82f6; color: white; border-color: #3b82f6; }
  .stats { font-size: 0.8rem; color: #64748b; margin-top: 0.5rem; }
  .stats span { font-weight: 600; color: #1e293b; }
</style>
</head>
<body>
  <h3>Projectile Motion</h3>
  <canvas id="c" width="560" height="280"></canvas>
  <div class="controls">
    <div class="slider-group">
      <label>Angle: <span class="val" id="aVal">45</span>°</label>
      <input type="range" id="angle" min="5" max="85" value="45" oninput="updateSliders()">
    </div>
    <div class="slider-group">
      <label>Velocity: <span class="val" id="vVal">40</span> m/s</label>
      <input type="range" id="vel" min="10" max="80" value="40" oninput="updateSliders()">
    </div>
    <button class="primary" onclick="launch()">Launch</button>
    <button onclick="reset()">Reset</button>
  </div>
  <div class="stats">
    Range: <span id="range">—</span> m |
    Max Height: <span id="maxH">—</span> m |
    Time: <span id="time">—</span> s
  </div>
  <script>
    var canvas = document.getElementById('c');
    var ctx = canvas.getContext('2d');
    var g = 9.81, trail = [], animId = null, launched = false;
    function updateSliders() {
      document.getElementById('aVal').textContent = document.getElementById('angle').value;
      document.getElementById('vVal').textContent = document.getElementById('vel').value;
      if (!launched) drawPreview();
    }
    function drawGround() {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
      ctx.strokeStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 20);
      ctx.lineTo(canvas.width, canvas.height - 20);
      ctx.stroke();
    }
    function toScreen(x, y) {
      var scale = 3;
      return { sx: 30 + x * scale, sy: canvas.height - 20 - y * scale };
    }
    function drawPreview() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGround();
      var a = +document.getElementById('angle').value * Math.PI / 180;
      var v = +document.getElementById('vel').value;
      // Draw angle indicator
      var p = toScreen(0, 0);
      ctx.beginPath();
      ctx.moveTo(p.sx, p.sy);
      ctx.lineTo(p.sx + Math.cos(a) * 60, p.sy - Math.sin(a) * 60);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.lineWidth = 1;
      // Draw dot
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
    }
    function launch() {
      if (animId) cancelAnimationFrame(animId);
      var a = +document.getElementById('angle').value * Math.PI / 180;
      var v = +document.getElementById('vel').value;
      var vx = v * Math.cos(a), vy = v * Math.sin(a);
      var totalTime = 2 * vy / g;
      var maxH = (vy * vy) / (2 * g);
      var range = vx * totalTime;
      document.getElementById('range').textContent = range.toFixed(1);
      document.getElementById('maxH').textContent = maxH.toFixed(1);
      document.getElementById('time').textContent = totalTime.toFixed(2);
      trail = [];
      launched = true;
      var t = 0, dt = 0.05;
      function frame() {
        if (t > totalTime + 0.1) {
          parent.postMessage({ type: 'complete', value: 1, label: 'Simulation complete' }, '*');
          parent.postMessage({ type: 'score', value: Math.round(range), label: 'Range (m)' }, '*');
          return;
        }
        var x = vx * t;
        var y = vy * t - 0.5 * g * t * t;
        if (y < 0) y = 0;
        trail.push({ x: x, y: y });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGround();
        // Trail
        ctx.beginPath();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        for (var i = 0; i < trail.length; i++) {
          var p = toScreen(trail[i].x, trail[i].y);
          if (i === 0) ctx.moveTo(p.sx, p.sy); else ctx.lineTo(p.sx, p.sy);
        }
        ctx.stroke();
        // Ball
        var bp = toScreen(x, y);
        ctx.beginPath();
        ctx.arc(bp.sx, bp.sy, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        // Equations
        ctx.fillStyle = '#64748b';
        ctx.font = '11px sans-serif';
        ctx.fillText('x = v₀cos(θ)·t = ' + x.toFixed(1) + 'm', canvas.width - 200, 20);
        ctx.fillText('y = v₀sin(θ)·t - ½gt² = ' + y.toFixed(1) + 'm', canvas.width - 200, 36);
        t += dt;
        animId = requestAnimationFrame(frame);
      }
      frame();
    }
    function reset() {
      if (animId) cancelAnimationFrame(animId);
      launched = false; trail = [];
      document.getElementById('range').textContent = '—';
      document.getElementById('maxH').textContent = '—';
      document.getElementById('time').textContent = '—';
      drawPreview();
    }
    drawPreview();
  </script>
</body>
</html>`,
};

/** Get a simulation template by name */
export function getSimulationTemplate(name: string): string | undefined {
  return templates[name];
}

/** Get all available template names */
export function getTemplateNames(): string[] {
  return Object.keys(templates);
}
