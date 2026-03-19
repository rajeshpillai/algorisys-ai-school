import { createContext, useContext, createSignal, createEffect, onCleanup, ParentComponent } from 'solid-js';
import { joinClassroom, sendMessage, leaveClassroom } from '../lib/channel-client';
import type { AgentMessage, AgentRole } from '../lib/types';
import type { Channel } from 'phoenix';

interface ClassroomContextValue {
  sessionId: () => string | null;
  messages: () => AgentMessage[];
  agents: () => AgentRole[];
  streamingAgent: () => string | null;
  streamingContent: () => string;
  isConnected: () => boolean;
  connect: (sessionId: string) => void;
  send: (content: string) => void;
  disconnect: () => void;
}

const ClassroomContext = createContext<ClassroomContextValue>();

export const ClassroomProvider: ParentComponent = (props) => {
  const [sessionId, setSessionId] = createSignal<string | null>(null);
  const [messages, setMessages] = createSignal<AgentMessage[]>([]);
  const [agents, setAgents] = createSignal<AgentRole[]>([]);
  const [streamingAgent, setStreamingAgent] = createSignal<string | null>(null);
  const [streamingContent, setStreamingContent] = createSignal('');
  const [isConnected, setIsConnected] = createSignal(false);

  let channel: Channel | null = null;
  let streamingRole = '';
  let chunkCounter = 0;

  const connect = (id: string) => {
    if (channel) {
      leaveClassroom(channel);
    }

    setSessionId(id);
    setMessages([]);
    setAgents([]);
    setStreamingAgent(null);
    setStreamingContent('');

    channel = joinClassroom(id, {
      onAgentMessage: (msg: any) => {
        const agentMsg: AgentMessage = {
          id: msg.id || crypto.randomUUID(),
          agent_name: msg.agent_name || msg.agent || 'Agent',
          agent_role: msg.agent_role || msg.role || '',
          content: msg.content || '',
          timestamp: msg.timestamp || Date.now(),
        };
        setMessages((prev) => [...prev, agentMsg]);

        if (msg.agents) {
          setAgents(msg.agents);
        }
      },

      onAgentChunk: (chunk: any) => {
        const agentName = chunk.agent_name || chunk.agent || 'Agent';
        if (streamingAgent() !== agentName) {
          setStreamingAgent(agentName);
          streamingRole = chunk.agent_role || chunk.role || '';
          setStreamingContent(chunk.content || chunk.chunk || '');
        } else {
          setStreamingContent((prev) => prev + (chunk.content || chunk.chunk || ''));
        }
      },

      onAgentDone: (data: any) => {
        const content = streamingContent();
        const agentName = streamingAgent();
        if (agentName && content) {
          const agentMsg: AgentMessage = {
            id: data.id || crypto.randomUUID(),
            agent_name: agentName,
            agent_role: data.agent_role || data.role || streamingRole,
            content,
            timestamp: data.timestamp || Date.now(),
          };
          setMessages((prev) => [...prev, agentMsg]);
        }
        setStreamingAgent(null);
        setStreamingContent('');
        streamingRole = '';
      },
    });

    setIsConnected(true);
  };

  const send = (content: string) => {
    if (!channel) return;

    const userMsg: AgentMessage = {
      id: crypto.randomUUID(),
      agent_name: 'You',
      agent_role: 'learner',
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    sendMessage(channel, content);
  };

  const disconnect = () => {
    if (channel) {
      leaveClassroom(channel);
      channel = null;
    }
    setIsConnected(false);
    setSessionId(null);
  };

  onCleanup(() => {
    if (channel) {
      leaveClassroom(channel);
      channel = null;
    }
  });

  return (
    <ClassroomContext.Provider
      value={{
        sessionId,
        messages,
        agents,
        streamingAgent,
        streamingContent,
        isConnected,
        connect,
        send,
        disconnect,
      }}
    >
      {props.children}
    </ClassroomContext.Provider>
  );
};

export const useClassroom = () => {
  const ctx = useContext(ClassroomContext);
  if (!ctx) throw new Error('useClassroom must be used within ClassroomProvider');
  return ctx;
};
