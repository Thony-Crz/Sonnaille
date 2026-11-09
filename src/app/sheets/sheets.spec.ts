import type { ObservationOnMap } from '../../application/ports';
import type { OutingReport } from '../../application/prepare-outing';
import type { ZoneSheet } from '../../application/zone-sheet';
import type { PastoralZone } from '../../domain/pastoral-zone';
import { render } from '../testing/render';
import { OfflineNoticeComponent, UnderstandComponent, WelcomeComponent } from './info.components';
import { KmObservationComponent } from './km-observation.component';
import { OutingReportComponent } from './outing-report.component';
import { SightingSheetComponent } from './sighting-sheet.component';
import { ZoneSheetComponent } from './zone-sheet.component';

afterEach(() => {
  document.body.innerHTML = '';
});

const dogAdvice = {
  id: 'dog-comes',
  situation: "Un chien de protection s'approche",
  message: 'Arrêtez-vous, ne courez pas.',
  detail: 'Il vient vous identifier.',
  source: { label: 'Pasto Kézako', url: 'https://www.pasto-kezako.fr/rencontre-chiens-de-protection/' },
  appliesTo: { statuses: ['flock-with-dogs' as const] },
};

describe('ZoneSheetComponent', () => {
  const sheet: ZoneSheet = {
    name: 'Alpage A',
    quarter: 'Quartier A',
    status: 'flock-with-dogs',
    presence: { start: '2026-06-15', end: '2026-09-30', species: ['sheep', 'goats'], guardDogs: true },
    activity: 'trail',
    advice: [dogAdvice],
    source: 'Map Patou — Réseau Pastoral AuRA',
    fetchedAt: '2026-07-15T05:00:00.000Z',
  };

  it('presents the zone, the planned flock, the activity and the advice with its source', () => {
    const { host, $ } = render(ZoneSheetComponent, { sheet });
    const text = host.textContent!;

    expect($('h2').textContent).toBe('Alpage A');
    expect($('.zone-sheet-quarter').textContent).toBe('Quartier A');
    expect(text).toContain('Troupeau avec chiens de protection');
    expect(text).toContain('Troupeau prévu du 15/06/2026 au 30/09/2026.');
    expect(text).toContain('Moutons, chèvres');
    expect(text).toContain('Chiens de protection : oui');
    expect($<HTMLInputElement>('input[name="activity"]:checked').value).toBe('trail');
    expect(text).toContain('Arrêtez-vous, ne courez pas.');
    expect($('.advice-source a').getAttribute('href')).toBe('https://www.pasto-kezako.fr/rencontre-chiens-de-protection/');
    expect(text).toContain('Zones : Map Patou — Réseau Pastoral AuRA, données du 15/07/2026.');
  });

  it('reports the activity chosen, and closes', () => {
    const { $, instance } = render(ZoneSheetComponent, { sheet });
    const activity = vi.fn();
    const closed = vi.fn();
    instance.activityChange.subscribe(activity);
    instance.closed.subscribe(closed);

    $<HTMLInputElement>('input[value="mtb"]').click();
    $<HTMLButtonElement>('button.zone-sheet-close').click();

    expect(activity).toHaveBeenCalledWith('mtb');
    expect(closed).toHaveBeenCalled();
  });

  it('says when no flock is planned that day', () => {
    const { host } = render(ZoneSheetComponent, { sheet: { ...sheet, status: 'no-flock', presence: null, advice: [] } });

    expect(host.textContent).toContain('Pas de troupeau prévu ce jour-là dans le calendrier.');
  });
});

describe('OutingReportComponent', () => {
  const zone = (id: string, name: string, guardDogs: boolean): PastoralZone => ({
    id,
    name,
    quarter: '',
    geometry: [],
    presence: { start: '2026-06-15', end: '2026-09-30', species: ['sheep'], guardDogs, weekdays: [1, 2, 3, 4, 5, 6, 7] },
  });
  const report: OutingReport = {
    name: 'Tour des Hauts-Plateaux',
    date: '2026-07-15',
    activity: 'hiking',
    lengthKm: 15.5,
    crossings: [
      { zone: zone('A', 'Alpage A', false), status: 'flock', entry: { longitude: 5.7, latitude: 45 }, entryKm: 2.3, insideKm: 1.2 },
      { zone: zone('B', 'Alpage B', true), status: 'flock-with-dogs', entry: { longitude: 5.7, latitude: 45 }, entryKm: 7.8, insideKm: 3.4 },
    ],
    mostCautious: 'flock-with-dogs',
    sightings: [
      { observation: { id: 'h', observedAt: '2026-07-10T08:00:00Z', position: { longitude: 5.7, latitude: 45 }, kind: 'hornet-nest' }, km: 2, distanceMeters: 40 },
    ],
    advice: [dogAdvice],
  };

  it('presents the outing, the zones crossed in order and the advice', () => {
    const { host, $ } = render(OutingReportComponent, { report, lengthKm: 15.5 });
    const text = host.textContent!;

    expect($('h2').textContent).toBe('Votre sortie');
    expect(text).toContain('Tour des Hauts-Plateaux — 15,5 km');
    expect($<HTMLInputElement>('.outing-date input').value).toBe('2026-07-15');
    expect(text).toContain('Votre tracé traverse 2 zones pastorales, dont 1 avec chiens de protection.');
    expect([...host.querySelectorAll('ol.crossings > li')].map((li) => li.querySelector('.zone-sheet-status')?.textContent)).toEqual(['Alpage A', 'Alpage B']);
    expect(text).toContain('Au km 2,3, sur 1,2 km');
    expect(text).toContain('Arrêtez-vous, ne courez pas.');
    expect(text).toContain("Analyse faite sur votre appareil : votre tracé n'est envoyé nulle part.");
  });

  it('shows what was reported near the track, with its picture, the right move and the sting warning', () => {
    const { $ } = render(OutingReportComponent, { report });

    const section = $('.sightings');
    expect(section.querySelector('h3')?.textContent).toBe('Signalé près du tracé');
    expect(section.querySelector<HTMLImageElement>('img.sighting-picture')?.alt).toBe('Nid de frelons');
    expect(section.textContent).toContain('Vu le 10/07/2026, au km 2, à 40 m du tracé');
    expect(section.textContent).toContain('Éloignez-vous sans bruit ni gestes brusques ; ne vous arrêtez pas près du nid.');
    expect(section.textContent).toContain('Allergique aux piqûres ? Gardez votre traitement sur vous.');
  });

  it('reports a new date, an activity, and closes', () => {
    const { $, instance } = render(OutingReportComponent, { report });
    const date = vi.fn();
    const activity = vi.fn();
    const closed = vi.fn();
    instance.dateChange.subscribe(date);
    instance.activityChange.subscribe(activity);
    instance.closed.subscribe(closed);

    const input = $<HTMLInputElement>('.outing-date input');
    input.value = '2026-11-15';
    input.dispatchEvent(new Event('change'));
    $<HTMLInputElement>('input[name="outing-activity"][value="trail"]').click();
    $<HTMLButtonElement>('button.zone-sheet-close').click();

    expect(date).toHaveBeenCalledWith('2026-11-15');
    expect(activity).toHaveBeenCalledWith('trail');
    expect(closed).toHaveBeenCalled();
  });

  it('says when the track crosses no known zone', () => {
    const { host } = render(OutingReportComponent, { report: { ...report, crossings: [], sightings: [] } });

    expect(host.textContent).toContain('Aucune zone pastorale connue sur votre tracé.');
  });
});

describe('KmObservationComponent', () => {
  it('reports a flock seen at a km of the track', () => {
    const { $, instance } = render(KmObservationComponent, { lengthKm: 12 });
    const report = vi.fn();
    instance.report.subscribe(report);
    $<HTMLInputElement>('input[name="km"]').value = '3.5';
    $<HTMLSelectElement>('select[name="species"]').value = 'cattle';
    $<HTMLInputElement>('input[name="guardDogs"]').click();

    $<HTMLButtonElement>('button[type="submit"]').click();

    expect(report).toHaveBeenCalledWith({ km: 3.5, species: 'cattle', headcount: 'dozens', guardDogs: true });
  });

  it('refuses a km outside the track, and asks the time when the GPX has none', () => {
    const { $, instance, fixture, update } = render(KmObservationComponent, { lengthKm: 12, hasTimes: false });
    const report = vi.fn();
    instance.report.subscribe(report);
    $<HTMLInputElement>('input[name="km"]').value = '20';

    $<HTMLButtonElement>('button[type="submit"]').click();
    fixture.detectChanges();
    expect($('.observation-error').textContent).toBe('Choisissez un kilomètre entre 0 et 12.');

    $<HTMLInputElement>('input[name="km"]').value = '2';
    $<HTMLInputElement>('input[name="time"]').value = '08:15';
    $<HTMLButtonElement>('button[type="submit"]').click();
    update({ result: { json: '{"type":"Feature"}', timeFromTrack: false } });

    expect(report).toHaveBeenCalledWith(expect.objectContaining({ km: 2, time: '08:15' }));
    expect($('.observation-result pre').textContent).toBe('{"type":"Feature"}');
    expect($('.observation-time-source').textContent?.trim()).toBe("Heure saisie à la main : votre GPX n'a pas d'heure.");
  });
});

describe('SightingSheetComponent', () => {
  const here = { longitude: 5.65, latitude: 45.11 };
  const hornets: ObservationOnMap = {
    observation: { id: 'n', observedAt: '2026-07-12T10:00:00.000Z', position: here, kind: 'hornet-nest' },
    recent: true,
    haloMeters: 50,
  };
  const sheep: ObservationOnMap = {
    observation: { id: 'f', observedAt: '2026-07-14T07:30:00.000Z', position: here, species: 'sheep', headcount: 'hundreds', guardDogs: true },
    recent: false,
    haloMeters: 300,
  };

  it('shows the picture, the kind, the distance to keep and the right move for a hornet nest', () => {
    const { host, $ } = render(SightingSheetComponent, { item: hornets });
    const text = host.textContent!;

    expect($('h2').textContent).toBe('Nid de frelons');
    expect($<HTMLImageElement>('img.sighting-picture').alt).toBe('Nid de frelons');
    expect(text).toContain('Signalé le 12/07/2026');
    expect(text).toContain('Zone de prudence : 50 m autour du point.');
    expect(text).toContain('Éloignez-vous sans bruit ni gestes brusques ; ne vous arrêtez pas près du nid.');
    expect(text).toContain('Allergique aux piqûres ? Gardez votre traitement sur vous.');
    expect(text).toContain('Signalement d’un utilisateur, non vérifié sur place.');
  });

  it('for an old flock with guard dogs: the dog badge, the dogs advice, and says it is old', () => {
    const { host, $ } = render(SightingSheetComponent, { item: sheep });
    const text = host.textContent!;

    expect($('h2').textContent).toBe('Moutons, des centaines, chiens de protection vus');
    expect(host.querySelector('img.sighting-dog-badge')).not.toBeNull();
    expect(text).toContain('Arrêtez-vous, laissez les chiens vous identifier, puis contournez calmement.');
    expect(text).toContain('Signalement ancien : les bêtes ont pu partir.');
    expect(text).not.toContain('piqûres');
  });
});

describe('WelcomeComponent, UnderstandComponent and OfflineNoticeComponent', () => {
  it('welcomes once: what Sonnaille does, privacy, no guarantee', () => {
    const { $, host, instance } = render(WelcomeComponent);
    const closed = vi.fn();
    instance.closed.subscribe(closed);

    $<HTMLButtonElement>('button.welcome-ok').click();

    expect($('.welcome').getAttribute('aria-modal')).toBe('true');
    expect(host.textContent).toContain('Vos tracés GPX restent sur votre appareil');
    expect(host.textContent).toContain("L'application ne garantit pas l'absence de troupeau ou de chien.");
    expect(closed).toHaveBeenCalled();
  });

  it('explains the guard dog, every advice and the sources', () => {
    const { host } = render(UnderstandComponent, { advice: [dogAdvice] });

    expect(host.querySelector('h2')?.textContent).toBe('Comprendre');
    expect(host.textContent).toContain('Le chien de protection, souvent appelé patou');
    expect(host.textContent).toContain('Arrêtez-vous, ne courez pas.');
    expect([...host.querySelectorAll('.credits a')].map((a) => a.textContent)).toEqual(['Map Patou', 'Pasto Kézako', 'OpenStreetMap']);
  });

  it('says when the device is offline', () => {
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const { $, fixture } = render(OfflineNoticeComponent);

    expect($<HTMLElement>('.offline-notice').hidden).toBe(false);
    online.mockReturnValue(true);
    window.dispatchEvent(new Event('online'));
    fixture.detectChanges();
    expect($<HTMLElement>('.offline-notice').hidden).toBe(true);
    online.mockRestore();
  });
});
