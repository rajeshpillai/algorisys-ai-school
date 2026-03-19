export interface QuizQuestion {
  id: string;
  question: string;
  type: 'single' | 'multiple' | 'short_answer';
  options?: string[];
  points: number;
}

export interface QuizData {
  questions: QuizQuestion[];
  topic: string;
  total_points: number;
}

export interface QuizAnswer {
  question_id: string;
  answer: string | number | number[];
}

export interface QuizResult {
  question_id: string;
  correct: boolean;
  score: number;
  max_points: number;
  feedback: string;
}

export interface QuizGradeResult {
  total_score: number;
  total_points: number;
  percent: number;
  results: QuizResult[];
}

export function parseQuizFromMessage(content: string): QuizData | null {
  // Try to extract JSON quiz block from agent message
  const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.questions && Array.isArray(parsed.questions)) {
        return {
          questions: parsed.questions.map((q: any, i: number) => ({
            id: q.id || `q-${i}`,
            question: q.question,
            type: q.type || 'single',
            options: q.options,
            points: q.points || 1,
          })),
          topic: parsed.topic || 'Quiz',
          total_points: parsed.total_points || parsed.questions.length,
        };
      }
    } catch {
      // Not valid quiz JSON
    }
  }
  return null;
}
