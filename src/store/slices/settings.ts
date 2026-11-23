import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_BACKGROUND_ID } from '@/lib/backgrounds';
import { DEFAULT_ENGINE_ID } from '@/lib/search';
import type { TempUnit, WindUnit } from '@/lib/units';

export const ACCENTS = ['indigo', 'violet', 'cyan', 'emerald', 'rose', 'amber'] as const;
export type Accent = (typeof ACCENTS)[number];
export type ThemeMode = 'system' | 'light' | 'dark';
export type BackgroundKind = 'preset' | 'unsplash' | 'pexels' | 'custom' | 'upload';
export type WeatherProviderId = 'open-meteo' | 'openweather';

export interface SavedLocation {
  name: string;
  region?: string;
  country?: string;
  lat: number;
  lon: number;
  /** 'geo' = detected with the browser, 'manual' = chosen by the user */
  source: 'geo' | 'manual';
}

export interface SettingsState {
  name: string;
  theme: ThemeMode;
  accent: Accent;
  hour12: boolean;
  showSeconds: boolean;
  showGreeting: boolean;
  reduceMotion: 'system' | 'on' | 'off';
  singleKeyShortcuts: boolean;
  background: {
    kind: BackgroundKind;
    preset: string;
    customUrl: string;
    query: string;
    /** 0..80, extra darkening/lightening wash over the image */
    dim: number;
    /** 0..16 px blur */
    blur: number;
  };
  weather: {
    provider: WeatherProviderId;
    unit: TempUnit;
    windUnit: WindUnit;
    location: SavedLocation | null;
  };
  search: {
    engine: string;
    customUrl: string;
    rememberRecent: boolean;
    recent: string[];
  };
  widgets: {
    search: boolean;
    links: boolean;
    weather: boolean;
    tasks: boolean;
    focus: boolean;
    notes: boolean;
    quote: boolean;
  };
  focus: {
    focusMin: number;
    shortMin: number;
    longMin: number;
    longEvery: number;
    autoStart: boolean;
    sound: boolean;
    notify: boolean;
  };
  quote: { source: 'bundled' | 'online' };
}

export const defaultSettings: SettingsState = {
  name: '',
  theme: 'system',
  accent: 'indigo',
  hour12: false,
  showSeconds: false,
  showGreeting: true,
  reduceMotion: 'system',
  singleKeyShortcuts: true,
  background: { kind: 'preset', preset: DEFAULT_BACKGROUND_ID, customUrl: '', query: 'nature landscape', dim: 25, blur: 0 },
  weather: { provider: 'open-meteo', unit: 'c', windUnit: 'kmh', location: null },
  search: { engine: DEFAULT_ENGINE_ID, customUrl: '', rememberRecent: true, recent: [] },
  widgets: { search: true, links: true, weather: true, tasks: true, focus: true, notes: true, quote: true },
  focus: { focusMin: 25, shortMin: 5, longMin: 15, longEvery: 4, autoStart: false, sound: true, notify: false },
  quote: { source: 'bundled' },
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState: defaultSettings,
  reducers: {
    updateSettings(state, action: PayloadAction<Partial<Pick<SettingsState, 'name' | 'theme' | 'accent' | 'hour12' | 'showSeconds' | 'showGreeting' | 'reduceMotion' | 'singleKeyShortcuts'>>>) {
      Object.assign(state, action.payload);
    },
    updateBackground(state, action: PayloadAction<Partial<SettingsState['background']>>) {
      Object.assign(state.background, action.payload);
    },
    updateWeatherSettings(state, action: PayloadAction<Partial<SettingsState['weather']>>) {
      Object.assign(state.weather, action.payload);
    },
    updateSearchSettings(state, action: PayloadAction<Partial<SettingsState['search']>>) {
      Object.assign(state.search, action.payload);
    },
    setRecentSearches(state, action: PayloadAction<string[]>) {
      state.search.recent = action.payload;
    },
    updateWidgets(state, action: PayloadAction<Partial<SettingsState['widgets']>>) {
      Object.assign(state.widgets, action.payload);
    },
    updateFocusPrefs(state, action: PayloadAction<Partial<SettingsState['focus']>>) {
      Object.assign(state.focus, action.payload);
    },
    updateQuoteSettings(state, action: PayloadAction<Partial<SettingsState['quote']>>) {
      Object.assign(state.quote, action.payload);
    },
    /** Flip to the opposite of the theme that is currently *shown* (resolves "system"). */
    toggleTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.theme = action.payload === 'dark' ? 'light' : 'dark';
    },
    resetSettings: () => defaultSettings,
  },
});

export const {
  updateSettings,
  updateBackground,
  updateWeatherSettings,
  updateSearchSettings,
  setRecentSearches,
  updateWidgets,
  updateFocusPrefs,
  updateQuoteSettings,
  toggleTheme,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
