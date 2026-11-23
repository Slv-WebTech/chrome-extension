'use client';

import { LocateFixed, MapPin, Search } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { toast } from 'sonner';
import { type GeoPlace, searchCities, locateUser } from '@/lib/weather';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateWeatherSettings } from '@/store/slices/settings';
import { Button, TextInput } from '../ui/primitives';

export function placeLabel(place: Pick<GeoPlace, 'name' | 'region' | 'country'>): string {
  return [place.name, place.region && place.region !== place.name ? place.region : null, place.country].filter(Boolean).join(', ');
}

/** Hook: detect the user's position with the browser and save it as the weather location. */
export function useLocate() {
  const dispatch = useAppDispatch();
  const [locating, setLocating] = useState(false);
  const locate = async () => {
    setLocating(true);
    try {
      const place = await locateUser();
      dispatch(updateWeatherSettings({ location: { ...place, source: 'geo' } }));
      toast.success(`Weather location set to ${place.name}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not determine your location.');
    } finally {
      setLocating(false);
    }
  };
  return { locate, locating };
}

export function CitySearch({ autoFocus = false }: { autoFocus?: boolean }) {
  const dispatch = useAppDispatch();
  const provider = useAppSelector((s) => s.settings.weather.provider);
  const apiKey = useAppSelector((s) => s.secrets.openWeatherKey);
  const { locate, locating } = useLocate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoPlace[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'empty' | 'error'>('idle');
  const listId = useId();
  const active = query.trim().length >= 2;
  const seq = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const ctrl = new AbortController();
    const mine = ++seq.current;
    const timer = setTimeout(async () => {
      setStatus('loading');
      try {
        const found = await searchCities(provider, q, apiKey, ctrl.signal);
        if (mine !== seq.current) return;
        setResults(found);
        setStatus(found.length ? 'idle' : 'empty');
      } catch {
        if (mine === seq.current && !ctrl.signal.aborted) setStatus('error');
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query, provider, apiKey]);

  const pick = (place: GeoPlace) => {
    dispatch(updateWeatherSettings({ location: { ...place, source: 'manual' } }));
    setQuery('');
    setResults([]);
    toast.success(`Weather location set to ${place.name}.`);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted" aria-hidden />
          <TextInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for a city…"
            aria-label="Search for a city"
            aria-controls={listId}
            autoComplete="off"
            autoFocus={autoFocus}
            className="pl-9"
          />
        </div>
        <Button onClick={() => void locate()} disabled={locating} aria-label="Use my current location" title="Use my current location">
          <LocateFixed className="size-4" aria-hidden />
          <span className="hidden sm:inline">{locating ? 'Locating…' : 'Locate me'}</span>
        </Button>
      </div>
      <div id={listId} aria-live="polite">
                {active && status === 'loading' && <p className="px-1 text-xs text-fg-muted">Searching…</p>}
        {active && status === 'empty' && <p className="px-1 text-xs text-fg-muted">No places found for “{query.trim()}”.</p>}
        {active && status === 'error' && <p className="px-1 text-xs text-danger">Search failed. Check your connection and try again.</p>}
        {active && results.length > 0 && (
          <ul className="glass-inner overflow-hidden rounded-xl">
            {results.map((place) => (
              <li key={`${place.lat},${place.lon}`}>
                <button
                  type="button"
                  onClick={() => pick(place)}
                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-fg hover:bg-accent-soft"
                >
                  <MapPin className="size-3.5 shrink-0 text-accent-text" aria-hidden />
                  <span className="truncate">{placeLabel(place)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
