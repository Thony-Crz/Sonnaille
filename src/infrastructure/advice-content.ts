import type { AdviceRepository } from '../application/ports';
import { ACTIVITIES, wordCount, type Activity, type Advice } from '../domain/advice';
import { ZONE_STATUSES, type ZoneStatus } from '../domain/zone-status';

const MAX_MESSAGE_WORDS = 15;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

/**
 * Checks public/content/advice.json: `{ "advice": [...] }`, each with a situation,
 * a message of 15 words at most, a detail, a cited source and where it applies.
 */
export function adviceContentErrors(data: unknown): string[] {
  if (!isObject(data) || !Array.isArray(data.advice)) return ['not an advice list'];

  const errors: string[] = [];
  const ids = new Set<string>();
  data.advice.forEach((item, index) => {
    const at = `advice[${index}]`;
    if (!isObject(item)) {
      errors.push(`${at}: not an object`);
      return;
    }

    if (!isText(item.id)) errors.push(`${at}.id: missing`);
    else if (ids.has(item.id)) errors.push(`${at}.id: duplicated`);
    else ids.add(item.id);

    for (const field of ['situation', 'message', 'detail'] as const) {
      if (!isText(item[field])) errors.push(`${at}.${field}: missing`);
    }
    if (isText(item.message)) {
      const words = wordCount(item.message);
      if (words > MAX_MESSAGE_WORDS) errors.push(`${at}.message: ${words} words, ${MAX_MESSAGE_WORDS} at most`);
    }

    const { source } = item;
    if (!isObject(source) || !isText(source.label) || typeof source.url !== 'string' || !source.url.startsWith('https://')) {
      errors.push(`${at}.source: needs a label and an https URL`);
    }

    const appliesTo = isObject(item.appliesTo) ? item.appliesTo : {};
    const statuses = appliesTo.statuses;
    if (!Array.isArray(statuses) || statuses.length === 0 || !statuses.every((s) => ZONE_STATUSES.includes(s as ZoneStatus))) {
      errors.push(`${at}.appliesTo.statuses: at least one known status`);
    }
    const activities = appliesTo.activities;
    if (activities !== undefined && (!Array.isArray(activities) || !activities.every((a) => ACTIVITIES.includes(a as Activity)))) {
      errors.push(`${at}.appliesTo.activities: unknown activity`);
    }
  });
  return errors;
}

export function parseAdviceContent(data: unknown): Advice[] {
  const errors = adviceContentErrors(data);
  if (errors.length > 0) throw new Error(`Invalid advice content: ${errors.join('; ')}`);
  return (data as { advice: Advice[] }).advice;
}

/** Reads the advice published with the site (public/content/advice.json). */
export class HttpAdviceRepository implements AdviceRepository {
  constructor(
    private readonly url: string,
    private readonly fetchFn: (url: string) => Promise<Response>,
  ) {}

  async load(): Promise<Advice[]> {
    const response = await this.fetchFn(this.url);
    if (!response.ok) throw new Error(`Advice not available (${response.status})`);
    return parseAdviceContent(await response.json());
  }
}
