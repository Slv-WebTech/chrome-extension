import { fetchJson } from './http';
import { type Condition, type GeoPlace, type WeatherDay, type WeatherSnapshot, WeatherError } from './types';

const BASE = 'https://api.openweathermap.org';

/** OpenWeather condition id -> our condition. https://openweathermap.org/weather-conditions */
export function owmToCondition(id: number): Condition {
  if (id >= 200 && id < 300) return 'thunder';
  if (id >= 300 && id < 400) return 'drizzle';
  if (id >= 500 && id < 600) return 'rain';
  if (id >= 600 && id < 700) return 'snow';
  if (id >= 700 && id < 800) return 'fog';
  if (id === 800) return 'clear';
  if (id === 801 || id === 802) return 'partly';
  return 'cloudy';
}

interface OwmCurrent {
  dt: number;
  sys: { sunrise: number; sunset: number };
  weather: Array<{ id: number; description: string }>;
  main: { temp: number; feels_like: number; humidity: number; pressure: number };
  wind: { speed: number };
  clouds?: { all: number };
}

interface OwmForecast {
  city: { timezone: number };
  list: Array<{
    dt: number;
    main: { temp: number; temp_min: number; temp_max: number };
    weather: Array<{ id: number; description: string }>;
    pop?: number;
  }>;
}

const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function aggregateDaily(forecast: OwmForecast): WeatherDay[] {
  const byDay = new Map<string, OwmForecast['list']>();
  for (const entry of forecast.list) {
    const key = new Date((entry.dt + forecast.city.timezone) * 1000).toISOString().slice(0, 10);
    byDay.set(key, [...(byDay.get(key) ?? []), entry]);
  }
  return [...byDay.entries()].slice(0, 6).map(([date, entries]) => {
    // Prefer the midday slot as the representative condition.
    const rep = entries[Math.floor(entries.length / 2)] ?? entries[0]!;
    const w = rep.weather[0];
    return {
      date,
      minC: Math.min(...entries.map((e) => e.main.temp_min)),
      maxC: Math.max(...entries.map((e) => e.main.temp_max)),
      pop: Math.round(Math.max(...entries.map((e) => e.pop ?? 0)) * 100),
      condition: owmToCondition(w?.id ?? 800),
      description: cap(w?.description ?? ''),
    };
  });
}

export async function fetchOpenWeather(lat: number, lon: number, apiKey: string, signal?: AbortSignal): Promise<WeatherSnapshot> {
  if (!apiKey.trim()) throw new WeatherError('Add your OpenWeather API key in Settings.', 'auth');
  const common = `lat=${lat}&lon=${lon}&units=metric&appid=${encodeURIComponent(apiKey.trim())}`;
  const [current, forecast] = await Promise.all([
    fetchJson<OwmCurrent>(`${BASE}/data/2.5/weather?${common}`, { signal }),
    fetchJson<OwmForecast>(`${BASE}/data/2.5/forecast?${common}`, { signal }),
  ]);
  const w = current.weather[0];
  const isDay = current.dt >= current.sys.sunrise && current.dt < current.sys.sunset;
  return {
    provider: 'openweather',
    fetchedAt: Date.now(),
    lat,
    lon,
    current: {
      tempC: current.main.temp,
      feelsC: current.main.feels_like,
      humidity: current.main.humidity,
      windMs: current.wind.speed,
      pressure: current.main.pressure,
      cloud: current.clouds?.all ?? null,
      condition: owmToCondition(w?.id ?? 800),
      description: cap(w?.description ?? ''),
      isDay,
    },
    daily: aggregateDaily(forecast),
    hourly: forecast.list.slice(0, 8).map((entry) => ({
      time: entry.dt * 1000,
      tempC: entry.main.temp,
      condition: owmToCondition(entry.weather[0]?.id ?? 800),
      isDay: true,
    })),
  };
}

interface OwmGeo {
  name: string;
  state?: string;
  country?: string;
  lat: number;
  lon: number;
}

export async function searchPlacesOpenWeather(query: string, apiKey: string, signal?: AbortSignal): Promise<GeoPlace[]> {
  const q = query.trim();
  if (q.length < 2 || !apiKey.trim()) return [];
  const data = await fetchJson<OwmGeo[]>(
    `${BASE}/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=6&appid=${encodeURIComponent(apiKey.trim())}`,
    { signal },
  );
  return data.map((r) => ({ name: r.name, region: r.state, country: r.country, lat: r.lat, lon: r.lon }));
}
