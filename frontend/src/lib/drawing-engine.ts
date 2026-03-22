export type DrawTool = 'freehand' | 'line' | 'rect' | 'circle' | 'text' | 'eraser';

export interface DrawAction {
  type: DrawTool;
  points: { x: number; y: number }[];
  bounds?: { x: number; y: number; w: number; h: number };
  text?: string;
  color: string;
  strokeWidth: number;
}

/**
 * Convert screen coordinates to canvas coordinates accounting for zoom/pan transform.
 */
export function screenToCanvas(
  screenX: number,
  screenY: number,
  scale: number,
  translateX: number,
  translateY: number,
): { x: number; y: number } {
  return {
    x: (screenX - translateX) / scale,
    y: (screenY - translateY) / scale,
  };
}

export class DrawingEngine {
  private actions: DrawAction[] = [];
  private redoStack: DrawAction[] = [];
  private currentAction: DrawAction | null = null;
  private startPoint: { x: number; y: number } | null = null;

  getActions(): DrawAction[] {
    return [...this.actions];
  }

  canUndo(): boolean {
    return this.actions.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  beginStroke(x: number, y: number, tool: DrawTool, color: string, strokeWidth: number): void {
    this.startPoint = { x, y };
    this.currentAction = {
      type: tool,
      points: [{ x, y }],
      color,
      strokeWidth,
    };
  }

  continueStroke(x: number, y: number): void {
    if (!this.currentAction) return;

    if (this.currentAction.type === 'freehand' || this.currentAction.type === 'eraser') {
      this.currentAction.points.push({ x, y });
    } else {
      // For shapes, update the last point (endpoint)
      if (this.currentAction.points.length === 1) {
        this.currentAction.points.push({ x, y });
      } else {
        this.currentAction.points[1] = { x, y };
      }
    }
  }

  endStroke(text?: string): void {
    if (!this.currentAction || !this.startPoint) return;

    if (this.currentAction.type === 'text') {
      if (!text) {
        this.currentAction = null;
        this.startPoint = null;
        return;
      }
      this.currentAction.text = text;
      this.currentAction.points = [this.startPoint];
    } else if (this.currentAction.type === 'rect' || this.currentAction.type === 'circle') {
      const start = this.startPoint;
      const end = this.currentAction.points.length > 1
        ? this.currentAction.points[1]
        : this.startPoint;

      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const w = Math.abs(end.x - start.x);
      const h = Math.abs(end.y - start.y);
      this.currentAction.bounds = { x, y, w, h };
    } else if (this.currentAction.type === 'line') {
      // Keep just start and end points
      const end = this.currentAction.points.length > 1
        ? this.currentAction.points[this.currentAction.points.length - 1]
        : this.startPoint;
      this.currentAction.points = [this.startPoint, end];
    }

    this.actions.push(this.currentAction);
    this.redoStack = [];
    this.currentAction = null;
    this.startPoint = null;
  }

  undo(): void {
    if (this.actions.length === 0) return;
    this.redoStack.push(this.actions.pop()!);
  }

  redo(): void {
    if (this.redoStack.length === 0) return;
    this.actions.push(this.redoStack.pop()!);
  }

  clear(): void {
    this.actions = [];
    this.redoStack = [];
    this.currentAction = null;
    this.startPoint = null;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (const action of this.actions) {
      this.renderAction(ctx, action);
    }

    // Render in-progress action as live preview
    if (this.currentAction && this.startPoint) {
      this.renderPreview(ctx);
    }
  }

  private renderPreview(ctx: CanvasRenderingContext2D): void {
    const action = this.currentAction!;
    const start = this.startPoint!;

    if (action.type === 'freehand' || action.type === 'eraser') {
      // Already rendered via committed points in the action
      this.renderAction(ctx, action);
      return;
    }

    const end = action.points.length > 1 ? action.points[action.points.length - 1] : start;

    // Build a temporary preview action with computed bounds/points
    const preview: DrawAction = { ...action };

    if (action.type === 'line') {
      preview.points = [start, end];
      this.renderAction(ctx, preview);
    } else if (action.type === 'rect') {
      preview.bounds = {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        w: Math.abs(end.x - start.x),
        h: Math.abs(end.y - start.y),
      };
      this.renderAction(ctx, preview);
    } else if (action.type === 'circle') {
      preview.bounds = {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        w: Math.abs(end.x - start.x),
        h: Math.abs(end.y - start.y),
      };
      this.renderAction(ctx, preview);
    }
  }

  private renderAction(ctx: CanvasRenderingContext2D, action: DrawAction): void {
    if (action.type === 'eraser') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = action.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      if (action.points.length > 0) {
        ctx.moveTo(action.points[0].x, action.points[0].y);
        for (let i = 1; i < action.points.length; i++) {
          ctx.lineTo(action.points[i].x, action.points[i].y);
        }
      }
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.strokeStyle = action.color;
    ctx.lineWidth = action.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (action.type) {
      case 'freehand': {
        ctx.beginPath();
        if (action.points.length > 0) {
          ctx.moveTo(action.points[0].x, action.points[0].y);
          for (let i = 1; i < action.points.length; i++) {
            ctx.lineTo(action.points[i].x, action.points[i].y);
          }
        }
        ctx.stroke();
        break;
      }
      case 'line': {
        if (action.points.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(action.points[0].x, action.points[0].y);
          ctx.lineTo(action.points[1].x, action.points[1].y);
          ctx.stroke();
        }
        break;
      }
      case 'rect': {
        if (action.bounds) {
          ctx.strokeRect(action.bounds.x, action.bounds.y, action.bounds.w, action.bounds.h);
        }
        break;
      }
      case 'circle': {
        if (action.bounds) {
          const cx = action.bounds.x + action.bounds.w / 2;
          const cy = action.bounds.y + action.bounds.h / 2;
          const rx = action.bounds.w / 2;
          const ry = action.bounds.h / 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
      }
      case 'text': {
        if (action.text && action.points.length > 0) {
          ctx.font = `${Math.max(action.strokeWidth * 6, 14)}px sans-serif`;
          ctx.fillStyle = action.color;
          ctx.fillText(action.text, action.points[0].x, action.points[0].y);
        }
        break;
      }
    }
  }
}
