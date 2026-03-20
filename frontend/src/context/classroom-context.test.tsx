import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup } from '@solidjs/testing-library';
import { createRoot } from 'solid-js';
import { ClassroomProvider, useClassroom } from './classroom-context';

// Mock channel-client
let mockCallbacks: Record<string, Function> = {};
const mockChannel = {
  push: vi.fn(),
  leave: vi.fn(),
  on: vi.fn(),
};

vi.mock('../lib/channel-client', () => ({
  joinClassroom: vi.fn((sessionId: string, callbacks: any) => {
    mockCallbacks = callbacks;
    return mockChannel;
  }),
  sendMessage: vi.fn(),
  sendAction: vi.fn(),
  submitQuiz: vi.fn(),
  leaveClassroom: vi.fn(),
}));

import { joinClassroom, sendMessage, sendAction, leaveClassroom } from '../lib/channel-client';

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockCallbacks = {};
});

function renderWithContext(testFn: (ctx: ReturnType<typeof useClassroom>) => void) {
  let ctx!: ReturnType<typeof useClassroom>;
  render(() => (
    <ClassroomProvider>
      {(() => {
        ctx = useClassroom();
        testFn(ctx);
        return <div />;
      })()}
    </ClassroomProvider>
  ));
  return ctx;
}

describe('ClassroomProvider', () => {
  describe('initial state', () => {
    it('starts with null/empty defaults', () => {
      renderWithContext((ctx) => {
        expect(ctx.sessionId()).toBeNull();
        expect(ctx.messages()).toEqual([]);
        expect(ctx.agents()).toEqual([]);
        expect(ctx.streamingAgent()).toBeNull();
        expect(ctx.streamingContent()).toBe('');
        expect(ctx.isConnected()).toBe(false);
        expect(ctx.progress()).toBeNull();
        expect(ctx.advancePrompt()).toBeNull();
        expect(ctx.isPaused()).toBe(false);
        expect(ctx.activeQuiz()).toBeNull();
        expect(ctx.quizResult()).toBeNull();
        expect(ctx.initError()).toBeNull();
        expect(ctx.isProcessing()).toBe(false);
      });
    });
  });

  describe('connect', () => {
    it('joins the classroom channel and sets sessionId', () => {
      const ctx = renderWithContext(() => {});
      ctx.connect('session-123');

      expect(joinClassroom).toHaveBeenCalledWith('session-123', expect.any(Object));
      expect(ctx.sessionId()).toBe('session-123');
      expect(ctx.isConnected()).toBe(true);
    });

    it('resets state on connect', () => {
      const ctx = renderWithContext(() => {});
      ctx.connect('session-456');

      expect(ctx.messages()).toEqual([]);
      expect(ctx.agents()).toEqual([]);
      expect(ctx.streamingAgent()).toBeNull();
      expect(ctx.progress()).toBeNull();
      expect(ctx.advancePrompt()).toBeNull();
      expect(ctx.initError()).toBeNull();
    });
  });

  describe('onAgentMessage callback', () => {
    it('adds agent messages to the list', () => {
      const ctx = renderWithContext(() => {});
      ctx.connect('s1');

      mockCallbacks.onAgentMessage({
        id: 'msg-1',
        agent_name: 'Math Teacher',
        agent_role: 'teaching',
        content: 'Welcome to calculus!',
        timestamp: 1000,
      });

      expect(ctx.messages()).toHaveLength(1);
      expect(ctx.messages()[0].agent_name).toBe('Math Teacher');
      expect(ctx.messages()[0].content).toBe('Welcome to calculus!');
    });

    it('updates agents when included in message', () => {
      const ctx = renderWithContext(() => {});
      ctx.connect('s1');

      mockCallbacks.onAgentMessage({
        id: 'msg-1',
        agent_name: 'System',
        agent_role: 'system',
        content: 'Team assembled',
        agents: [{ name: 'Prof', type: 'teaching' }],
      });

      expect(ctx.agents()).toHaveLength(1);
      expect(ctx.agents()[0].name).toBe('Prof');
    });
  });

  describe('onAgentChunk callback', () => {
    it('sets streaming agent and content', () => {
      const ctx = renderWithContext(() => {});
      ctx.connect('s1');

      mockCallbacks.onAgentChunk({
        agent_name: 'Teacher',
        agent_role: 'teaching',
        content: 'Hello',
      });

      expect(ctx.streamingAgent()).toBe('Teacher');
      expect(ctx.streamingContent()).toBe('Hello');
    });

    it('appends content for same agent', () => {
      const ctx = renderWithContext(() => {});
      ctx.connect('s1');

      mockCallbacks.onAgentChunk({ agent_name: 'Teacher', content: 'Hello ' });
      mockCallbacks.onAgentChunk({ agent_name: 'Teacher', content: 'world' });

      expect(ctx.streamingContent()).toBe('Hello world');
    });

    it('clears isProcessing', () => {
      const ctx = renderWithContext(() => {});
      ctx.connect('s1');

      // Simulate send to set isProcessing
      ctx.send('question');
      expect(ctx.isProcessing()).toBe(true);

      mockCallbacks.onAgentChunk({ agent_name: 'Teacher', content: 'response' });
      expect(ctx.isProcessing()).toBe(false);
    });

    it('dismisses advance prompt when chunks arrive', () => {
      const ctx = renderWithContext(() => {});
      ctx.connect('s1');

      // Simulate advance prompt
      mockCallbacks.onAdvancePrompt({
        next_topic: 'Derivatives',
        completed_lessons: 1,
        total_lessons: 5,
        timeout_seconds: 30,
      });
      expect(ctx.advancePrompt()).not.toBeNull();

      mockCallbacks.onAgentChunk({ agent_name: 'Teacher', content: 'Next topic...' });
      expect(ctx.advancePrompt()).toBeNull();
    });
  });

  describe('onAgentDone callback', () => {
    it('flushes streaming content into messages', () => {
      const ctx = renderWithContext(() => {});
      ctx.connect('s1');

      mockCallbacks.onAgentChunk({ agent_name: 'Teacher', agent_role: 'teaching', content: 'Full lesson content' });
      mockCallbacks.onAgentDone({ agent_role: 'teaching' });

      expect(ctx.streamingAgent()).toBeNull();
      expect(ctx.streamingContent()).toBe('');
      expect(ctx.messages()).toHaveLength(1);
      expect(ctx.messages()[0].content).toBe('Full lesson content');
      expect(ctx.isProcessing()).toBe(false);
    });
  });

  describe('onCurriculumProgress callback', () => {
    it('updates progress state', () => {
      const ctx = renderWithContext(() => {});
      ctx.connect('s1');

      mockCallbacks.onCurriculumProgress({
        total_lessons: 10,
        completed_lessons: 3,
        current_topic: 'Limits',
        current_module_index: 1,
        current_lesson_index: 2,
      });

      expect(ctx.progress()).toEqual({
        total_lessons: 10,
        completed_lessons: 3,
        current_topic: 'Limits',
        current_module_index: 1,
        current_lesson_index: 2,
      });
    });
  });

  describe('onAdvancePrompt callback', () => {
    it('sets advance prompt state', () => {
      const ctx = renderWithContext(() => {});
      ctx.connect('s1');

      mockCallbacks.onAdvancePrompt({
        next_topic: 'Integrals',
        completed_lessons: 2,
        total_lessons: 8,
        timeout_seconds: 30,
      });

      expect(ctx.advancePrompt()).toEqual({
        next_topic: 'Integrals',
        completed_lessons: 2,
        total_lessons: 8,
        timeout_seconds: 30,
      });
    });
  });

  describe('onInitError callback', () => {
    it('sets initError and clears isProcessing', () => {
      const ctx = renderWithContext(() => {});
      ctx.connect('s1');

      mockCallbacks.onInitError({ reason: 'API key expired' });

      expect(ctx.initError()).toBe('API key expired');
      expect(ctx.isProcessing()).toBe(false);
    });

    it('uses default message when reason is missing', () => {
      const ctx = renderWithContext(() => {});
      ctx.connect('s1');

      mockCallbacks.onInitError({});

      expect(ctx.initError()).toBe('Session initialization failed.');
    });
  });

  describe('send', () => {
    it('adds user message and sends via channel', () => {
      const ctx = renderWithContext(() => {});
      ctx.connect('s1');

      ctx.send('What is a derivative?');

      expect(ctx.messages()).toHaveLength(1);
      expect(ctx.messages()[0].agent_name).toBe('You');
      expect(ctx.messages()[0].agent_role).toBe('learner');
      expect(ctx.messages()[0].content).toBe('What is a derivative?');
      expect(sendMessage).toHaveBeenCalled();
    });

    it('sets isProcessing to true', () => {
      const ctx = renderWithContext(() => {});
      ctx.connect('s1');

      ctx.send('question');

      expect(ctx.isProcessing()).toBe(true);
    });

    it('clears advancePrompt and isPaused', () => {
      const ctx = renderWithContext(() => {});
      ctx.connect('s1');

      // Set up paused state with advance prompt
      mockCallbacks.onAdvancePrompt({
        next_topic: 'Next',
        completed_lessons: 1,
        total_lessons: 5,
        timeout_seconds: 30,
      });

      ctx.send('I have a question');

      expect(ctx.advancePrompt()).toBeNull();
      expect(ctx.isPaused()).toBe(false);
    });

    it('does nothing without a channel', () => {
      const ctx = renderWithContext(() => {});
      // Don't connect

      ctx.send('hello');

      expect(ctx.messages()).toEqual([]);
      expect(sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('confirmAdvance', () => {
    it('clears advance prompt, sets processing, and sends continue action', () => {
      const ctx = renderWithContext(() => {});
      ctx.connect('s1');

      mockCallbacks.onAdvancePrompt({
        next_topic: 'Next',
        completed_lessons: 1,
        total_lessons: 5,
        timeout_seconds: 30,
      });

      ctx.confirmAdvance();

      expect(ctx.advancePrompt()).toBeNull();
      expect(ctx.isProcessing()).toBe(true);
      expect(sendAction).toHaveBeenCalledWith(mockChannel, 'continue');
    });
  });

  describe('dismissAdvance', () => {
    it('clears advance prompt and sends pause action', () => {
      const ctx = renderWithContext(() => {});
      ctx.connect('s1');

      mockCallbacks.onAdvancePrompt({
        next_topic: 'Next',
        completed_lessons: 1,
        total_lessons: 5,
        timeout_seconds: 30,
      });

      ctx.dismissAdvance();

      expect(ctx.advancePrompt()).toBeNull();
      expect(sendAction).toHaveBeenCalledWith(mockChannel, 'pause');
    });
  });

  describe('togglePause', () => {
    it('toggles isPaused state', () => {
      const ctx = renderWithContext(() => {});
      ctx.connect('s1');

      expect(ctx.isPaused()).toBe(false);
      ctx.togglePause();
      expect(ctx.isPaused()).toBe(true);
      ctx.togglePause();
      expect(ctx.isPaused()).toBe(false);
    });

    it('auto-continues when resuming with pending advance prompt', () => {
      const ctx = renderWithContext(() => {});
      ctx.connect('s1');

      // Pause
      ctx.togglePause();
      expect(ctx.isPaused()).toBe(true);

      // Set advance prompt while paused
      mockCallbacks.onAdvancePrompt({
        next_topic: 'Next',
        completed_lessons: 1,
        total_lessons: 5,
        timeout_seconds: 30,
      });

      // Resume — should auto-continue
      ctx.togglePause();
      expect(ctx.isPaused()).toBe(false);
      expect(ctx.advancePrompt()).toBeNull();
      expect(ctx.isProcessing()).toBe(true);
      expect(sendAction).toHaveBeenCalledWith(mockChannel, 'continue');
    });
  });

  describe('disconnect', () => {
    it('leaves channel and resets connection state', () => {
      const ctx = renderWithContext(() => {});
      ctx.connect('s1');

      ctx.disconnect();

      expect(leaveClassroom).toHaveBeenCalled();
      expect(ctx.isConnected()).toBe(false);
      expect(ctx.sessionId()).toBeNull();
    });
  });
});
