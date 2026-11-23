'use client';

import { CloudSun, Droplets, Gauge, MapPin, RefreshCw, Thermometer, Wind } from 'lucide-react';
import { useEffect } from 'react';
import { formatShortWeekday, timeAgo } from '@/lib/datetime';
import { formatTemp, formatTempWithUnit, formatWind } from '@/lib/units';
import { useWeather } from '@/hooks/useWeather';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateWeatherSettings } from '@/store/slices/settings';
import { Card, IconButton, Segmented } from '../ui/primitives';
import { CitySearch, placeLabel, useLocate } from './CitySearch';
import { WeatherIcon } from './WeatherIcon';

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-inner grid grid-cols-[auto_1fr] items-center gap-x-2.5 rounded-xl px-3 py-2">
      <span className="row-span-2 text-accent-text" aria-hidden>
        {icon}
      </span>
      <dt className="text-[0.68rem] font-medium tracking-wide text-fg-muted uppercase">{label}</dt>
      <dd className="min-w-0 truncate text-sm font-semibold text-fg tabular">{value}</dd>
    </div>
  );
}

export function WeatherCard({ compact = false }: { compact?: boolean }) {
  const dispatch = useAppDispatch();
  const { unit, windUnit, location } = useAppSelector((s) => s.settings.weather);
  const { snapshot, loading, error, errorKind, hasLocation, refresh } = useWeather();
  const { locate, locating } = useLocate();

  // Silent auto-locate only when the browser already granted permission (never prompts unprompted).
  useEffect(() => {
    if (hasLocation || typeof navigator === 'undefined' || !navigator.permissions) return;
    let cancelled = false;
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((status) => {
        if (!cancelled && status.state === 'granted') void locate();
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLocation]);

  const actions = hasLocation ? (
    <>
      <Segmented
        label="Temperature unit"
        value={unit}
        onChange={(value) => dispatch(updateWeatherSettings({ unit: value }))}
        options={[
          { value: 'c', label: '°C', ariaLabel: 'Celsius' },
          { value: 'f', label: '°F', ariaLabel: 'Fahrenheit' },
        ]}
      />
      <IconButton label="Refresh weather" size="sm" onClick={refresh} disabled={loading}>
        <RefreshCw className={loading ? 'size-4 animate-spin' : 'size-4'} aria-hidden />
      </IconButton>
    </>
  ) : undefined;

  return (
    <Card title="Weather" icon={<CloudSun className="size-4" aria-hidden />} actions={actions} className="min-h-[16rem]">
      {!hasLocation && (
        <div className="flex flex-1 flex-col justify-center gap-4">
          <div className="text-center">
            <p className="text-base font-semibold text-fg">Where are you?</p>
            <p className="mt-1 text-sm text-fg-muted">Pick a city or let your browser share your location. Nothing is stored outside this device.</p>
          </div>
          <CitySearch />
          {locating && <p className="text-center text-xs text-fg-muted">Waiting for your browser…</p>}
        </div>
      )}

      {hasLocation && !snapshot && !error && (
        <div className="flex-1 animate-pulse space-y-3" aria-busy="true" aria-label="Loading weather">
          <div className="h-16 w-2/3 rounded-xl bg-surface-2" />
          <div className="h-12 rounded-xl bg-surface-2" />
          <div className="h-24 rounded-xl bg-surface-2" />
        </div>
      )}

      {hasLocation && !snapshot && error && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center" role="alert">
          <p className="text-sm text-danger">{error}</p>
          {errorKind === 'auth' && <p className="text-xs text-fg-muted">Open Settings → API keys, or switch the provider back to Open-Meteo (no key needed).</p>}
          <button type="button" onClick={refresh} className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-accent-text hover:bg-accent-soft">
            Try again
          </button>
        </div>
      )}

      {hasLocation && snapshot && location && (
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-medium text-fg-muted">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{placeLabel(location)}</span>
              </p>
              <p className="tabular mt-1 text-6xl leading-none font-semibold tracking-tight text-fg" aria-label={`Temperature ${formatTempWithUnit(snapshot.current.tempC, unit)}`}>
                {formatTemp(snapshot.current.tempC, unit)}
                <span className="ml-1 text-2xl font-medium text-fg-muted">{unit.toUpperCase()}</span>
              </p>
              <p className="mt-1.5 text-sm font-medium text-fg">{snapshot.current.description}</p>
            </div>
            <WeatherIcon condition={snapshot.current.condition} isDay={snapshot.current.isDay} className="size-16 shrink-0 text-accent-text drop-shadow-lg sm:size-20" />
          </div>

          <dl className="grid grid-cols-2 gap-2">
            <Stat icon={<Thermometer className="size-4" />} label="Feels like" value={formatTempWithUnit(snapshot.current.feelsC, unit)} />
            <Stat icon={<Droplets className="size-4" />} label="Humidity" value={`${Math.round(snapshot.current.humidity)}%`} />
            <Stat icon={<Wind className="size-4" />} label="Wind" value={formatWind(snapshot.current.windMs, windUnit)} />
            <Stat icon={<Gauge className="size-4" />} label="Pressure" value={snapshot.current.pressure ? `${Math.round(snapshot.current.pressure)} hPa` : '--'} />
          </dl>

          {!compact && snapshot.hourly.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-[0.68rem] font-semibold tracking-wider text-fg-muted uppercase">Next hours</h3>
              <ol tabIndex={0} aria-label="Hourly temperatures" className="scroll-thin flex gap-2 overflow-x-auto pb-1">
                {snapshot.hourly.map((hour) => (
                  <li key={hour.time} className="glass-inner flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-xs">
                    <span className="text-fg-muted">{new Intl.DateTimeFormat('en-GB', { hour: '2-digit' }).format(hour.time)}</span>
                    <WeatherIcon condition={hour.condition} isDay={hour.isDay} className="size-4 text-accent-text" />
                    <span className="font-semibold text-fg tabular">{formatTemp(hour.tempC, unit)}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div>
            <h3 className="mb-1.5 text-[0.68rem] font-semibold tracking-wider text-fg-muted uppercase">{compact ? '3-day outlook' : '5-day forecast'}</h3>
            <ul className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${compact ? 3 : 5}, minmax(0, 1fr))` }}>
              {snapshot.daily.slice(1, compact ? 4 : 6).map((day) => (
                <li
                  key={day.date}
                  className="glass-inner flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-center"
                  aria-label={`${formatShortWeekday(day.date)}: ${day.description}, high ${formatTempWithUnit(day.maxC, unit)}, low ${formatTempWithUnit(day.minC, unit)}${day.pop !== null && day.pop >= 20 ? `, ${day.pop}% chance of precipitation` : ''}`}
                  title={day.description}
                >
                  <span className="text-xs font-medium text-fg-muted">{formatShortWeekday(day.date)}</span>
                  <WeatherIcon condition={day.condition} className="size-5 text-accent-text" />
                  <span className="tabular text-sm font-semibold text-fg">{formatTemp(day.maxC, unit)}</span>
                  <span className="tabular text-xs text-fg-muted">{formatTemp(day.minC, unit)}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-auto text-[0.7rem] text-fg-muted" aria-live="polite">
            {error ? `Showing saved data from ${timeAgo(snapshot.fetchedAt)} — ${error}` : `Updated ${timeAgo(snapshot.fetchedAt)}`}
            {snapshot.provider === 'open-meteo' && ' · Open-Meteo'}
            {snapshot.provider === 'openweather' && ' · OpenWeather'}
          </p>
        </div>
      )}
    </Card>
  );
}
