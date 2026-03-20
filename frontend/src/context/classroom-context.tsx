import { createContext, useContext, createSignal, createEffect, onCleanup, ParentComponent } from 'solid-js';
import { joinClassroom, sendMessage, sendAction, submitQuiz, leaveClassroom } from '../lib/channel-client';
import type { AgentMessage, AgentRole, CurriculumProgress, AdvancePrompt } from '../lib/types';
import type { QuizData, QuizAnswer, QuizGradeResult } from '../lib/quiz-types';
import { parseQuizFromMessage } from '../lib/quiz-types';
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
  isPaused: () => boolean;
  activeQuiz: () => QuizData | null;
  quizResult: () => QuizGradeResult | null;
  initError: () => string | null;
  isProcessing: () => boolean;
  connect: (sessionId: string) => void;
  send: (content: string) => void;
  confirmAdvance: () => void;
  dismissAdvance: () => void;
  togglePause: () => void;
  submitQuizAnswers: (answers: QuizAnswer[]) => void;
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
  const [isPaused, setIsPaused] = createSignal(false);
  const [activeQuiz, setActiveQuiz] = createSignal<QuizData | null>(null);
  const [quizResult, setQuizResult] = createSignal<QuizGradeResult | null>(null);
  const [initError, setInitError] = createSignal<string | null>(null);
  const [isProcessing, setIsProcessing] = createSignal(false);

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
    setInitError(null);

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
        setIsProcessing(false);

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

          // Check if the message contains a quiz
          const quiz = parseQuizFromMessage(content);
          if (quiz) {
            setActiveQuiz(quiz);
            setQuizResult(null);
          }
        }
        setStreamingAgent(null);
        setStreamingContent('');
        setIsProcessing(false);
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

      onQuizResult: (data: any) => {
        setQuizResult(data as QuizGradeResult);
      },

      onAdvancePrompt: (data: any) => {
        setAdvancePrompt({
          next_topic: data.next_topic || 'Next topic',
          completed_lessons: data.completed_lessons || 0,
          total_lessons: data.total_lessons || 0,
          timeout_seconds: data.timeout_seconds || 30,
        });
      },

      onInitError: (data: any) => {
        setIsProcessing(false);
        setInitError(data.reason || 'Session initialization failed.');
      },
    });

    setIsConnected(true);
  };

  const send = (content: string) => {
    if (!channel) return;

    // Dismiss advance prompt if user sends a question instead
    setAdvancePrompt(null);
    // Clear pause state — user is actively engaging
    setIsPaused(false);

    const userMsg: AgentMessage = {
      id: crypto.randomUUID(),
      agent_name: 'You',
      agent_role: 'learner',
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    setIsProcessing(true);
    sendMessage(channel, content);
  };

  const confirmAdvance = () => {
    if (!channel) return;
    setAdvancePrompt(null);
    setIsProcessing(true);
    sendAction(channel, 'continue');
  };

  const dismissAdvance = () => {
    setAdvancePrompt(null);
    // Tell backend to cancel the auto-advance timeout
    if (channel) {
      sendAction(channel, 'pause');
    }
  };

  const submitQuizAnswers = (answers: QuizAnswer[]) => {
    if (!channel || !activeQuiz()) return;
    const questions = activeQuiz()!.questions.map((q) => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options,
      answer: q.type === 'single' ? (q as any).correctAnswer : undefined,
      points: q.points,
    }));
    submitQuiz(channel, questions, answers);
  };

  const togglePause = () => {
    const wasPaused = isPaused();
    setIsPaused(!wasPaused);

    // If resuming and there's a pending advance prompt, auto-continue
    if (wasPaused && advancePrompt() && channel) {
      setAdvancePrompt(null);
      setIsProcessing(true);
      sendAction(channel, 'continue');
    }
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
        isPaused,
        activeQuiz,
        quizResult,
        initError,
        isProcessing,
        connect,
        send,
        confirmAdvance,
        dismissAdvance,
        togglePause,
        submitQuizAnswers,
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
