import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ACTIVITIES, selectAdvice } from '../../src/domain/advice';
import { ZONE_STATUSES } from '../../src/domain/zone-status';
import { adviceContentErrors, parseAdviceContent } from '../../src/infrastructure/advice-content';

const content = JSON.parse(readFileSync(join(import.meta.dirname, '..', '..', 'public', 'content', 'advice.json'), 'utf8'));

describe('published advice (public/content/advice.json)', () => {
  it('is valid: short messages, sources, known statuses and activities', () => {
    expect(adviceContentErrors(content)).toEqual([]);
  });

  it.each(ZONE_STATUSES.flatMap((status) => ACTIVITIES.map((activity) => [status, activity] as const)))(
    'has advice for a %s zone, %s',
    (status, activity) => {
      expect(selectAdvice(parseAdviceContent(content), { status, activity }).length).toBeGreaterThan(0);
    },
  );

  it('never links a guard dog to a shepherd or a breeder by name', () => {
    expect(JSON.stringify(content)).not.toMatch(/\b(M\.|Mme|monsieur|madame)\b/i);
  });
});
