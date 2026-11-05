import type { WelcomePreferences } from './ports';

/** The welcome message (what the app does and does not guarantee) is shown once per device. */
export function shouldShowWelcome(preferences: WelcomePreferences): boolean {
  return preferences.load() !== 'seen';
}

export function markWelcomeSeen(preferences: WelcomePreferences): void {
  preferences.save('seen');
}
