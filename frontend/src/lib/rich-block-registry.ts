import { lazy, type Component } from 'solid-js';

/**
 * Rich block registry — single source of truth for all rich content block types.
 *
 * To add a new block type (e.g. "mermaid"):
 * 1. Create the component (e.g. mermaid-viewer.tsx)
 * 2. Add an entry here with blockType, loadingMessage, and lazy component
 * 3. Done — parser and ChatMessage pick it up automatically
 */

export interface RichBlockDefinition {
  blockType: string;
  loadingMessage: string;
  component: Component<{ content: string }>;
}

const registry: RichBlockDefinition[] = [
  {
    blockType: 'whiteboard',
    loadingMessage: 'Generating diagram...',
    component: lazy(() => import('../components/classroom/whiteboard-canvas-adapter')),
  },
  {
    blockType: 'simulation',
    loadingMessage: 'Building interactive simulation...',
    component: lazy(() => import('../components/classroom/simulation-frame-adapter')),
  },
  {
    blockType: 'slides',
    loadingMessage: 'Preparing presentation...',
    component: lazy(() => import('../components/classroom/slide-viewer')),
  },
];

/** Get all registered block type names */
export function getBlockTypes(): string[] {
  return registry.map((r) => r.blockType);
}

/** Get the regex alternation string for all block types (e.g. "whiteboard|simulation|slides") */
export function getBlockTypePattern(): string {
  return registry.map((r) => r.blockType).join('|');
}

/** Look up a block definition by type name */
export function getBlockDefinition(blockType: string): RichBlockDefinition | undefined {
  return registry.find((r) => r.blockType === blockType);
}

/** Get loading message for a block type */
export function getLoadingMessage(blockType: string): string {
  return getBlockDefinition(blockType)?.loadingMessage ?? 'Loading...';
}

/** Get all registered block definitions */
export function getAllBlockDefinitions(): readonly RichBlockDefinition[] {
  return registry;
}
