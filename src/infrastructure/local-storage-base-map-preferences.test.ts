import { describe, expect, it } from 'vitest';
import { BASE_MAP_KEY, LocalStorageBaseMapPreferences, type KeyValueStorage } from './local-storage-base-map-preferences';

class InMemoryStorage implements KeyValueStorage {
  items = new Map<string, string>();
  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
}

const failing: KeyValueStorage = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
};

describe('LocalStorageBaseMapPreferences', () => {
  it('stores the choice under a namespaced key', () => {
    expect(BASE_MAP_KEY).toBe('sonnaille.baseMap');
  });

  it('saves then loads the choice', () => {
    const storage = new InMemoryStorage();
    const preferences = new LocalStorageBaseMapPreferences(() => storage);

    preferences.save('ign-aerial');

    expect(storage.items.get(BASE_MAP_KEY)).toBe('ign-aerial');
    expect(preferences.load()).toBe('ign-aerial');
  });

  it('loads null when nothing is saved', () => {
    expect(new LocalStorageBaseMapPreferences(() => new InMemoryStorage()).load()).toBeNull();
  });

  it('loads null when the storage cannot be reached', () => {
    const preferences = new LocalStorageBaseMapPreferences(() => {
      throw new Error('SecurityError');
    });

    expect(preferences.load()).toBeNull();
  });

  it('loads null when reading fails', () => {
    expect(new LocalStorageBaseMapPreferences(() => failing).load()).toBeNull();
  });

  it('ignores a failing save', () => {
    expect(() => new LocalStorageBaseMapPreferences(() => failing).save('osm')).not.toThrow();
  });
});
