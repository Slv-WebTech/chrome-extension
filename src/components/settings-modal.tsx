'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './ui/dialog';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Input } from './ui/input';

interface SettingsModalProps {
  isDarkMode: boolean;
  onThemeToggle: (dark: boolean) => void;
  temperatureUnit: 'celsius' | 'fahrenheit';
  onTemperatureUnitChange: (unit: 'celsius' | 'fahrenheit') => void;
  backgroundImageUrl?: string;
  onBackgroundImageChange?: (url: string) => void;
  backgroundSource?: 'unsplash' | 'pexels' | 'custom';
  onBackgroundSourceChange?: (source: 'unsplash' | 'pexels' | 'custom') => void;
  useLocation?: boolean;
  onLocationToggle?: (useLocation: boolean) => void;
  weatherCity?: string;
  onWeatherCitySearch?: (city: string) => void;
  onUseCurrentLocation?: () => void;
}

export function SettingsModal({
  isDarkMode,
  onThemeToggle,
  temperatureUnit,
  onTemperatureUnitChange,
  backgroundImageUrl = '',
  onBackgroundImageChange,
  backgroundSource = 'unsplash',
  onBackgroundSourceChange,
  useLocation = false,
  onLocationToggle,
  weatherCity = '',
  onWeatherCitySearch,
  onUseCurrentLocation
}: SettingsModalProps) {
  const [customImageUrl, setCustomImageUrl] = useState(backgroundImageUrl);
  const [cityInput, setCityInput] = useState(weatherCity);

  const panelClass = 'bg-white/10 border-white/20 text-white backdrop-blur-md';
  const sectionClass = 'rounded-xl border border-white/10 bg-white/5 p-3';
  const labelClass = 'text-white';
  const inputClass = 'bg-white/20 border-white/30 text-white placeholder:text-gray-300 focus-visible:ring-white/60 focus-visible:border-white/60';

  const toggleItems = [
    {
      key: 'theme',
      label: 'Dark',
      checked: isDarkMode,
      onChange: (checked: boolean) => onThemeToggle(checked),
      icon: (
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )
    },
    {
      key: 'location',
      label: 'GPS',
      checked: useLocation,
      onChange: (checked: boolean) => onLocationToggle?.(checked),
      icon: (
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
      )
    }
  ];

  const sourceOptions: Array<{ value: 'unsplash' | 'pexels' | 'custom'; label: string; icon: React.ReactNode }> = [
    {
      value: 'unsplash',
      label: 'Unsplash',
      icon: (
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 3h12v5H4V3zm0 9h5v5H4v-5zm7 0h5v5h-5v-5z" />
        </svg>
      )
    },
    {
      value: 'pexels',
      label: 'Pexels',
      icon: (
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v9a2 2 0 01-2 2H9l-3 3v-3H6a2 2 0 01-2-2V4zm4.5 2.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      value: 'custom',
      label: 'Custom URL',
      icon: (
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828-2.828l3-3zM7.414 9.757a2 2 0 010 2.828l-3 3a2 2 0 11-2.828-2.828l3-3a2 2 0 012.828 0zm1.172 3.657a1 1 0 010-1.414l3-3a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      )
    }
  ];

  const unitOptions: Array<{ value: 'celsius' | 'fahrenheit'; label: string }> = [
    {
      value: 'celsius',
      label: '°C'
    },
    {
      value: 'fahrenheit',
      label: '°F'
    }
  ];

  useEffect(() => {
    setCityInput(weatherCity);
  }, [weatherCity]);

  const handleCitySearch = () => {
    const city = cityInput.trim();
    if (!city) return;
    onWeatherCitySearch?.(city);
  };

  const handleResetDefaults = () => {
    onThemeToggle(false);
    onTemperatureUnitChange('celsius');
    onBackgroundSourceChange?.('unsplash');
    onBackgroundImageChange?.('');
    setCustomImageUrl('');
    setCityInput('');
    onUseCurrentLocation?.();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="fixed right-4 top-4 z-50 h-10 w-10 rounded-full border border-white/25 bg-white/10 p-0 text-white/90 backdrop-blur-md transition-all duration-200 hover:scale-[1.03] hover:bg-white/20"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </Button>
      </DialogTrigger>
      <DialogContent className={`mx-4 w-full max-w-[1040px] rounded-2xl border p-4 shadow-2xl transition-colors duration-300 ${panelClass}`}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 text-lg ${labelClass}`}>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </span>
            Dashboard Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <div className={`${sectionClass} p-2.5`}>
            <div className="grid grid-cols-2 gap-1.5">
              {toggleItems.map((item) => (
                <div key={item.key} className="flex h-9 items-center justify-between rounded-lg border border-white/10 bg-white/5 px-2">
                  <div className="flex items-center gap-1 text-white/90">
                    {item.icon}
                    <span className="text-xs font-semibold">{item.label}</span>
                  </div>
                  <Switch checked={item.checked} onCheckedChange={item.onChange} />
                </div>
              ))}
            </div>

            <div className="mt-1.5 grid grid-cols-1 gap-1.5 md:grid-cols-[1fr_auto_auto] md:items-center">
              <Input
                type="text"
                placeholder="City"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCitySearch();
                  }
                }}
                className={`${inputClass} h-9`}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCitySearch}
                className="h-9 min-w-14 bg-gradient-to-r from-cyan-500 to-blue-500 px-3 text-white shadow-lg hover:from-cyan-600 hover:to-blue-600"
                aria-label="Search city weather"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 102.906 6.75l3.172 3.172a1 1 0 001.414-1.414l-3.172-3.172A4 4 0 008 4zm-6 4a6 6 0 1110.89 3.476l3.817 3.817a1 1 0 01-1.414 1.414l-3.817-3.817A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 border-white/25 bg-white/5 px-3 text-white hover:bg-white/10"
                onClick={onUseCurrentLocation}
                aria-label="Use current location weather"
                title="Use your current location"
              >
                <span className="flex items-center gap-1.5 text-xs font-semibold">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.05a6.002 6.002 0 014.95 4.95H17a1 1 0 110 2h-1.05a6.002 6.002 0 01-4.95 4.95V17a1 1 0 11-2 0v-1.05A6.002 6.002 0 014.05 11H3a1 1 0 110-2h1.05A6.002 6.002 0 019 4.05V3a1 1 0 011-1zm0 4a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
                  </svg>
                  <span>My GPS</span>
                </span>
              </Button>
            </div>

          </div>

          <div className={sectionClass}>
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/60">Background Source</p>
                <div className="grid grid-cols-3 gap-2">
                  {sourceOptions.map((source) => (
                    <button
                      key={source.value}
                      type="button"
                      title={source.label}
                      onClick={() => onBackgroundSourceChange?.(source.value)}
                      className={`h-9 rounded-lg border px-2 text-xs font-semibold whitespace-nowrap transition-colors ${backgroundSource === source.value
                        ? 'border-cyan-300 bg-cyan-400/25 text-white'
                        : 'border-white/20 bg-white/5 text-white/90 hover:bg-white/10'
                        }`}
                    >
                      <span className="inline-flex items-center justify-center gap-1">
                        {source.icon}
                        <span>{source.label}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/60">Temp</p>
                <div className="grid grid-cols-2 gap-2">
                  {unitOptions.map((unit) => (
                    <button
                      key={unit.value}
                      type="button"
                      title={unit.value === 'celsius' ? 'Celsius' : 'Fahrenheit'}
                      onClick={() => onTemperatureUnitChange(unit.value)}
                      className={`h-9 rounded-lg border px-2 text-sm font-semibold whitespace-nowrap transition-colors ${temperatureUnit === unit.value
                        ? 'border-cyan-300 bg-cyan-400/25 text-white'
                        : 'border-white/20 bg-white/5 text-white/90 hover:bg-white/10'
                        }`}
                    >
                      <span>{unit.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {backgroundSource === 'custom' && (
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto] md:items-center">
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  className={inputClass}
                />
                <Button
                  onClick={() => onBackgroundImageChange?.(customImageUrl)}
                  className="h-9 bg-gradient-to-r from-cyan-500 to-blue-500 px-4 text-white shadow-lg hover:from-cyan-600 hover:to-blue-600"
                  size="sm"
                  aria-label="Apply custom background"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 rounded-full border border-cyan-300/30 bg-gradient-to-r from-slate-500/20 to-cyan-400/12 px-3.5 text-xs font-semibold text-white shadow-[0_8px_24px_rgba(6,182,212,0.14)] backdrop-blur-md transition-all duration-200 !hover:bg-transparent hover:scale-[1.02] hover:border-cyan-300/45 hover:from-slate-500/30 hover:to-cyan-400/22 hover:text-white hover:shadow-[0_10px_28px_rgba(6,182,212,0.2)]"
              onClick={handleResetDefaults}
              aria-label="Reset all preferences"
            >
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white/90">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101A7.002 7.002 0 0117 10a1 1 0 11-2 0 5 5 0 10-1.651 3.716 1 1 0 111.302 1.518A7 7 0 115 7.899V10a1 1 0 11-2 0V3a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="tracking-[0.02em]">Reset All</span>
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}