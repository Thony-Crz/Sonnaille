import { describe, expect, it, vi } from 'vitest';
import { HttpAdviceRepository, adviceContentErrors, parseAdviceContent } from './advice-content';

const valid = () => ({
  advice: [
    {
      id: 'announce',
      situation: "Approche d'un troupeau",
      message: 'Annoncez-vous à voix haute et contournez largement le troupeau.',
      detail: 'Le chien ne doit pas être surpris.',
      source: { label: 'Pasto Kézako', url: 'https://www.pasto-kezako.fr/rencontre-chiens-de-protection/' },
      appliesTo: { statuses: ['flock', 'flock-with-dogs'] },
    },
    {
      id: 'mtb',
      situation: 'À VTT',
      message: 'Descendez du vélo et poussez-le à pied.',
      detail: 'Le plus tôt possible.',
      source: { label: 'Pasto Kézako', url: 'https://www.pasto-kezako.fr/rencontre-chiens-de-protection/' },
      appliesTo: { statuses: ['flock'], activities: ['mtb'] },
    },
  ],
});

describe('advice content', () => {
  it('accepts valid content', () => {
    expect(adviceContentErrors(valid())).toEqual([]);
    expect(parseAdviceContent(valid())).toEqual(valid().advice);
  });

  it.each([
    ['not an object', () => [], 'not an advice list'],
    ['duplicated id', (d: any) => ((d.advice[1].id = 'announce'), d), 'advice[1].id: duplicated'],
    ['missing situation', (d: any) => (delete d.advice[0].situation, d), 'advice[0].situation: missing'],
    [
      'message over 15 words',
      (d: any) => ((d.advice[0].message = 'un deux trois quatre cinq six sept huit neuf dix onze douze treize quatorze quinze seize'), d),
      'advice[0].message: 16 words, 15 at most',
    ],
    ['missing detail', (d: any) => (delete d.advice[0].detail, d), 'advice[0].detail: missing'],
    ['source without https URL', (d: any) => ((d.advice[0].source.url = 'pasto-kezako.fr'), d), 'advice[0].source: needs a label and an https URL'],
    ['no status', (d: any) => ((d.advice[0].appliesTo.statuses = []), d), 'advice[0].appliesTo.statuses: at least one known status'],
    ['unknown status', (d: any) => ((d.advice[0].appliesTo.statuses = ['wolf']), d), 'advice[0].appliesTo.statuses: at least one known status'],
    ['unknown activity', (d: any) => ((d.advice[1].appliesTo.activities = ['ski']), d), 'advice[1].appliesTo.activities: unknown activity'],
  ])('rejects %s', (_case, corrupt, error) => {
    expect(adviceContentErrors(corrupt(valid()))).toContain(error);
  });

  it('refuses to read invalid content', () => {
    expect(() => parseAdviceContent([])).toThrow('Invalid advice content: not an advice list');
  });
});

describe('HttpAdviceRepository', () => {
  it('reads the published advice', async () => {
    const fetchFn = vi.fn(async () => new Response(JSON.stringify(valid())));

    const advice = await new HttpAdviceRepository('/Sonnaille/content/advice.json', fetchFn).load();

    expect(fetchFn).toHaveBeenCalledWith('/Sonnaille/content/advice.json');
    expect(advice.map((a) => a.id)).toEqual(['announce', 'mtb']);
  });

  it('fails when the file is missing', async () => {
    const repository = new HttpAdviceRepository('/content/advice.json', vi.fn(async () => new Response('', { status: 404 })));

    await expect(repository.load()).rejects.toThrow('Advice not available (404)');
  });
});
