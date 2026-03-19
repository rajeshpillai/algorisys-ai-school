import { Router, Route } from '@solidjs/router';
import { ThemeProvider } from './context/theme-context';
import Landing from './pages/landing';
import CourseBrowser from './pages/course-browser';
import LessonPage from './pages/lesson-page';
import ClassroomPage from './pages/classroom-page';
import NotFound from './pages/not-found';

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Route path="/" component={Landing} />
        <Route path="/courses/:courseId" component={CourseBrowser} />
        <Route path="/courses/:courseId/:moduleId/:lessonId" component={LessonPage} />
        <Route path="/classroom/:sessionId" component={ClassroomPage} />
        <Route path="*" component={NotFound} />
      </Router>
    </ThemeProvider>
  );
}
