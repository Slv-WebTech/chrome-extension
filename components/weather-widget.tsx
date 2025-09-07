'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';

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

// Mock weather data
const weatherData: Record<string, { temp: number; condition: string; icon: React.ComponentType<{ className?: string }> }> = {
  'New York': { temp: 22, condition: 'Sunny', icon: SunIcon },
  'London': { temp: 15, condition: 'Cloudy', icon: CloudIcon },
  'Tokyo': { temp: 18, condition: 'Rainy', icon: RainIcon },
  'Paris': { temp: 20, condition: 'Partly Cloudy', icon: CloudIcon },
  'Sydney': { temp: 25, condition: 'Sunny', icon: SunIcon }
};

interface WeatherWidgetProps {
  temperatureUnit?: 'celsius' | 'fahrenheit';
  useLocation?: boolean;
}

export function WeatherWidget({ temperatureUnit = 'celsius', useLocation = false }: WeatherWidgetProps) {
  const [city, setCity] = useState('New York');
  const [searchCity, setSearchCity] = useState('');
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const isCelsius = temperatureUnit === 'celsius';

  // Get user's location
  useEffect(() => {
    if (useLocation && navigator.geolocation) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you'd reverse geocode this to get city name
          // For demo, we'll just set it to a nearby city
          setUserLocation('Your Location');
          setCity('New York'); // Would be replaced with actual reverse geocoding
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLoadingLocation(false);
        }
      );
    }
  }, [useLocation]);

  const currentWeather = weatherData[city] || weatherData['New York'];
  const WeatherIcon = currentWeather.icon;

  const convertTemp = (temp: number) => {
    if (isCelsius) return temp;
    return Math.round((temp * 9 / 5) + 32);
  };

  const handleSearch = () => {
    if (searchCity && weatherData[searchCity]) {
      setCity(searchCity);
      setSearchCity('');
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 rounded-xl shadow-lg">
      <CardContent className="p-4">
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <WeatherIcon className="w-5 h-5 text-white" />
            <h3 className="text-white text-lg font-medium">{city}</h3>
          </div>
          <div className="text-2xl text-white font-bold">
            {convertTemp(currentWeather.temp)}°{isCelsius ? 'C' : 'F'}
          </div>
          <p className="text-white/80 text-sm">{currentWeather.condition}</p>
        </div>
      </CardContent>
    </Card>
  );
}