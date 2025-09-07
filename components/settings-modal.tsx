'use client';

import { useState } from 'react';
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
  onLocationToggle
}: SettingsModalProps) {
  const [customImageUrl, setCustomImageUrl] = useState(backgroundImageUrl);

  // Debug logs
  console.log('SettingsModal props:', {
    temperatureUnit,
    backgroundSource,
    isDarkMode,
    useLocation
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="fixed top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full z-50"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </Button>
      </DialogTrigger>
      <DialogContent className={`max-w-md w-full mx-4 ${isDarkMode
        ? 'bg-gray-900/95 text-white border-gray-700'
        : 'bg-white/95 text-gray-900 border-white/20'
        } backdrop-blur-md rounded-2xl shadow-2xl transition-colors duration-300`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              )}
              <label className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </label>
            </div>
            <Switch
              checked={isDarkMode}
              onCheckedChange={(checked) => {
                console.log('Switch toggled:', checked); // Debug log
                onThemeToggle(checked);
              }}
            />
          </div>

          {/* Use Location for Weather */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <label className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Use Current Location</label>
            </div>
            <Switch
              checked={useLocation}
              onCheckedChange={(checked) => {
                console.log('Location toggle:', checked);
                onLocationToggle?.(checked);
              }}
            />
          </div>

          {/* Background Source */}
          <div className="space-y-2">
            <label className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Background Source</label>
            <select
              value={backgroundSource}
              onChange={(e) => onBackgroundSourceChange?.(e.target.value as 'unsplash' | 'pexels' | 'custom')}
              className={`flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none ${isDarkMode
                ? 'bg-gray-800 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
                }`}
              style={isDarkMode ? {
                colorScheme: 'dark',
                backgroundColor: '#1f2937',
                color: 'white',
                border: '1px solid #4b5563'
              } : {
                colorScheme: 'light',
                backgroundColor: 'white',
                color: '#111827',
                border: '1px solid #d1d5db'
              }}
            >
              <option value="unsplash" style={isDarkMode ? { backgroundColor: '#1f2937', color: 'white' } : { backgroundColor: 'white', color: '#111827' }}>Unsplash</option>
              <option value="pexels" style={isDarkMode ? { backgroundColor: '#1f2937', color: 'white' } : { backgroundColor: 'white', color: '#111827' }}>Pexels</option>
              <option value="custom" style={isDarkMode ? { backgroundColor: '#1f2937', color: 'white' } : { backgroundColor: 'white', color: '#111827' }}>Custom URL</option>
            </select>
          </div>

          {/* Custom Background URL */}
          {backgroundSource === 'custom' && (
            <div className="space-y-2">
              <label className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Background Image URL</label>
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                className={`${isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
              />
              <Button
                onClick={() => onBackgroundImageChange?.(customImageUrl)}
                className="w-full"
                size="sm"
              >
                Apply Background
              </Button>
            </div>
          )}

          {/* Temperature Unit */}
          <div className="space-y-2">
            <label className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Temperature Unit</label>
            <select
              value={temperatureUnit}
              onChange={(e) => onTemperatureUnitChange(e.target.value as 'celsius' | 'fahrenheit')}
              className={`flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none ${isDarkMode
                ? 'bg-gray-800 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
                }`}
              style={isDarkMode ? {
                colorScheme: 'dark',
                backgroundColor: '#1f2937',
                color: 'white',
                border: '1px solid #4b5563'
              } : {
                colorScheme: 'light',
                backgroundColor: 'white',
                color: '#111827',
                border: '1px solid #d1d5db'
              }}
            >
              <option value="celsius" style={isDarkMode ? { backgroundColor: '#1f2937', color: 'white' } : { backgroundColor: 'white', color: '#111827' }}>Celsius (°C)</option>
              <option value="fahrenheit" style={isDarkMode ? { backgroundColor: '#1f2937', color: 'white' } : { backgroundColor: 'white', color: '#111827' }}>Fahrenheit (°F)</option>
            </select>
          </div>

          {/* Extension Info */}
          <div className={`pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`text-sm space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <p><strong>Chrome Extension Dashboard</strong></p>
              <p>Version 1.0.0</p>
              <p>Made with React & Tailwind CSS</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}