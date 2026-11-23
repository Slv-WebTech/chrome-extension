'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { WEATHER_FRESH_MS, WeatherError, type WeatherSnapshot, fetchWeather, readWeatherCache } from '@/lib/weather';
import { useAppSelector } from '@/store/hooks';

export interface WeatherState {
  snapshot: WeatherSnapshot | null;
  loading: boolean;
  error: string | null;
  errorKind: WeatherError['kind'] | null;
}

const REFRESH_MS = 15 * 60_000;

/** Loads weather for the saved location, serving cached data instantly and refreshing in the background. */
export function useWeather() {
  const location = useAppSelector((s) => s.settings.weather.location);
  const provider = useAppSelector((s) => s.settings.weather.provider);
  const apiKey = useAppSelector((s) => s.secrets.openWeatherKey);
  const [state, setState] = useState<WeatherState>({ snapshot: null, loading: false, error: null, errorKind: null });
  const controller = useRef<AbortController | null>(null);

  const lat = location?.lat;
  const lon = location?.lon;

  const load = useCallback(
    async (force = false) => {
      if (lat === undefined || lon === undefined) {
        setState({ snapshot: null, loading: false, error: null, errorKind: null });
        return;
      }
      controller.current?.abort();
      const ctrl = new AbortController();
      controller.current = ctrl;

      const cached = await readWeatherCache(provider, lat, lon);
      if (ctrl.signal.aborted) return;
      if (cached) {
        setState({ snapshot: cached, loading: false, error: null, errorKind: null });
        if (!force && Date.now() - cached.fetchedAt < WEATHER_FRESH_MS) return;
      }
      setState((prev) => ({ ...prev, loading: true, error: null, errorKind: null }));
      try {
        const snapshot = await fetchWeather(provider, lat, lon, apiKey, ctrl.signal);
        if (!ctrl.signal.aborted) setState({ snapshot, loading: false, error: null, errorKind: null });
      } catch (error) {
        if (ctrl.signal.aborted) return;
        const known = error instanceof WeatherError;
        setState((prev) => ({
          snapshot: prev.snapshot,
          loading: false,
          error: known ? error.message : 'Weather is unavailable right now.',
          errorKind: known ? error.kind : 'unknown',
        }));
      }
    },
    [lat, lon, provider, apiKey],
  );

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), REFRESH_MS);
    return () => {
      clearInterval(id);
      controller.current?.abort();
    };
  }, [load]);

  return { ...state, hasLocation: location !== null, refresh: () => load(true) };
}
