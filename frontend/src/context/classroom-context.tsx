import { createContext, useContext, createSignal, createEffect, onCleanup, ParentComponent } from 'solid-js';
import { joinClassroom, sendMessage, sendAction, leaveClassroom } from '../lib/channel-client';
import type { AgentMessage, AgentRole, CurriculumProgress, AdvancePrompt } from '../lib/types';
import type { Channel } from 'phoenix';

interface ClassroomContextValue {
  sessionId: () => string | null;
  messages: () => AgentMessage[];
  agents: () => AgentRole[];
  streamingAgent: () => string | null;
  streamingContent: () => string;
  isConnected: () => boolean;
  progress: () => CurriculumProgress | null;
  advancePrompt: () => AdvancePrompt | null;
  connect: (sessionId: string) => void;
  send: (content: string) => void;
  confirmAdvance: () => void;
  dismissAdvance: () => void;
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
  const [progress, setProgress] = createSignal<CurriculumProgress | null>(null);
  const [advancePrompt, setAdvancePrompt] = createSignal<AdvancePrompt | null>(null);

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
    setProgress(null);
    setAdvancePrompt(null);

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
        // Dismiss advance prompt when teaching resumes
        if (advancePrompt()) setAdvancePrompt(null);

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

      onCurriculumProgress: (data: any) => {
        setProgress({
          total_lessons: data.total_lessons || 0,
          completed_lessons: data.completed_lessons || 0,
          current_topic: data.current_topic || null,
          current_module_index: data.current_module_index || 0,
          current_lesson_index: data.current_lesson_index || 0,
        });
      },

      onAdvancePrompt: (data: any) => {
        setAdvancePrompt({
          next_topic: data.next_topic || 'Next topic',
          completed_lessons: data.completed_lessons || 0,
          total_lessons: data.total_lessons || 0,
          timeout_seconds: data.timeout_seconds || 30,
        });
      },
    });

    setIsConnected(true);
  };

  const send = (content: string) => {
    if (!channel) return;

    // Dismiss advance prompt if user sends a question instead
    setAdvancePrompt(null);

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

  const confirmAdvance = () => {
    if (!channel) return;
    setAdvancePrompt(null);
    sendAction(channel, 'continue');
  };

  const dismissAdvance = () => {
    setAdvancePrompt(null);
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
        progress,
        advancePrompt,
        connect,
        send,
        confirmAdvance,
        dismissAdvance,
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
