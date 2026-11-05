export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

/**
 * One value remembered in the browser storage, under a key.
 * Storage can be unavailable (private browsing, blocked site data): the app then
 * simply forgets the value instead of failing.
 */
export class LocalStorageValue<T extends string> {
  constructor(
    private readonly key: string,
    private readonly storage: () => KeyValueStorage,
  ) {}

  load(): string | null {
    try {
      return this.storage().getItem(this.key);
    } catch {
      return null;
    }
  }

  save(value: T): void {
    try {
      this.storage().setItem(this.key, value);
    } catch {
      // Not remembered this time; nothing else to do.
    }
  }
}
