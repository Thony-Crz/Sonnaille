import { describe, expect, it } from 'vitest';
import { ACTIVITY_KEY, LocalStorageActivityPreferences } from './local-storage-activity-preferences';

describe('LocalStorageActivityPreferences', () => {
  it('stores the activity under its own key', () => {
    const items = new Map<string, string>();
    const preferences = new LocalStorageActivityPreferences(() => ({
      getItem: (key) => items.get(key) ?? null,
      setItem: (key, value) => void items.set(key, value),
    }));

    preferences.save('mtb');

    expect(ACTIVITY_KEY).toBe('sonnaille.activity');
    expect(items.get('sonnaille.activity')).toBe('mtb');
    expect(preferences.load()).toBe('mtb');
  });

  it('forgets the activity when storage is unavailable', () => {
    const preferences = new LocalStorageActivityPreferences(() => {
      throw new Error('SecurityError');
    });

    expect(preferences.load()).toBeNull();
    expect(() => preferences.save('trail')).not.toThrow();
  });
});
