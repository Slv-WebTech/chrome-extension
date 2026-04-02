'use client';

import React, { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useWeather } from '../services/hooks';

// Weather icon components
const SunIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
  </svg>
);

const CloudIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
  </svg>
);

const RainIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
  </svg>
);

interface WeatherWidgetProps {
  temperatureUnit?: 'celsius' | 'fahrenheit';
  useLocation?: boolean;
  searchedCity?: string;
}

export function WeatherWidget({ temperatureUnit = 'celsius', useLocation = false, searchedCity = '' }: WeatherWidgetProps) {
  const cityQuery = searchedCity.trim();
  const shouldUseLocation = useLocation || cityQuery.length === 0;
  const { weather, loading, error, refetch } = useWeather(shouldUseLocation, shouldUseLocation ? undefined : cityQuery);

  const isCelsius = temperatureUnit === 'celsius';

  useEffect(() => {
    if (!error) return;
    const isCityNotFound = error.toLowerCase().includes('404') || error.toLowerCase().includes('city not found');
    if (isCityNotFound) {
      toast.error('City not found', {
        description: `"${cityQuery}" could not be found. Check the spelling and try again.`,
        duration: 5000,
      });
    } else {
      toast.error('Weather unavailable', {
        description: 'Could not load weather data. Please check your connection.',
        duration: 5000,
        action: { label: 'Retry', onClick: refetch },
      });
    }
  }, [error]);  // eslint-disable-line react-hooks/exhaustive-deps

  const WeatherIcon = useMemo(() => {
    const condition = weather?.weather?.[0]?.main?.toLowerCase() || '';
    if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunderstorm')) {
      return RainIcon;
    }
    if (condition.includes('cloud')) {
      return CloudIcon;
    }
    return SunIcon;
  }, [weather]);

  const convertTemp = (temp: number) => {
    if (isCelsius) return temp;
    return Math.round((temp * 9 / 5) + 32);
  };

  const temperature = weather ? convertTemp(Math.round(weather.main.temp)) : null;
  const feelsLike = weather ? convertTemp(Math.round(weather.main.feels_like)) : null;
  const weatherCondition = weather?.weather?.[0]?.description || 'Weather unavailable';
  const statCards = weather ? [
    { label: 'Feels', value: feelsLike !== null ? `${feelsLike}°${isCelsius ? 'C' : 'F'}` : '--' },
    { label: 'Humidity', value: Number.isFinite(weather.main?.humidity) ? `${weather.main.humidity}%` : '--' },
    { label: 'Wind', value: Number.isFinite(weather.wind?.speed) ? `${weather.wind.speed} m/s` : '--' },
    { label: 'Clouds', value: Number.isFinite(weather.clouds?.all) ? `${weather.clouds.all}%` : '--' },
    { label: 'Pressure', value: Number.isFinite(weather.main?.pressure) ? `${weather.main.pressure} hPa` : '--' },
    { label: 'Country', value: weather.sys?.country || '--' },
  ] : [];
  const statRingText = [
    `Feels Like ${loading ? '--' : (statCards[0]?.value || '--')}`,
    `Humidity ${loading ? '--' : (statCards[1]?.value || '--')}`,
    `Wind Speed ${loading ? '--' : (statCards[2]?.value || '--').replace(' m/s', ' m/s')}`,
    `Cloud Cover ${loading ? '--' : (statCards[3]?.value || '--')}`,
    `Pressure ${loading ? '--' : (statCards[4]?.value || '--').replace(' hPa', ' hPa')}`,
    `Country ${loading ? '--' : (statCards[5]?.value || '--')}`,
  ];
  const widgetSize = 240;
  const center = widgetSize / 2;
  const mainCardSize = 118;
  const statRingRadius = 100;
  const statOrbitDuration = 40;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 120 }}
      className="fixed right-4 top-4 z-30"
    >
      {/* Circular orbit container: all elements derive from the same center point */}
      <div className="relative" style={{ width: widgetSize, height: widgetSize }}>

        {/* Orbiting readable stat text */}
        <div className="pointer-events-none absolute inset-0 z-10">
          {statRingText.map((item, index) => {
            const baseAngle = (index * 360) / statRingText.length;

            return (
              <motion.div
                key={item}
                className="absolute inset-0"
                style={{ transformOrigin: `${center}px ${center}px` }}
                animate={{ rotate: [baseAngle, baseAngle + 360] }}
                transition={{ duration: statOrbitDuration, repeat: Infinity, ease: 'linear' }}
              >
                <div
                  className="absolute left-1/2 top-1/2"
                  style={{ transform: `translate(-50%, -50%) translateY(-${statRingRadius}px)` }}
                >
                  <motion.p
                    animate={{ rotate: [0, -360] }}
                    transition={{ duration: statOrbitDuration, repeat: Infinity, ease: 'linear' }}
                    className="whitespace-nowrap rounded-full bg-black/12 px-2 py-[1px] text-center text-[8.1px] font-semibold leading-tight text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]"
                  >
                    {item}
                  </motion.p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Main circular weather card */}
        <motion.div
          className="absolute z-20 overflow-hidden rounded-full border border-white/24 bg-gradient-to-b from-white/12 via-sky-400/10 to-blue-900/45 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_6px_28px_rgba(6,182,212,0.45),0_18px_48px_rgba(2,80,155,0.42)] backdrop-blur-xl"
          style={{
            width: mainCardSize,
            height: mainCardSize,
            left: center - mainCardSize / 2,
            top: center - mainCardSize / 2,
          }}
          whileHover={{ scale: 1.04 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="pointer-events-none absolute inset-[2px] rounded-full border border-white/30" />
          <div className="pointer-events-none absolute inset-[6px] rounded-full border border-white/10" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.40),transparent_38%),radial-gradient(circle_at_68%_80%,rgba(14,165,233,0.28),transparent_46%),radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.06),transparent_70%)]" />
          {/* Glow blobs */}
          <div className="pointer-events-none absolute inset-0 rounded-full">
            <div className="absolute -right-4 -top-3 h-16 w-16 rounded-full bg-cyan-300/55 blur-2xl" />
            <div className="absolute -bottom-4 -left-3 h-16 w-16 rounded-full bg-blue-600/40 blur-2xl" />
            <div className="absolute left-[20px] top-[10px] h-3 w-10 rounded-full bg-white/52 blur-[1.5px]" />
          </div>

          <div className="relative flex h-full flex-col items-center justify-start gap-[3px] px-2 pt-[10px] text-center">
            <motion.div
              className="grid h-[26px] w-[26px] place-items-center rounded-full border border-white/40 bg-gradient-to-b from-white/30 to-white/10 shadow-[inset_0_1px_3px_rgba(255,255,255,0.55),0_2px_8px_rgba(0,0,0,0.28)]"
              animate={{ y: [0, -1.5, 0], scale: [1, 1.04, 1] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <WeatherIcon className="h-[14px] w-[14px] text-yellow-200 drop-shadow-[0_0_5px_rgba(250,204,21,0.9)]" />
            </motion.div>

            <motion.div
              className="truncate text-[32px] font-black leading-none tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
            >
              {loading ? '…' : temperature !== null ? `${temperature}°${isCelsius ? 'C' : 'F'}` : '--'}
            </motion.div>

            <p className="max-w-[90px] truncate rounded-full border border-white/20 bg-white/10 px-2 py-[2px] text-[7.8px] font-semibold capitalize tracking-wide text-white/88 backdrop-blur-sm">
              {loading ? 'Loading…' : weatherCondition}
            </p>
          </div>

        </motion.div>

        {/* Error state */}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="max-w-[160px] px-3 text-center text-[10px] text-red-300">
              {error.toLowerCase().includes('404') || error.toLowerCase().includes('city not found')
                ? `"${cityQuery}" not found`
                : 'Weather unavailable'}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}