export interface Subject {
  id: string;
  title: string;
  description: string;
  icon: string;
  courses: CourseSummary[];
}

export interface CourseSummary {
  id: string;
  title: string;
  description: string;
  lesson_count: number;
}

export interface Course {
  id: string;
  subject: string;
  title: string;
  description: string;
  language?: string;
  modules: Module[];
}

export interface Module {
  id: string;
  title: string;
  sequence: number;
  lessons: LessonSummary[];
}

export interface LessonSummary {
  id: string;
  title: string;
  sequence: number;
  difficulty: string;
  estimated_minutes: number;
}

export interface Lesson {
  id: string;
  module: string;
  sequence: number;
  title: string;
  activity_types: string[];
  difficulty: string;
  estimated_minutes: number;
  slide_content: string;
  discussion_prompt: string;
  quiz_content: string;
  playground_code?: string;
  playground_solution?: string;
}

export interface AgentRole {
  name: string;
  type: string;
  purpose: string;
  behavior_style: string;
  avatar: string;
  color: string;
}

export interface AgentMessage {
  id: string;
  agent_name: string;
  agent_role: string;
  content: string;
  timestamp: number;
}

export interface ClassroomSession {
  id: string;
  goal: string;
  agents: AgentRole[];
  messages: AgentMessage[];
  state: 'idle' | 'teaching' | 'discussion' | 'quiz' | 'playground' | 'summary';
}

export interface CurriculumProgress {
  total_lessons: number;
  completed_lessons: number;
  current_topic: string | null;
  current_module_index: number;
  current_lesson_index: number;
}

export interface AdvancePrompt {
  next_topic: string;
  completed_lessons: number;
  total_lessons: number;
}

export interface SessionSummary {
  id: string;
  goal: string;
  state: string;
  current_topic: string | null;
  agent_count: number;
  message_count: number;
  created_at: string;
  last_activity: string;
}

export interface LearnerProfile {
  background: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  known_concepts: string[];
  learning_preferences: string[];
}
