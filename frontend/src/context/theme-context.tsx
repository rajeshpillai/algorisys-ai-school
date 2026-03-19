import { createContext, useContext, createSignal, ParentComponent } from 'solid-js';

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{
  theme: () => Theme;
  toggle: () => void;
}>();

export const ThemeProvider: ParentComponent = (props) => {
  const stored = localStorage.getItem('theme') as Theme | null;
  const [theme, setTheme] = createSignal<Theme>(stored || 'light');

  const toggle = () => {
    const next = theme() === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  // Initialize
  document.documentElement.classList.toggle('dark', theme() === 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {props.children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
