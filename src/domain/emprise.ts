/** Rectangle géographique en degrés WGS84. */
export interface Emprise {
  ouest: number;
  sud: number;
  est: number;
  nord: number;
}

export interface Position {
  longitude: number;
  latitude: number;
}

export function empriseEnglobante(emprises: Emprise[]): Emprise {
  if (emprises.length === 0) throw new Error('Aucune emprise à englober');

  return {
    ouest: Math.min(...emprises.map((e) => e.ouest)),
    sud: Math.min(...emprises.map((e) => e.sud)),
    est: Math.max(...emprises.map((e) => e.est)),
    nord: Math.max(...emprises.map((e) => e.nord)),
  };
}

export function contient(emprise: Emprise, { longitude, latitude }: Position): boolean {
  return (
    longitude >= emprise.ouest &&
    longitude <= emprise.est &&
    latitude >= emprise.sud &&
    latitude <= emprise.nord
  );
}
