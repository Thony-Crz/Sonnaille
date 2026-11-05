import { describe, expect, it } from 'vitest';
import type { WelcomePreferences } from './ports';
import { markWelcomeSeen, shouldShowWelcome } from './welcome';

const preferences = (saved: string | null): WelcomePreferences & { saved: string | null } => ({
  saved,
  load() {
    return this.saved;
  },
  save(value) {
    this.saved = value;
  },
});

describe('welcome', () => {
  it('is shown on the first visit', () => {
    expect(shouldShowWelcome(preferences(null))).toBe(true);
  });

  it('is not shown again once seen', () => {
    const prefs = preferences(null);

    markWelcomeSeen(prefs);

    expect(prefs.saved).toBe('seen');
    expect(shouldShowWelcome(prefs)).toBe(false);
  });
});
