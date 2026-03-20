import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import ChatStream from './chat-stream';
import type { AgentMessage, AgentRole } from '../../lib/types';

// Mock marked to avoid full markdown rendering in tests
vi.mock('marked', () => ({
  marked: {
    parse: (content: string) => `<p>${content}</p>`,
  },
}));

function makeMessage(overrides: Partial<AgentMessage> = {}): AgentMessage {
  return {
    id: 'msg-' + Math.random().toString(36).slice(2),
    agent_name: 'Teacher',
    agent_role: 'teaching',
    content: 'Test message',
    timestamp: Date.now(),
    ...overrides,
  };
}

const defaultAgents: AgentRole[] = [
  { name: 'Teacher', type: 'teaching', purpose: '', behavior_style: '', avatar: '', color: '#3b82f6' },
  { name: 'Quiz Master', type: 'assessment', purpose: '', behavior_style: '', avatar: '', color: '#f59e0b' },
];

describe('ChatStream', () => {
  describe('initial waiting state', () => {
    it('shows thinking indicator when no messages and no streaming', () => {
      render(() => (
        <ChatStream
          messages={[]}
          streamingAgent={null}
          streamingContent=""
          agents={[]}
        />
      ));

      expect(screen.getByText('Thinking...')).toBeInTheDocument();
    });

    it('hides thinking indicator when messages exist', () => {
      render(() => (
        <ChatStream
          messages={[makeMessage()]}
          streamingAgent={null}
          streamingContent=""
          agents={defaultAgents}
        />
      ));

      // The "Thinking..." for empty state should not show,
      // but the chat-thinking-reply also has "Thinking..." text
      const thinkingElements = screen.queryAllByText('Thinking...');
      // No empty-state thinking indicator (chat-stream-empty)
      expect(document.querySelector('.chat-stream-empty')).toBeNull();
    });
  });

  describe('message rendering', () => {
    it('renders agent messages', () => {
      const messages = [
        makeMessage({ agent_name: 'Teacher', content: 'Welcome to the lesson!' }),
        makeMessage({ agent_name: 'You', agent_role: 'learner', content: 'Hello!' }),
      ];

      render(() => (
        <ChatStream
          messages={messages}
          streamingAgent={null}
          streamingContent=""
          agents={defaultAgents}
        />
      ));

      expect(screen.getByText('Teacher')).toBeInTheDocument();
      expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('renders multiple messages in order', () => {
      const messages = [
        makeMessage({ agent_name: 'System', agent_role: 'system', content: 'Session started' }),
        makeMessage({ agent_name: 'Teacher', content: 'Let us begin' }),
        makeMessage({ agent_name: 'You', agent_role: 'learner', content: 'Ready!' }),
      ];

      render(() => (
        <ChatStream
          messages={messages}
          streamingAgent={null}
          streamingContent=""
          agents={defaultAgents}
        />
      ));

      expect(screen.getByText('System')).toBeInTheDocument();
      expect(screen.getByText('Teacher')).toBeInTheDocument();
      expect(screen.getByText('You')).toBeInTheDocument();
    });
  });

  describe('streaming message', () => {
    it('shows streaming message when agent is streaming', () => {
      render(() => (
        <ChatStream
          messages={[]}
          streamingAgent="Teacher"
          streamingContent="This is being streamed..."
          agents={defaultAgents}
        />
      ));

      // Streaming message should appear
      expect(screen.getByText('Teacher')).toBeInTheDocument();
    });

    it('does not show streaming message when content is empty', () => {
      const { container } = render(() => (
        <ChatStream
          messages={[]}
          streamingAgent="Teacher"
          streamingContent=""
          agents={defaultAgents}
        />
      ));

      // No streaming message rendered (Show condition is false when content is empty)
      const streamingBadges = container.querySelectorAll('.chat-message--streaming');
      expect(streamingBadges).toHaveLength(0);
    });
  });

  describe('processing indicator', () => {
    it('shows thinking indicator when processing and not streaming', () => {
      render(() => (
        <ChatStream
          messages={[makeMessage({ agent_name: 'You', agent_role: 'learner', content: 'Question?' })]}
          streamingAgent={null}
          streamingContent=""
          agents={defaultAgents}
          isProcessing={true}
        />
      ));

      expect(document.querySelector('.chat-thinking-reply')).not.toBeNull();
    });

    it('hides thinking indicator when streaming starts', () => {
      render(() => (
        <ChatStream
          messages={[makeMessage({ agent_name: 'You', agent_role: 'learner', content: 'Question?' })]}
          streamingAgent="Teacher"
          streamingContent="Responding..."
          agents={defaultAgents}
          isProcessing={true}
        />
      ));

      // The processing indicator should be hidden because streamingAgent is set
      expect(document.querySelector('.chat-thinking-reply')).toBeNull();
    });

    it('does not show processing indicator when isProcessing is false', () => {
      render(() => (
        <ChatStream
          messages={[makeMessage({ agent_name: 'You', agent_role: 'learner', content: 'Question?' })]}
          streamingAgent={null}
          streamingContent=""
          agents={defaultAgents}
          isProcessing={false}
        />
      ));

      expect(document.querySelector('.chat-thinking-reply')).toBeNull();
    });
  });
});
