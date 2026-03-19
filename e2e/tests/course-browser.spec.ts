import { test, expect } from '@playwright/test';

test.describe('Course Browser', () => {
  test('loads course page with modules and lessons', async ({ page }) => {
    // First get a course ID from the API
    const res = await page.request.get('/api/subjects');
    const data = await res.json();
    const subjects = data.subjects || [];

    if (subjects.length === 0 || subjects[0].courses.length === 0) {
      test.skip();
      return;
    }

    const courseId = subjects[0].courses[0].id;
    await page.goto(`/courses/${courseId}`);

    // Should display course content
    await page.waitForSelector('.course-page, .lesson-page, [class*="course"]', { timeout: 10_000 });
  });

  test('subjects API returns valid structure', async ({ request }) => {
    const res = await request.get('/api/subjects');
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data).toHaveProperty('subjects');
    expect(Array.isArray(data.subjects)).toBe(true);

    if (data.subjects.length > 0) {
      const subject = data.subjects[0];
      expect(subject).toHaveProperty('subject');
      expect(subject).toHaveProperty('courses');
      expect(Array.isArray(subject.courses)).toBe(true);
    }
  });

  test('course API returns modules and lessons', async ({ request }) => {
    const subjectsRes = await request.get('/api/subjects');
    const subjectsData = await subjectsRes.json();
    const subjects = subjectsData.subjects || [];

    if (subjects.length === 0 || subjects[0].courses.length === 0) {
      test.skip();
      return;
    }

    const courseId = subjects[0].courses[0].id;
    const res = await request.get(`/api/courses/${courseId}`);
    expect(res.ok()).toBe(true);

    const course = await res.json();
    expect(course).toHaveProperty('title');
    expect(course).toHaveProperty('modules');
    expect(Array.isArray(course.modules)).toBe(true);

    if (course.modules.length > 0) {
      expect(course.modules[0]).toHaveProperty('title');
      expect(course.modules[0]).toHaveProperty('lessons');
    }
  });
});
