import { readSettings, zonesUrl } from './settings';

describe('readSettings', () => {
  it('reads the demo mode and the day from the address, the API from the build', () => {
    expect(readSettings('?demo&date=2026-07-15', '/Sonnaille/', { apiUrl: 'https://api.sonnaille.fr/', scan25Key: '' })).toEqual({
      base: '/Sonnaille/',
      demo: true,
      date: '2026-07-15',
      apiUrl: 'https://api.sonnaille.fr',
      scan25Key: undefined,
    });
  });
});

describe('zonesUrl: where the pastoral zones come from', () => {
  const settings = { base: '/Sonnaille/', demo: false, date: null };

  it('from the API, which keeps them in its database (D6)', () => {
    expect(zonesUrl({ ...settings, apiUrl: 'https://api.sonnaille.fr' })).toBe('https://api.sonnaille.fr/api/zones');
  });

  it('from the fictional zones in demo mode, even with an API', () => {
    expect(zonesUrl({ ...settings, demo: true, apiUrl: 'https://api.sonnaille.fr' })).toBe('/Sonnaille/demo/pastoral-zones.geojson');
  });

  it('from the file made by `npm run data` without an API (development)', () => {
    expect(zonesUrl(settings)).toBe('/Sonnaille/data/pastoral-zones.geojson');
  });
});
