import { createContext, useContext, createSignal, ParentComponent } from 'solid-js';
import type { ClassroomSession, AgentMessage } from '../lib/types';

interface ClassroomContextValue {
  session: () => ClassroomSession | null;
  setSession: (s: ClassroomSession | null) => void;
  messages: () => AgentMessage[];
  addMessage: (msg: AgentMessage) => void;
}

const ClassroomContext = createContext<ClassroomContextValue>();

export const ClassroomProvider: ParentComponent = (props) => {
  const [session, setSession] = createSignal<ClassroomSession | null>(null);
  const [messages, setMessages] = createSignal<AgentMessage[]>([]);

  const addMessage = (msg: AgentMessage) => {
    setMessages((prev) => [...prev, msg]);
  };

  return (
    <ClassroomContext.Provider value={{ session, setSession, messages, addMessage }}>
      {props.children}
    </ClassroomContext.Provider>
  );
};

export const useClassroom = () => {
  const ctx = useContext(ClassroomContext);
  if (!ctx) throw new Error('useClassroom must be used within ClassroomProvider');
  return ctx;
};
