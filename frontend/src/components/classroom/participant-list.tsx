import { For, type Component } from 'solid-js';
import type { AgentRole } from '../../lib/types';
import AgentAvatar from './agent-avatar';

interface ParticipantListProps {
  agents: AgentRole[];
}

const ParticipantList: Component<ParticipantListProps> = (props) => {
  return (
    <>
      <div class="participant-list">
        <h3 class="participant-list-title">Participants</h3>
        <For each={props.agents}>
          {(agent) => (
            <div class="participant-item">
              <AgentAvatar name={agent.name} color={agent.color} />
              <div class="participant-info">
                <span class="participant-name">{agent.name}</span>
                <span class="participant-role">{agent.type}</span>
              </div>
            </div>
          )}
        </For>
        {props.agents.length === 0 && (
          <p class="participant-empty">No agents assigned yet.</p>
        )}
      </div>

      <style>{`
        .participant-list {
          border-top: 1px solid var(--border-color);
          padding: 0.75rem 1rem;
        }

        .participant-list-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .participant-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.35rem 0;
        }

        .participant-info {
          display: flex;
          flex-direction: column;
        }

        .participant-name {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .participant-role {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .participant-empty {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-style: italic;
        }
      `}</style>
    </>
  );
};

export default ParticipantList;
