import { describe, it, expect } from 'vitest';
import mlDict from '../../src/i18n/ml.json';
import enDict from '../../src/i18n/en.json';

describe('i18n & Localization Unit Tests', () => {
  it('should have parity between Malayalam and English dictionary keys', () => {
    const mlKeys = Object.keys(mlDict).sort();
    const enKeys = Object.keys(enDict).sort();

    expect(mlKeys).toEqual(enKeys);
  });

  it('should not contain empty translation values', () => {
    Object.entries(mlDict).forEach(([key, value]) => {
      expect(value, `Missing ML translation for key: ${key}`).toBeTruthy();
      expect(typeof value).toBe('string');
      expect((value as string).trim().length).toBeGreaterThan(0);
    });

    Object.entries(enDict).forEach(([key, value]) => {
      expect(value, `Missing EN translation for key: ${key}`).toBeTruthy();
      expect(typeof value).toBe('string');
      expect((value as string).trim().length).toBeGreaterThan(0);
    });
  });

  it('should have correct conference branding in both languages', () => {
    expect(mlDict.app_name).toBe('ബാലസംഘം');
    expect(mlDict.app_subtitle).toBe('സംസ്ഥാന സമ്മേളനം');
    expect(mlDict.event_title).toBe('ബാലസംഘം സംസ്ഥാന സമ്മേളനം');
    expect(mlDict.event_subtitle).toContain('8-ാമത്');
    expect(mlDict.event_subtitle).toContain('നീലേശ്വരം');

    expect(enDict.app_name).toBe('Balasangham');
    expect(enDict.app_subtitle).toBe('State Conference');
    expect(enDict.event_subtitle).toContain('8th');
    expect(enDict.event_subtitle).toContain('Nileshwaram');
  });

  it('should contain all required action and status keys', () => {
    const essentialKeys = [
      'search_placeholder',
      'search_button',
      'checked_in',
      'pending',
      'stay_info',
      'call_host',
      'route_map',
      'admin_workbench',
      'import_csv',
    ];

    essentialKeys.forEach((key) => {
      expect(mlDict).toHaveProperty(key);
      expect(enDict).toHaveProperty(key);
    });
  });
});
