import type { ActivityPreferences } from '../application/ports';
import type { Activity } from '../domain/advice';
import { LocalStorageValue, type KeyValueStorage } from './local-storage-value';

export const ACTIVITY_KEY = 'sonnaille.activity';

/** Remembers the user's activity (hiking, trail, mountain bike) in the browser storage. */
export class LocalStorageActivityPreferences extends LocalStorageValue<Activity> implements ActivityPreferences {
  constructor(storage: () => KeyValueStorage) {
    super(ACTIVITY_KEY, storage);
  }
}
