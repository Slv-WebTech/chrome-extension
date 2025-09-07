import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SettingsState {
    isDarkMode: boolean;
    temperatureUnit: 'celsius' | 'fahrenheit';
    backgroundImageUrl: string;
    backgroundSource: 'unsplash' | 'pexels' | 'custom';
    useLocation: boolean;
}

const initialState: SettingsState = {
    isDarkMode: false,
    temperatureUnit: 'celsius',
    backgroundImageUrl: '',
    backgroundSource: 'unsplash',
    useLocation: false,
};

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        toggleDarkMode: (state) => {
            state.isDarkMode = !state.isDarkMode;
        },
        setDarkMode: (state, action: PayloadAction<boolean>) => {
            state.isDarkMode = action.payload;
        },
        setTemperatureUnit: (state, action: PayloadAction<'celsius' | 'fahrenheit'>) => {
            state.temperatureUnit = action.payload;
        },
        setBackgroundImageUrl: (state, action: PayloadAction<string>) => {
            state.backgroundImageUrl = action.payload;
        },
        setBackgroundSource: (state, action: PayloadAction<'unsplash' | 'pexels' | 'custom'>) => {
            state.backgroundSource = action.payload;
        },
        setUseLocation: (state, action: PayloadAction<boolean>) => {
            state.useLocation = action.payload;
        },
    },
});

export const {
    toggleDarkMode,
    setDarkMode,
    setTemperatureUnit,
    setBackgroundImageUrl,
    setBackgroundSource,
    setUseLocation
} = settingsSlice.actions;

export default settingsSlice.reducer;
