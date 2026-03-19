import { createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import TopBar from '../components/layout/top-bar';

const sampleSubjects = [
  {
    id: 'programming',
    title: 'Programming',
    description: 'Learn to code with Python, JavaScript, Rust, and more.',
    icon: '{ }',
    color: '#3b82f6',
  },
  {
    id: 'mathematics',
    title: 'Mathematics',
    description: 'From algebra to calculus, master mathematical concepts.',
    icon: '\u03C0',
    color: '#8b5cf6',
  },
  {
    id: 'history',
    title: 'History',
    description: 'Explore world history through engaging discussions.',
    icon: '\u231B',
    color: '#f59e0b',
  },
  {
    id: 'science',
    title: 'Science',
    description: 'Physics, chemistry, biology and the natural world.',
    icon: '\u269B',
    color: '#22c55e',
  },
];

export default function Landing() {
  const [goal, setGoal] = createSignal('');
  const navigate = useNavigate();

  const handleStart = () => {
    const text = goal().trim();
    if (!text) return;
    // TODO: call api.startClassroom and navigate to classroom
    console.log('Starting with goal:', text);
  };

  return (
    <div class="landing-page">
      <TopBar />

      <section class="hero-section">
        <h1 class="hero-title">AI School</h1>
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

      <section class="subjects-section">
        <h2 class="subjects-heading">Explore Subjects</h2>
        <div class="subjects-grid">
          {sampleSubjects.map((subject) => (
            <div class="subject-card">
              <div
                class="subject-icon"
                style={{ 'background-color': subject.color + '20', color: subject.color }}
              >
                {subject.icon}
              </div>
              <h3 class="subject-card-title">{subject.title}</h3>
              <p class="subject-card-desc">{subject.description}</p>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .landing-page {
          min-height: 100vh;
          background: var(--bg-primary);
        }

        .hero-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 1.5rem 3rem;
          text-align: center;
          max-width: 720px;
          margin: 0 auto;
        }

        .hero-title {
          font-size: 3rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          font-size: 1.2rem;
          color: var(--text-secondary);
          line-height: 1.7;
          margin-bottom: 2.5rem;
          max-width: 560px;
        }

        .goal-input-group {
          display: flex;
          gap: 0.75rem;
          width: 100%;
          max-width: 560px;
        }

        .goal-input {
          flex: 1;
          padding: 0.85rem 1rem;
          border: 2px solid var(--border-color);
          border-radius: 10px;
          font-size: 1rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s;
        }

        .goal-input:focus {
          border-color: var(--accent-color);
        }

        .goal-input::placeholder {
          color: var(--text-muted);
        }

        .start-button {
          padding: 0.85rem 1.75rem;
          background: var(--accent-color);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
          white-space: nowrap;
        }

        .start-button:hover {
          background: var(--accent-hover);
        }

        .subjects-section {
          max-width: 960px;
          margin: 0 auto;
          padding: 1rem 1.5rem 4rem;
        }

        .subjects-heading {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .subjects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.25rem;
        }

        .subject-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1.5rem;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .subject-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .subject-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .subject-card-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .subject-card-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
