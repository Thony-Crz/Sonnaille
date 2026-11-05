import type { BaseMapPreferences } from '../application/ports';
import type { BaseMapId } from '../domain/base-map';
import { LocalStorageValue, type KeyValueStorage } from './local-storage-value';

export type { KeyValueStorage } from './local-storage-value';

export const BASE_MAP_KEY = 'sonnaille.baseMap';

/** Remembers the base map choice in the browser storage. */
export class LocalStorageBaseMapPreferences extends LocalStorageValue<BaseMapId> implements BaseMapPreferences {
  constructor(storage: () => KeyValueStorage) {
    super(BASE_MAP_KEY, storage);
  }
}
