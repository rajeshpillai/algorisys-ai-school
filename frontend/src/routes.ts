export const ROUTES = {
  LANDING: '/',
  COURSES: '/courses/:courseId',
  LESSON: '/courses/:courseId/:moduleId/:lessonId',
  CLASSROOM: '/classroom/:sessionId',
} as const;
