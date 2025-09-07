'use client';

import { useEffect } from 'react';
import { QuoteSection } from '../../components/quote-section';
import { WeatherWidget } from '../../components/weather-widget';
import { TodoList } from '../../components/todo-list';
import { SettingsModal } from '../../components/settings-modal';
import { DateTimeFooter } from '../../components/date-time-footer';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
    setDarkMode,
    setTemperatureUnit,
    setBackgroundImageUrl,
    setBackgroundSource,
    setUseLocation
} from '../store/slices/settingsSlice';

export default function HomePage() {
    const dispatch = useAppDispatch();
    const { isDarkMode, temperatureUnit, backgroundImageUrl, backgroundSource, useLocation } = useAppSelector(
        (state) => state.settings
    );

    // Apply dark/light theme to body and html
    useEffect(() => {
        console.log('Dark mode changed:', isDarkMode); // Debug log
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
            {/* Debug indicator for dark mode */}
            <div className="fixed top-4 left-4 z-50 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                Mode: {isDarkMode ? 'Dark' : 'Light'}
            </div>

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
                <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/70' : 'bg-black/50'} transition-colors duration-300`}></div>
            </div>

            {/* Quote Banner at Top */}
            <QuoteSection />

            {/* Settings Modal */}
            <SettingsModal
                isDarkMode={isDarkMode}
                onThemeToggle={(dark: boolean) => dispatch(setDarkMode(dark))}
                temperatureUnit={temperatureUnit}
                onTemperatureUnitChange={(unit: 'celsius' | 'fahrenheit') => dispatch(setTemperatureUnit(unit))}
                backgroundImageUrl={backgroundImageUrl}
                onBackgroundImageChange={(url: string) => dispatch(setBackgroundImageUrl(url))}
                backgroundSource={backgroundSource}
                onBackgroundSourceChange={(source: 'unsplash' | 'pexels' | 'custom') => dispatch(setBackgroundSource(source))}
                useLocation={useLocation}
                onLocationToggle={(useLocation: boolean) => dispatch(setUseLocation(useLocation))}
            />

            {/* Main Content Grid - Adjusted for Top Quote Banner */}
            <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 pt-24 pb-24">
                {/* Left Section - Todo List */}
                <div className="flex items-start justify-center">
                    <div className="w-full max-w-md">
                        <TodoList />
                    </div>
                </div>

                {/* Right Section - Weather */}
                <div className="flex items-start justify-center">
                    <div className="w-full max-w-md">
                        <WeatherWidget
                            temperatureUnit={temperatureUnit}
                            useLocation={useLocation}
                        />
                    </div>
                </div>
            </div>

            {/* Date/Time Footer */}
            <DateTimeFooter />
        </div>
    );
}
