import { describe, expect, it } from 'vitest';
import { ACTIVITIES, selectAdvice, wordCount, type Advice } from './advice';

const advice = (id: string, appliesTo: Advice['appliesTo']): Advice => ({
  id,
  situation: `Situation ${id}`,
  message: `Message ${id}`,
  detail: `Détail ${id}`,
  source: { label: 'Source', url: 'https://example.org' },
  appliesTo,
});

const all = [
  advice('flock-all', { statuses: ['flock', 'flock-with-dogs'] }),
  advice('dogs-only', { statuses: ['flock-with-dogs'] }),
  advice('mtb-only', { statuses: ['flock', 'flock-with-dogs'], activities: ['mtb'] }),
  advice('no-flock', { statuses: ['no-flock'] }),
];

describe('activities', () => {
  it('are hiking, trail running and mountain biking', () => {
    expect(ACTIVITIES).toEqual(['hiking', 'trail', 'mtb']);
  });
});

describe('selectAdvice', () => {
  it('keeps the advice for the zone status, in the content order', () => {
    expect(selectAdvice(all, { status: 'flock-with-dogs', activity: 'hiking' }).map((a) => a.id)).toEqual(['flock-all', 'dogs-only']);
  });

  it('adds the advice specific to the activity', () => {
    expect(selectAdvice(all, { status: 'flock', activity: 'mtb' }).map((a) => a.id)).toEqual(['flock-all', 'mtb-only']);
  });

  it('gives the zone advice when no flock is planned', () => {
    expect(selectAdvice(all, { status: 'no-flock', activity: 'trail' }).map((a) => a.id)).toEqual(['no-flock']);
  });
});

describe('wordCount', () => {
  it('counts words, ignoring punctuation and apostrophes', () => {
    expect(wordCount("Arrêtez-vous, ne courez pas : parlez calmement au chien.")).toBe(8);
    expect(wordCount("Annoncez-vous à voix haute, c'est tout.")).toBe(6);
  });
});
