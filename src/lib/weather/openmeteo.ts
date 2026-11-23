import { fetchJson } from './http';
import { type Condition, type GeoPlace, type WeatherSnapshot, WeatherError } from './types';

/** WMO weather interpretation codes -> our condition + label. */
export function wmoToCondition(code: number): { condition: Condition; description: string } {
  if (code === 0) return { condition: 'clear', description: 'Clear sky' };
  if (code === 1) return { condition: 'clear', description: 'Mostly clear' };
  if (code === 2) return { condition: 'partly', description: 'Partly cloudy' };
  if (code === 3) return { condition: 'cloudy', description: 'Overcast' };
  if (code === 45 || code === 48) return { condition: 'fog', description: 'Foggy' };
  if (code >= 51 && code <= 57) return { condition: 'drizzle', description: 'Drizzle' };
  if (code >= 61 && code <= 67) return { condition: 'rain', description: 'Rain' };
  if (code >= 71 && code <= 77) return { condition: 'snow', description: 'Snow' };
  if (code >= 80 && code <= 82) return { condition: 'rain', description: 'Rain showers' };
  if (code === 85 || code === 86) return { condition: 'snow', description: 'Snow showers' };
  if (code >= 95) return { condition: 'thunder', description: 'Thunderstorm' };
  return { condition: 'cloudy', description: 'Cloudy' };
}

interface OpenMeteoForecast {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    pressure_msl?: number;
    cloud_cover?: number;
    is_day: number;
  };
  hourly: { time: number[]; temperature_2m: number[]; weather_code: number[]; is_day: number[] };
  daily: {
    time: number[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max?: Array<number | null>;
  };
}

export function buildForecastUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    current:
      'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,pressure_msl,cloud_cover,is_day',
    hourly: 'temperature_2m,weather_code,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    wind_speed_unit: 'ms',
    timezone: 'auto',
    forecast_days: '6',
    timeformat: 'unixtime',
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

/**
 * Open-Meteo returns daily dates as unix seconds when `timeformat=unixtime`; with
 * `timezone=auto` these are local midnight, so formatting in UTC would shift days. We
 * therefore build the YYYY-MM-DD from the unix time using the response utc offset.
 */
interface WithOffset extends OpenMeteoForecast {
  utc_offset_seconds?: number;
}

function isoDate(unixSeconds: number, offsetSeconds: number): string {
  return new Date((unixSeconds + offsetSeconds) * 1000).toISOString().slice(0, 10);
}

export function parseOpenMeteo(raw: WithOffset, lat: number, lon: number, now = Date.now()): WeatherSnapshot {
  const offset = raw.utc_offset_seconds ?? 0;
  const cur = raw.current;
  const mapped = wmoToCondition(cur.weather_code);

  const daily = raw.daily.time.map((t, i) => {
    const day = wmoToCondition(raw.daily.weather_code[i] ?? 0);
    return {
      date: isoDate(t, offset),
      minC: raw.daily.temperature_2m_min[i] ?? 0,
      maxC: raw.daily.temperature_2m_max[i] ?? 0,
      pop: raw.daily.precipitation_probability_max?.[i] ?? null,
      condition: day.condition,
      description: day.description,
    };
  });

  const nowSeconds = now / 1000;
  const hourly = raw.hourly.time
    .map((t, i) => ({
      time: t * 1000,
      tempC: raw.hourly.temperature_2m[i] ?? 0,
      condition: wmoToCondition(raw.hourly.weather_code[i] ?? 0).condition,
      isDay: (raw.hourly.is_day[i] ?? 1) === 1,
      seconds: t,
    }))
    .filter((hour) => hour.seconds >= nowSeconds - 1800)
    .slice(0, 12)
    .map(({ seconds: _seconds, ...hour }) => hour);

  return {
    provider: 'open-meteo',
    fetchedAt: now,
    lat,
    lon,
    current: {
      tempC: cur.temperature_2m,
      feelsC: cur.apparent_temperature,
      humidity: cur.relative_humidity_2m,
      windMs: cur.wind_speed_10m,
      pressure: cur.pressure_msl ?? null,
      cloud: cur.cloud_cover ?? null,
      condition: mapped.condition,
      description: mapped.description,
      isDay: cur.is_day === 1,
    },
    daily,
    hourly,
  };
}

export async function fetchOpenMeteo(lat: number, lon: number, signal?: AbortSignal): Promise<WeatherSnapshot> {
  const raw = await fetchJson<WithOffset>(buildForecastUrl(lat, lon), { signal });
  if (!raw.current || !raw.daily) throw new WeatherError('Unexpected weather response.');
  return parseOpenMeteo(raw, lat, lon);
}

interface GeocodeResponse {
  results?: Array<{ name: string; admin1?: string; country?: string; latitude: number; longitude: number }>;
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeoPlace[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`;
  const data = await fetchJson<GeocodeResponse>(url, { signal });
  return (data.results ?? []).map((r) => ({
    name: r.name,
    region: r.admin1,
    country: r.country,
    lat: r.latitude,
    lon: r.longitude,
  }));
}

interface ReverseResponse {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
}

/** Best-effort place name for coordinates (BigDataCloud client endpoint, no key). */
export async function reverseGeocode(lat: number, lon: number, signal?: AbortSignal): Promise<GeoPlace> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const data = await fetchJson<ReverseResponse>(url, { signal, timeoutMs: 6000 });
    const name = data.city || data.locality || data.principalSubdivision || 'Your location';
    return { name, region: data.principalSubdivision, country: data.countryName, lat, lon };
  } catch {
    return { name: 'Your location', lat, lon };
  }
}
