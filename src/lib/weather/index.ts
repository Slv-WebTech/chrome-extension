import { storageGet, storageSet } from '../storage';
import { fetchOpenMeteo, reverseGeocode, searchPlaces } from './openmeteo';
import { fetchOpenWeather, searchPlacesOpenWeather } from './openweather';
import { type GeoPlace, type WeatherSnapshot, WeatherError } from './types';

export * from './types';
export { wmoToCondition } from './openmeteo';

export type WeatherProvider = 'open-meteo' | 'openweather';

const CACHE_KEY = 'momentum.cache.weather.v1';
export const WEATHER_FRESH_MS = 10 * 60_000;

interface CacheEntry {
  key: string;
  snapshot: WeatherSnapshot;
}

export function cacheKeyFor(provider: WeatherProvider, lat: number, lon: number): string {
  return `${provider}:${lat.toFixed(2)},${lon.toFixed(2)}`;
}

export async function readWeatherCache(provider: WeatherProvider, lat: number, lon: number): Promise<WeatherSnapshot | null> {
  const entry = await storageGet<CacheEntry | null>(CACHE_KEY, null);
  if (!entry || entry.key !== cacheKeyFor(provider, lat, lon)) return null;
  return entry.snapshot;
}

export async function fetchWeather(
  provider: WeatherProvider,
  lat: number,
  lon: number,
  apiKey: string,
  signal?: AbortSignal,
): Promise<WeatherSnapshot> {
  const snapshot =
    provider === 'openweather' ? await fetchOpenWeather(lat, lon, apiKey, signal) : await fetchOpenMeteo(lat, lon, signal);
  await storageSet(CACHE_KEY, { key: cacheKeyFor(provider, lat, lon), snapshot } satisfies CacheEntry).catch(() => undefined);
  return snapshot;
}

export function searchCities(provider: WeatherProvider, query: string, apiKey: string, signal?: AbortSignal): Promise<GeoPlace[]> {
  return provider === 'openweather' ? searchPlacesOpenWeather(query, apiKey, signal) : searchPlaces(query, signal);
}

/** Ask the browser for the current position (the user is prompted by Chrome). */
export function getBrowserPosition(timeoutMs = 12_000): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new WeatherError('Geolocation is not supported in this browser.', 'unknown'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      (error) =>
        reject(
          new WeatherError(
            error.code === error.PERMISSION_DENIED
              ? 'Location access was denied. Search for a city instead.'
              : 'Could not determine your location.',
            'unknown',
          ),
        ),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 15 * 60_000 },
    );
  });
}

/** Locate the user and resolve a friendly place name. */
export async function locateUser(signal?: AbortSignal): Promise<GeoPlace> {
  const { lat, lon } = await getBrowserPosition();
  return reverseGeocode(lat, lon, signal);
}
