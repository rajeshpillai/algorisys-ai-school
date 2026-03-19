import { createSignal, type Component } from 'solid-js';

interface HeroSectionProps {
  onStart: (goal: string) => void;
}

const HeroSection: Component<HeroSectionProps> = (props) => {
  const [goal, setGoal] = createSignal('');

  const handleStart = () => {
    const text = goal().trim();
    if (!text) return;
    props.onStart(text);
  };

  return (
    <section class="hero-section">
      <h1 class="hero-title">Algorisys Open AI School</h1>
      <p class="hero-subtitle">
        Learn any subject with a team of AI agents who teach, quiz, and
        guide you through interactive lessons.
      </p>

      <div class="goal-input-group">
        <input
          type="text"
          class="goal-input"
          placeholder="e.g. Teach me calculus in 6 hours"
          value={goal()}
          onInput={(e) => setGoal(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleStart()}
        />
        <button class="start-button" onClick={handleStart}>
          Start Learning
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
