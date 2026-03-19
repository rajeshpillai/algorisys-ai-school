export const API_BASE = '/api';
export const ROUTES = {
  LANDING: '/',
  COURSE: '/courses/:courseId',
  LESSON: '/courses/:courseId/:moduleId/:lessonId',
  CLASSROOM: '/classroom/:sessionId',
} as const;
