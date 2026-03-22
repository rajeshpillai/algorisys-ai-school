import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@solidjs/testing-library';

vi.mock('marked', () => ({
  marked: { parse: (text: string) => text, use: vi.fn() },
}));

import DrawingToolbar from './drawing-toolbar';

describe('DrawingToolbar', () => {
  const defaultProps = {
    onToolChange: vi.fn(),
    onColorChange: vi.fn(),
    onStrokeWidthChange: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onClear: vi.fn(),
    canUndo: true,
    canRedo: true,
    activeTool: 'freehand' as const,
    activeColor: '#000000',
    activeStrokeWidth: 2,
  };

  it('renders all tool buttons', () => {
    const { getByTitle } = render(() => <DrawingToolbar {...defaultProps} />);
    expect(getByTitle('Pen')).toBeInTheDocument();
    expect(getByTitle('Line')).toBeInTheDocument();
    expect(getByTitle('Rectangle')).toBeInTheDocument();
    expect(getByTitle('Circle')).toBeInTheDocument();
    expect(getByTitle('Text')).toBeInTheDocument();
    expect(getByTitle('Eraser')).toBeInTheDocument();
  });

  it('renders undo/redo/clear buttons', () => {
    const { getByTitle } = render(() => <DrawingToolbar {...defaultProps} />);
    expect(getByTitle('Undo')).toBeInTheDocument();
    expect(getByTitle('Redo')).toBeInTheDocument();
    expect(getByTitle('Clear')).toBeInTheDocument();
  });

  it('fires onToolChange when tool button clicked', () => {
    const onToolChange = vi.fn();
    const { getByTitle } = render(() => (
      <DrawingToolbar {...defaultProps} onToolChange={onToolChange} />
    ));
    fireEvent.click(getByTitle('Line'));
    expect(onToolChange).toHaveBeenCalledWith('line');
  });

  it('fires onUndo when undo clicked', () => {
    const onUndo = vi.fn();
    const { getByTitle } = render(() => (
      <DrawingToolbar {...defaultProps} onUndo={onUndo} />
    ));
    fireEvent.click(getByTitle('Undo'));
    expect(onUndo).toHaveBeenCalled();
  });

  it('fires onRedo when redo clicked', () => {
    const onRedo = vi.fn();
    const { getByTitle } = render(() => (
      <DrawingToolbar {...defaultProps} onRedo={onRedo} />
    ));
    fireEvent.click(getByTitle('Redo'));
    expect(onRedo).toHaveBeenCalled();
  });

  it('fires onClear when clear clicked', () => {
    const onClear = vi.fn();
    const { getByTitle } = render(() => (
      <DrawingToolbar {...defaultProps} onClear={onClear} />
    ));
    fireEvent.click(getByTitle('Clear'));
    expect(onClear).toHaveBeenCalled();
  });

  it('disables undo button when canUndo is false', () => {
    const { getByTitle } = render(() => (
      <DrawingToolbar {...defaultProps} canUndo={false} />
    ));
    expect(getByTitle('Undo')).toBeDisabled();
  });

  it('disables redo button when canRedo is false', () => {
    const { getByTitle } = render(() => (
      <DrawingToolbar {...defaultProps} canRedo={false} />
    ));
    expect(getByTitle('Redo')).toBeDisabled();
  });

  it('highlights active tool', () => {
    const { getByTitle } = render(() => (
      <DrawingToolbar {...defaultProps} activeTool="rect" />
    ));
    expect(getByTitle('Rectangle').className).toContain('active');
  });

  it('renders color palette buttons', () => {
    const { container } = render(() => <DrawingToolbar {...defaultProps} />);
    const colorBtns = container.querySelectorAll('.drawing-toolbar-color');
    expect(colorBtns.length).toBeGreaterThanOrEqual(6);
  });

  it('fires onColorChange when color clicked', () => {
    const onColorChange = vi.fn();
    const { container } = render(() => (
      <DrawingToolbar {...defaultProps} onColorChange={onColorChange} />
    ));
    const colorBtns = container.querySelectorAll('.drawing-toolbar-color');
    fireEvent.click(colorBtns[1]);
    expect(onColorChange).toHaveBeenCalled();
  });

  it('renders stroke width buttons', () => {
    const { getByTitle } = render(() => <DrawingToolbar {...defaultProps} />);
    expect(getByTitle('Thin')).toBeInTheDocument();
    expect(getByTitle('Medium')).toBeInTheDocument();
    expect(getByTitle('Thick')).toBeInTheDocument();
  });

  it('fires onStrokeWidthChange when width clicked', () => {
    const onStrokeWidthChange = vi.fn();
    const { getByTitle } = render(() => (
      <DrawingToolbar {...defaultProps} onStrokeWidthChange={onStrokeWidthChange} />
    ));
    fireEvent.click(getByTitle('Thick'));
    expect(onStrokeWidthChange).toHaveBeenCalledWith(6);
  });
});
