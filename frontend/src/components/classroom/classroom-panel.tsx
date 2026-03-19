import type { Component } from 'solid-js';
import type { AgentMessage, AgentRole } from '../../lib/types';
import ChatStream from './chat-stream';
import ParticipantList from './participant-list';
import UserInput from './user-input';

interface ClassroomPanelProps {
  messages: AgentMessage[];
  agents: AgentRole[];
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

const ClassroomPanel: Component<ClassroomPanelProps> = (props) => {
  return (
    <>
      <div class="classroom-panel">
        <div class="classroom-main">
          <ChatStream messages={props.messages} />
          <UserInput onSend={props.onSendMessage} disabled={props.disabled} />
        </div>
        <div class="classroom-sidebar">
          <ParticipantList agents={props.agents} />
        </div>
      </div>

      <style>{`
        .classroom-panel {
          display: flex;
          height: calc(100vh - var(--topbar-height));
          background: var(--bg-primary);
        }

        .classroom-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .classroom-sidebar {
          width: 220px;
          border-left: 1px solid var(--border-color);
          background: var(--bg-secondary);
          overflow-y: auto;
        }
      `}</style>
    </>
  );
};

export default ClassroomPanel;
