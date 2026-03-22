import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DrawingEngine, type DrawAction, type DrawTool, screenToCanvas } from './drawing-engine';

describe('DrawingEngine', () => {
  let engine: DrawingEngine;

  beforeEach(() => {
    engine = new DrawingEngine();
  });

  describe('initial state', () => {
    it('starts with empty action list', () => {
      expect(engine.getActions()).toEqual([]);
    });

    it('cannot undo or redo initially', () => {
      expect(engine.canUndo()).toBe(false);
      expect(engine.canRedo()).toBe(false);
    });
  });

  describe('freehand drawing lifecycle', () => {
    it('beginStroke creates a new action', () => {
      engine.beginStroke(10, 20, 'freehand', '#000000', 2);
      expect(engine.getActions()).toHaveLength(0); // not committed yet
    });

    it('endStroke commits the action', () => {
      engine.beginStroke(10, 20, 'freehand', '#ff0000', 3);
      engine.continueStroke(15, 25);
      engine.continueStroke(20, 30);
      engine.endStroke();

      const actions = engine.getActions();
      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe('freehand');
      expect(actions[0].color).toBe('#ff0000');
      expect(actions[0].strokeWidth).toBe(3);
      expect(actions[0].points).toEqual([
        { x: 10, y: 20 },
        { x: 15, y: 25 },
        { x: 20, y: 30 },
      ]);
    });

    it('endStroke without beginStroke is a no-op', () => {
      engine.endStroke();
      expect(engine.getActions()).toHaveLength(0);
    });

    it('continueStroke without beginStroke is a no-op', () => {
      engine.continueStroke(10, 20);
      expect(engine.getActions()).toHaveLength(0);
    });
  });

  describe('shape tools', () => {
    it('line tool records start and end points', () => {
      engine.beginStroke(10, 20, 'line', '#000', 2);
      engine.continueStroke(100, 200);
      engine.endStroke();

      const action = engine.getActions()[0];
      expect(action.type).toBe('line');
      expect(action.points).toEqual([
        { x: 10, y: 20 },
        { x: 100, y: 200 },
      ]);
    });

    it('rect tool calculates bounds from start and end', () => {
      engine.beginStroke(10, 20, 'rect', '#000', 2);
      engine.continueStroke(110, 80);
      engine.endStroke();

      const action = engine.getActions()[0];
      expect(action.type).toBe('rect');
      expect(action.bounds).toEqual({ x: 10, y: 20, w: 100, h: 60 });
    });

    it('rect tool handles negative drag (right-to-left)', () => {
      engine.beginStroke(110, 80, 'rect', '#000', 2);
      engine.continueStroke(10, 20);
      engine.endStroke();

      const action = engine.getActions()[0];
      expect(action.bounds).toEqual({ x: 10, y: 20, w: 100, h: 60 });
    });

    it('circle tool calculates bounds from start and end', () => {
      engine.beginStroke(50, 50, 'circle', '#000', 2);
      engine.continueStroke(150, 100);
      engine.endStroke();

      const action = engine.getActions()[0];
      expect(action.type).toBe('circle');
      expect(action.bounds).toEqual({ x: 50, y: 50, w: 100, h: 50 });
    });

    it('text tool stores text and position', () => {
      engine.beginStroke(50, 80, 'text', '#333', 2);
      engine.endStroke('Hello World');

      const action = engine.getActions()[0];
      expect(action.type).toBe('text');
      expect(action.text).toBe('Hello World');
      expect(action.points).toEqual([{ x: 50, y: 80 }]);
    });

    it('text tool with empty text is not committed', () => {
      engine.beginStroke(50, 80, 'text', '#333', 2);
      engine.endStroke('');

      expect(engine.getActions()).toHaveLength(0);
    });
  });

  describe('eraser', () => {
    it('eraser action has type eraser', () => {
      engine.beginStroke(10, 20, 'eraser', '#000', 10);
      engine.continueStroke(30, 40);
      engine.endStroke();

      const action = engine.getActions()[0];
      expect(action.type).toBe('eraser');
    });
  });

  describe('undo/redo', () => {
    beforeEach(() => {
      // Add two actions
      engine.beginStroke(0, 0, 'freehand', '#000', 2);
      engine.continueStroke(10, 10);
      engine.endStroke();

      engine.beginStroke(20, 20, 'freehand', '#f00', 2);
      engine.continueStroke(30, 30);
      engine.endStroke();
    });

    it('undo removes last action', () => {
      engine.undo();
      expect(engine.getActions()).toHaveLength(1);
      expect(engine.getActions()[0].color).toBe('#000');
    });

    it('undo enables redo', () => {
      expect(engine.canRedo()).toBe(false);
      engine.undo();
      expect(engine.canRedo()).toBe(true);
    });

    it('redo restores undone action', () => {
      engine.undo();
      engine.redo();
      expect(engine.getActions()).toHaveLength(2);
      expect(engine.getActions()[1].color).toBe('#f00');
    });

    it('new action after undo clears redo stack', () => {
      engine.undo();
      expect(engine.canRedo()).toBe(true);

      engine.beginStroke(50, 50, 'freehand', '#0f0', 2);
      engine.continueStroke(60, 60);
      engine.endStroke();

      expect(engine.canRedo()).toBe(false);
      expect(engine.getActions()).toHaveLength(2);
      expect(engine.getActions()[1].color).toBe('#0f0');
    });

    it('multiple undos work correctly', () => {
      engine.undo();
      engine.undo();
      expect(engine.getActions()).toHaveLength(0);
      expect(engine.canUndo()).toBe(false);
    });

    it('undo when empty is a no-op', () => {
      engine.undo();
      engine.undo();
      engine.undo(); // extra undo
      expect(engine.getActions()).toHaveLength(0);
    });

    it('redo when empty is a no-op', () => {
      engine.redo();
      expect(engine.getActions()).toHaveLength(2);
    });
  });

  describe('clear', () => {
    it('removes all actions and redo stack', () => {
      engine.beginStroke(0, 0, 'freehand', '#000', 2);
      engine.continueStroke(10, 10);
      engine.endStroke();
      engine.undo();

      engine.clear();
      expect(engine.getActions()).toHaveLength(0);
      expect(engine.canUndo()).toBe(false);
      expect(engine.canRedo()).toBe(false);
    });
  });

  describe('render', () => {
    let ctx: any;

    beforeEach(() => {
      ctx = {
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        strokeRect: vi.fn(),
        ellipse: vi.fn(),
        fillText: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        clearRect: vi.fn(),
        globalCompositeOperation: 'source-over',
        strokeStyle: '',
        lineWidth: 0,
        lineCap: 'butt' as CanvasLineCap,
        lineJoin: 'miter' as CanvasLineJoin,
        font: '',
        fillStyle: '',
        canvas: { width: 600, height: 400 },
      };
    });

    it('clears canvas before rendering', () => {
      engine.render(ctx);
      expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 600, 400);
    });

    it('renders freehand strokes with moveTo and lineTo', () => {
      engine.beginStroke(10, 20, 'freehand', '#ff0000', 3);
      engine.continueStroke(30, 40);
      engine.continueStroke(50, 60);
      engine.endStroke();

      engine.render(ctx);

      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.moveTo).toHaveBeenCalledWith(10, 20);
      expect(ctx.lineTo).toHaveBeenCalledWith(30, 40);
      expect(ctx.lineTo).toHaveBeenCalledWith(50, 60);
      expect(ctx.stroke).toHaveBeenCalled();
    });

    it('renders line with moveTo and lineTo', () => {
      engine.beginStroke(10, 20, 'line', '#000', 2);
      engine.continueStroke(100, 200);
      engine.endStroke();

      engine.render(ctx);

      expect(ctx.moveTo).toHaveBeenCalledWith(10, 20);
      expect(ctx.lineTo).toHaveBeenCalledWith(100, 200);
    });

    it('renders rect with strokeRect', () => {
      engine.beginStroke(10, 20, 'rect', '#000', 2);
      engine.continueStroke(110, 80);
      engine.endStroke();

      engine.render(ctx);

      expect(ctx.strokeRect).toHaveBeenCalledWith(10, 20, 100, 60);
    });

    it('renders circle with ellipse', () => {
      engine.beginStroke(50, 50, 'circle', '#000', 2);
      engine.continueStroke(150, 100);
      engine.endStroke();

      engine.render(ctx);

      expect(ctx.ellipse).toHaveBeenCalled();
    });

    it('renders text with fillText', () => {
      engine.beginStroke(50, 80, 'text', '#333', 2);
      engine.endStroke('Hello');

      engine.render(ctx);

      expect(ctx.fillText).toHaveBeenCalledWith('Hello', 50, 80);
    });

    it('uses destination-out for eraser', () => {
      engine.beginStroke(10, 20, 'eraser', '#000', 10);
      engine.continueStroke(30, 40);
      engine.endStroke();

      engine.render(ctx);

      // Check that globalCompositeOperation was set to destination-out
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('sets correct stroke styles', () => {
      engine.beginStroke(10, 20, 'freehand', '#ff0000', 5);
      engine.continueStroke(30, 40);
      engine.endStroke();

      engine.render(ctx);

      // strokeStyle and lineWidth should be set before drawing
      expect(ctx.strokeStyle).toBe('#ff0000');
      expect(ctx.lineWidth).toBe(5);
    });
  });
});

describe('screenToCanvas', () => {
  it('returns same coordinates at scale=1 with no translation', () => {
    const result = screenToCanvas(100, 200, 1, 0, 0);
    expect(result).toEqual({ x: 100, y: 200 });
  });

  it('divides by scale factor', () => {
    const result = screenToCanvas(200, 400, 2, 0, 0);
    expect(result).toEqual({ x: 100, y: 200 });
  });

  it('subtracts translation before scaling', () => {
    const result = screenToCanvas(150, 250, 1, 50, 50);
    expect(result).toEqual({ x: 100, y: 200 });
  });

  it('handles combined scale and translation', () => {
    const result = screenToCanvas(300, 500, 2, 100, 100);
    expect(result).toEqual({ x: 100, y: 200 });
  });

  it('handles fractional scale', () => {
    const result = screenToCanvas(50, 100, 0.5, 0, 0);
    expect(result).toEqual({ x: 100, y: 200 });
  });
});
