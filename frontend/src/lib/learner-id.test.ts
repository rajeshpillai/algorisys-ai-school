import { describe, it, expect, beforeEach } from 'vitest';
import { getLearnerId } from './learner-id';

describe('getLearnerId', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates a UUID on first call', () => {
    const id = getLearnerId();
    expect(id).toBeTruthy();
    expect(id.length).toBeGreaterThan(10);
  });

  it('returns the same ID on subsequent calls', () => {
    const id1 = getLearnerId();
    const id2 = getLearnerId();
    expect(id1).toBe(id2);
  });

  it('persists to localStorage', () => {
    const id = getLearnerId();
    expect(localStorage.getItem('learner_id')).toBe(id);
  });

  it('reads existing ID from localStorage', () => {
    localStorage.setItem('learner_id', 'custom-id-123');
    expect(getLearnerId()).toBe('custom-id-123');
  });
});
