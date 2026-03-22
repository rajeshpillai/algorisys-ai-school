import { describe, it, expect } from 'vitest';
import { getSimulationTemplate, getTemplateNames } from './simulation-templates';

describe('simulation-templates', () => {
  describe('getTemplateNames', () => {
    it('returns all available template names', () => {
      const names = getTemplateNames();
      expect(names).toContain('bubble-sort');
      expect(names).toContain('stack-queue');
      expect(names).toContain('projectile-motion');
      expect(names.length).toBe(3);
    });
  });

  describe('getSimulationTemplate', () => {
    it('returns HTML for bubble-sort template', () => {
      const html = getSimulationTemplate('bubble-sort');
      expect(html).toBeDefined();
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
    });

    it('returns HTML for stack-queue template', () => {
      const html = getSimulationTemplate('stack-queue');
      expect(html).toBeDefined();
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('returns HTML for projectile-motion template', () => {
      const html = getSimulationTemplate('projectile-motion');
      expect(html).toBeDefined();
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('returns undefined for nonexistent template', () => {
      expect(getSimulationTemplate('nonexistent')).toBeUndefined();
    });

    it('templates contain postMessage for score reporting', () => {
      const names = getTemplateNames();
      for (const name of names) {
        const html = getSimulationTemplate(name)!;
        expect(html).toContain('postMessage');
      }
    });

    it('templates use vanilla JS only (no import/require)', () => {
      const names = getTemplateNames();
      for (const name of names) {
        const html = getSimulationTemplate(name)!;
        expect(html).not.toMatch(/\bimport\s+/);
        expect(html).not.toMatch(/\brequire\s*\(/);
      }
    });
  });
});
