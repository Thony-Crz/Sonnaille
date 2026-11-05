import type { ZoneStatus } from './zone-status';

export type Activity = 'hiking' | 'trail' | 'mtb';

export const ACTIVITIES: Activity[] = ['hiking', 'trail', 'mtb'];

/** A piece of advice about flocks and guard dogs. Texts are shown to users, hence in French. */
export interface Advice {
  id: string;
  situation: string;
  /** 15 words at most. */
  message: string;
  detail: string;
  source: { label: string; url: string };
  appliesTo: { statuses: ZoneStatus[]; activities?: Activity[] };
}

/** The advice that applies to a zone status and an activity, in the content order. */
export function selectAdvice(advice: Advice[], { status, activity }: { status: ZoneStatus; activity: Activity }): Advice[] {
  return advice.filter(
    ({ appliesTo }) =>
      appliesTo.statuses.includes(status) && (!appliesTo.activities || appliesTo.activities.includes(activity)),
  );
}

/** Words in a text: "Arrêtez-vous" and "c'est" count as one, lone punctuation does not count. */
export function wordCount(text: string): number {
  return text.split(/\s+/).filter((token) => /\p{L}/u.test(token)).length;
}
