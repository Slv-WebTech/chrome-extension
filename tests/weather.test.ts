import { describe, expect, it } from 'vitest';
import { aggregateDaily, owmToCondition } from '@/lib/weather/openweather';
import { buildForecastUrl, parseOpenMeteo, wmoToCondition } from '@/lib/weather/openmeteo';
import { cacheKeyFor } from '@/lib/weather';
import { convertTemp, formatTemp, formatWind } from '@/lib/units';

describe('units', () => {
  it('converts and formats temperatures and wind', () => {
    expect(convertTemp(0, 'f')).toBe(32);
    expect(convertTemp(100, 'f')).toBe(212);
    expect(formatTemp(21.6, 'c')).toBe('22°');
    expect(formatTemp(null, 'c')).toBe('--');
    expect(formatWind(10, 'kmh')).toBe('36 km/h');
    expect(formatWind(10, 'mph')).toBe('22 mph');
    expect(formatWind(3.26, 'ms')).toBe('3.3 m/s');
  });
});

describe('Open-Meteo', () => {
  it('maps WMO codes', () => {
    expect(wmoToCondition(0).condition).toBe('clear');
    expect(wmoToCondition(2).condition).toBe('partly');
    expect(wmoToCondition(45).condition).toBe('fog');
    expect(wmoToCondition(63).condition).toBe('rain');
    expect(wmoToCondition(75).condition).toBe('snow');
    expect(wmoToCondition(95).condition).toBe('thunder');
  });

  it('builds a keyless forecast URL', () => {
    const url = new URL(buildForecastUrl(28.61394, 77.209));
    expect(url.origin).toBe('https://api.open-meteo.com');
    expect(url.searchParams.get('latitude')).toBe('28.6139');
    expect(url.searchParams.get('wind_speed_unit')).toBe('ms');
    expect(url.search).not.toMatch(/key|appid/i);
  });

  it('parses a response into a normalised snapshot', () => {
    const now = Date.UTC(2026, 5, 15, 12, 0, 0);
    const offset = 19_800;
    const midnight = Date.UTC(2026, 5, 15) / 1000 - offset;
    const snapshot = parseOpenMeteo(
      {
        utc_offset_seconds: offset,
        current: { temperature_2m: 30.2, apparent_temperature: 33, relative_humidity_2m: 50, weather_code: 3, wind_speed_10m: 2, pressure_msl: 1000, cloud_cover: 90, is_day: 0 },
        hourly: {
          time: [now / 1000 - 7200, now / 1000, now / 1000 + 3600],
          temperature_2m: [1, 2, 3],
          weather_code: [0, 0, 61],
          is_day: [1, 1, 0],
        },
        daily: {
          time: [midnight, midnight + 86400],
          weather_code: [0, 61],
          temperature_2m_max: [34, 30],
          temperature_2m_min: [25, 24],
          precipitation_probability_max: [0, 70],
        },
      },
      28.6,
      77.2,
      now,
    );
    expect(snapshot.current).toMatchObject({ tempC: 30.2, condition: 'cloudy', isDay: false, humidity: 50 });
    expect(snapshot.daily.map((day) => day.date)).toEqual(['2026-06-15', '2026-06-16']);
    expect(snapshot.daily[1]).toMatchObject({ condition: 'rain', pop: 70, maxC: 30 });
    // past hours are dropped
    expect(snapshot.hourly.map((h) => h.tempC)).toEqual([2, 3]);
  });
});

describe('OpenWeather', () => {
  it('maps condition ids', () => {
    expect(owmToCondition(211)).toBe('thunder');
    expect(owmToCondition(500)).toBe('rain');
    expect(owmToCondition(600)).toBe('snow');
    expect(owmToCondition(741)).toBe('fog');
    expect(owmToCondition(800)).toBe('clear');
    expect(owmToCondition(802)).toBe('partly');
    expect(owmToCondition(804)).toBe('cloudy');
  });

  it('aggregates 3-hourly entries into days', () => {
    const base = Date.UTC(2026, 5, 15, 0, 0, 0) / 1000;
    const entry = (h: number, min: number, max: number, id: number, pop: number) => ({
      dt: base + h * 3600,
      main: { temp: (min + max) / 2, temp_min: min, temp_max: max },
      weather: [{ id, description: 'x' }],
      pop,
    });
    const days = aggregateDaily({
      city: { timezone: 0 },
      list: [entry(0, 10, 14, 800, 0), entry(12, 18, 25, 500, 0.6), entry(24, 11, 15, 800, 0)],
    });
    expect(days).toHaveLength(2);
    expect(days[0]).toMatchObject({ date: '2026-06-15', minC: 10, maxC: 25, pop: 60 });
  });
});

describe('cache key', () => {
  it('is stable per provider and rounded coordinates', () => {
    expect(cacheKeyFor('open-meteo', 28.6139, 77.209)).toBe('open-meteo:28.61,77.21');
    expect(cacheKeyFor('openweather', 28.6139, 77.209)).not.toBe(cacheKeyFor('open-meteo', 28.6139, 77.209));
  });
});
