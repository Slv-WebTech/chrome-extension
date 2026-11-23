export type TempUnit = 'c' | 'f';
export type WindUnit = 'kmh' | 'mph' | 'ms';

export function cToF(c: number): number {
  return (c * 9) / 5 + 32;
}

export function convertTemp(celsius: number, unit: TempUnit): number {
  return Math.round(unit === 'f' ? cToF(celsius) : celsius);
}

export function formatTemp(celsius: number | null | undefined, unit: TempUnit): string {
  if (celsius == null || !Number.isFinite(celsius)) return '--';
  return `${convertTemp(celsius, unit)}°`;
}

export function formatTempWithUnit(celsius: number | null | undefined, unit: TempUnit): string {
  if (celsius == null || !Number.isFinite(celsius)) return '--';
  return `${convertTemp(celsius, unit)}°${unit.toUpperCase()}`;
}

/** Wind speeds are stored in m/s. */
export function formatWind(ms: number | null | undefined, unit: WindUnit): string {
  if (ms == null || !Number.isFinite(ms)) return '--';
  if (unit === 'mph') return `${Math.round(ms * 2.236936)} mph`;
  if (unit === 'kmh') return `${Math.round(ms * 3.6)} km/h`;
  return `${Math.round(ms * 10) / 10} m/s`;
}
