'use client';

import React, { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Card, CardContent } from './ui/card';
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
  const cityLabel = shouldUseLocation ? (weather?.name || 'Your Location') : (weather?.name || cityQuery);
  const statCards = weather ? [
    { label: 'Feels Like', value: `${feelsLike}°${isCelsius ? 'C' : 'F'}` },
    { label: 'Humidity', value: `${weather.main.humidity}%` },
    { label: 'Wind', value: `${weather.wind.speed} m/s` },
    { label: 'Clouds', value: `${weather.clouds.all}%` },
    { label: 'Pressure', value: `${weather.main.pressure} hPa` },
    { label: 'Country', value: weather.sys.country },
  ] : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="w-full max-w-3xl space-y-4">
        <Card className="bg-gradient-to-br from-blue-500/25 to-cyan-500/15 backdrop-blur-md border-white/30 rounded-2xl shadow-2xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <motion.div
                className="flex items-center justify-center gap-2"
                whileHover={{ scale: 1.03 }}
              >
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <WeatherIcon className="w-8 h-8 text-yellow-300 drop-shadow-lg" />
                </motion.div>
                <h3 className="text-white text-xl font-semibold drop-shadow-md">{cityLabel}</h3>
              </motion.div>

              <motion.div
                className="text-5xl text-white font-bold drop-shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
              >
                {loading ? '...' : temperature !== null ? `${temperature}°${isCelsius ? 'C' : 'F'}` : '--'}
              </motion.div>

              <motion.p
                className="text-white/90 text-base font-medium capitalize"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {loading ? 'Fetching weather...' : weatherCondition}
              </motion.p>

              {error && !loading && (
                <p className="text-xs text-red-300">
                  {error.toLowerCase().includes('404') || error.toLowerCase().includes('city not found')
                    ? `"${cityQuery}" not found — try a different city.`
                    : 'Weather unavailable'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {!loading && weather && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.04, duration: 0.25 }}
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-center backdrop-blur-md"
              >
                <p className="text-[11px] uppercase tracking-wide text-white/70">{stat.label}</p>
                <p className="mt-1 text-sm font-semibold text-white">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}