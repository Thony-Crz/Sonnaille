import type { ZoneStatus } from '../domain/zone-status';

/** How each zone status is drawn and named on the map (labels are shown to users, hence in French). */
export const ZONE_STYLES: Record<ZoneStatus, { label: string; color: string; fillOpacity: number }> = {
  'flock-with-dogs': { label: 'Troupeau avec chiens de protection', color: '#c4512b', fillOpacity: 0.38 },
  flock: { label: 'Troupeau prévu', color: '#e0a43a', fillOpacity: 0.32 },
  'no-flock': { label: 'Zone pastorale, pas de troupeau prévu', color: '#5f7a45', fillOpacity: 0.1 },
};
