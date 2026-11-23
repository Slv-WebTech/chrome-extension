export type Condition = 'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunder';

export interface GeoPlace {
  name: string;
  region?: string;
  country?: string;
  lat: number;
  lon: number;
}

export interface WeatherCurrent {
  tempC: number;
  feelsC: number;
  humidity: number;
  /** metres per second */
  windMs: number;
  pressure: number | null;
  cloud: number | null;
  condition: Condition;
  description: string;
  isDay: boolean;
}

export interface WeatherDay {
  /** local calendar date, YYYY-MM-DD */
  date: string;
  minC: number;
  maxC: number;
  /** precipitation probability 0..100 when the provider supplies it */
  pop: number | null;
  condition: Condition;
  description: string;
}

export interface WeatherHour {
  /** epoch ms */
  time: number;
  tempC: number;
  condition: Condition;
  isDay: boolean;
}

export interface WeatherSnapshot {
  provider: 'open-meteo' | 'openweather';
  fetchedAt: number;
  lat: number;
  lon: number;
  current: WeatherCurrent;
  daily: WeatherDay[];
  hourly: WeatherHour[];
}

export class WeatherError extends Error {
  constructor(
    message: string,
    readonly kind: 'network' | 'auth' | 'not-found' | 'unknown' = 'unknown',
  ) {
    super(message);
    this.name = 'WeatherError';
  }
}
