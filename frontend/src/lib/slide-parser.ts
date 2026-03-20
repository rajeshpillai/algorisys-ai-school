export interface Slide {
  title: string;
  body: string;
}

export function parseSlides(jsonContent: string): Slide[] | null {
  try {
    const parsed = JSON.parse(jsonContent);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (s: any) => typeof s.title === 'string' && typeof s.body === 'string'
    );
  } catch {
    return null;
  }
}
