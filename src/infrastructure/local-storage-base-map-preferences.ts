import type { BaseMapPreferences } from '../application/ports';
import type { BaseMapId } from '../domain/base-map';

export const BASE_MAP_KEY = 'sonnaille.baseMap';

export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

/**
 * Remembers the base map choice in the browser storage.
 * Storage can be unavailable (private browsing, blocked site data): the app then
 * simply forgets the choice instead of failing.
 */
export class LocalStorageBaseMapPreferences implements BaseMapPreferences {
  constructor(private readonly storage: () => KeyValueStorage) {}

  load(): string | null {
    try {
      return this.storage().getItem(BASE_MAP_KEY);
    } catch {
      return null;
    }
  }

  save(id: BaseMapId): void {
    try {
      this.storage().setItem(BASE_MAP_KEY, id);
    } catch {
      // Not remembered this time; nothing else to do.
    }
  }
}
