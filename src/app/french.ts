// French formatting of what the front shows.

/** YYYY-MM-DD → DD/MM/YYYY. */
export const frenchDay = (day: string) => day.split('-').reverse().join('/');

/** 12.4 → "12,4". */
export const frenchNumber = (value: number) => value.toLocaleString('fr-FR');
