'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { QuoteSection } from '../components/quote-section';
import { WeatherWidget } from '../components/weather-widget';
import { TodoList } from '../components/todo-list';
import { MusicPlayer } from '../components/music-player';
import { SettingsModal } from '../components/settings-modal';
import { DateTimeFooter } from '../components/date-time-footer';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { clearWeatherSessionCache } from '../services/hooks';
import {
    setDarkMode,
    setTemperatureUnit,
    setBackgroundImageUrl,
    setBackgroundSource,
    setUseLocation,
    setWeatherCity
} from '../store/slices/settingsSlice';

export default function HomePage() {
    const dispatch = useAppDispatch();
    const { isDarkMode, temperatureUnit, backgroundImageUrl, backgroundSource, useLocation, weatherCity } = useAppSelector(
        (state) => state.settings
    );

    // Apply dark/light theme to body and html
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
        }
    }, [isDarkMode]);

    return (
        <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: backgroundImageUrl
                        ? `url('${backgroundImageUrl}')`
                        : isDarkMode
                            ? `url('https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=2026&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`
                            : `url('https://images.unsplash.com/photo-1426604966848-d7adac402bff?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`
                }}
            >
                <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/60' : 'bg-black/40'} transition-colors duration-300`}></div>
            </div>

            {/* Quote Banner at Top */}
            <QuoteSection />

            {/* Settings Modal */}
            <SettingsModal
                isDarkMode={isDarkMode}
                onThemeToggle={(dark: boolean) => dispatch(setDarkMode(dark))}
                temperatureUnit={temperatureUnit}
                onTemperatureUnitChange={(unit: 'celsius' | 'fahrenheit') => {
                    void clearWeatherSessionCache();
                    dispatch(setTemperatureUnit(unit));
                }}
                backgroundImageUrl={backgroundImageUrl}
                onBackgroundImageChange={(url: string) => dispatch(setBackgroundImageUrl(url))}
                backgroundSource={backgroundSource}
                onBackgroundSourceChange={(source: 'unsplash' | 'pexels' | 'custom') => dispatch(setBackgroundSource(source))}
                useLocation={useLocation}
                onLocationToggle={(val: boolean) => {
                    void clearWeatherSessionCache();
                    dispatch(setUseLocation(val));
                    if (val) dispatch(setWeatherCity(''));
                }}
                weatherCity={weatherCity}
                onWeatherCitySearch={(city: string) => {
                    void clearWeatherSessionCache();
                    dispatch(setWeatherCity(city));
                    dispatch(setUseLocation(false));
                }}
                onUseCurrentLocation={() => {
                    void clearWeatherSessionCache();
                    dispatch(setWeatherCity(''));
                    dispatch(setUseLocation(true));
                }}
            />

            {/* Main Content - Clean and Spacious Layout */}
            <motion.div
                className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-28 pb-24 sm:px-6 lg:px-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
            >
                {/* Content Container */}
                <div className="w-full max-w-7xl mx-auto">
                    {/* Top Section - Weather Widget Centered */}
                    <div className="flex justify-center mb-8">
                        <WeatherWidget
                            temperatureUnit={temperatureUnit}
                            useLocation={useLocation}
                            searchedCity={weatherCity}
                        />
                    </div>

                    {/* Left-center Section - Music Player */}
                    <div className="fixed left-4 top-1/2 z-30 -translate-y-1/2 sm:left-6 lg:left-8">
                        <MusicPlayer />
                    </div>

                    {/* Bottom-right Section - Todo List */}
                    <div className="fixed bottom-24 right-4 z-30 sm:right-6 lg:right-8">
                        <div className="w-[340px] sm:w-[380px]">
                            <TodoList />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Date/Time Footer */}
            <DateTimeFooter />
        </div>
    );
}
