import type { Component } from 'solid-js';

interface AgentAvatarProps {
  name: string;
  color: string;
  size?: 'small' | 'medium';
}

const AgentAvatar: Component<AgentAvatarProps> = (props) => {
  const initials = () => {
    const parts = props.name.split(' ');
    return parts.map((p) => p[0]).join('').toUpperCase().slice(0, 2);
  };

  const sizeClass = () =>
    props.size === 'small' ? 'agent-avatar--small' : '';

  return (
    <>
      <div
        class={`agent-avatar ${sizeClass()}`}
        style={{ 'background-color': props.color }}
        title={props.name}
      >
        {initials()}
      </div>

      <style>{`
        .agent-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.8rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .agent-avatar--small {
          width: 28px;
          height: 28px;
          font-size: 0.65rem;
        }
      `}</style>
    </>
  );
};

export default AgentAvatar;
