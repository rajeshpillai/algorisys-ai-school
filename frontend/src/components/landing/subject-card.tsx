import type { Component } from 'solid-js';

interface SubjectCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  onClick?: () => void;
}

const SubjectCard: Component<SubjectCardProps> = (props) => {
  return (
    <div class="subject-card" onClick={props.onClick}>
      <div
        class="subject-icon"
        style={{ 'background-color': props.color + '20', color: props.color }}
      >
        {props.icon}
      </div>
      <h3 class="subject-card-title">{props.title}</h3>
      <p class="subject-card-desc">{props.description}</p>
    </div>
  );
};

export default SubjectCard;
