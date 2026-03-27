/**
 * API Hooks - React hooks for API integration
 * Provides easy-to-use hooks for components to interact with API services
 */

import { useState, useEffect, useCallback } from 'react';
import apiService, {
    WeatherData,
    QuoteData,
    type GeolocationCoords
} from './api';
import { getSessionValue, setSessionValue, removeSessionValuesByPrefix } from './chrome-storage';

const WEATHER_CACHE_TTL_MS = 5 * 60 * 1000;
const WEATHER_CACHE_PREFIX = 'weather_cache_';
const WEATHER_CACHE_LOCATION_KEY = `${WEATHER_CACHE_PREFIX}location`;

export async function clearWeatherSessionCache(): Promise<void> {
    await removeSessionValuesByPrefix(WEATHER_CACHE_PREFIX);
}

interface WeatherCacheEntry {
    data: WeatherData;
    savedAt: number;
}

/**
 * Hook for fetching weather data
 */
export function useWeather(useLocation: boolean = false, city?: string) {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const cityKey = city?.trim().toLowerCase() || '';

    const fetchWeather = useCallback(async () => {
        if (!useLocation && !city) return;

        const cacheKey = useLocation
            ? WEATHER_CACHE_LOCATION_KEY
            : `${WEATHER_CACHE_PREFIX}city_${cityKey}`;

        setLoading(true);
        setError(null);

        try {
            const cached = await getSessionValue<WeatherCacheEntry | null>(cacheKey, null);
            if (cached && Date.now() - cached.savedAt < WEATHER_CACHE_TTL_MS) {
                setWeather(cached.data);
                setLoading(false);
                return;
            }

            let weatherData: WeatherData;

            if (useLocation) {
                weatherData = await apiService.dashboard.getWeatherWithLocation();
            } else if (city) {
                weatherData = await apiService.weather.getWeatherByCity(city);
            } else {
                throw new Error('No location or city provided');
            }

            setWeather(weatherData);
            await setSessionValue(cacheKey, {
                data: weatherData,
                savedAt: Date.now(),
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch weather');
            setWeather(null);
        } finally {
            setLoading(false);
        }
    }, [useLocation, city, cityKey]);

    useEffect(() => {
        fetchWeather();
    }, [fetchWeather]);

    return { weather, loading, error, refetch: fetchWeather };
}

/**
 * Hook for fetching quotes
 */
export function useQuote() {
    const [quote, setQuote] = useState<QuoteData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchQuote = useCallback(async (tag?: string) => {
        setLoading(true);
        setError(null);

        try {
            const quoteData = tag
                ? await apiService.quotes.getQuoteByTag(tag)
                : await apiService.quotes.getRandomQuote();

            setQuote(quoteData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch quote');
            setQuote(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQuote();
    }, []);

    return { quote, loading, error, refetch: fetchQuote };
}

/**
 * Hook for background images
 */
export function useBackgroundImage(source: 'unsplash' | 'pexels' | 'custom', customUrl?: string) {
    const [imageUrl, setImageUrl] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBackground = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const url = await apiService.dashboard.getBackgroundImage(source, customUrl);
            setImageUrl(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch background');
            setImageUrl('');
        } finally {
            setLoading(false);
        }
    }, [source, customUrl]);

    useEffect(() => {
        fetchBackground();
    }, [fetchBackground]);

    return { imageUrl, loading, error, refetch: fetchBackground };
}

/**
 * Hook for geolocation
 */
export function useGeolocation() {
    const [location, setLocation] = useState<GeolocationCoords | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getCurrentLocation = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const coords = await apiService.location.getCurrentLocation();
            setLocation(coords);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get location');
            setLocation(null);
        } finally {
            setLoading(false);
        }
    }, []);

    return { location, loading, error, getCurrentLocation };
}

/**
 * Hook for dashboard initialization
 */
export function useDashboard(useLocation: boolean = false) {
    const [data, setData] = useState<{
        weather?: WeatherData;
        quote: QuoteData | null;
        backgroundImage?: string;
    }>({
        quote: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const initializeDashboard = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const dashboardData = await apiService.dashboard.initializeDashboard(useLocation);
            setData(dashboardData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to initialize dashboard');
        } finally {
            setLoading(false);
        }
    }, [useLocation]);

    useEffect(() => {
        initializeDashboard();
    }, [initializeDashboard]);

    return { data, loading, error, refetch: initializeDashboard };
}

/**
 * Hook for validating image URLs
 */
export function useImageValidation() {
    const [isValidating, setIsValidating] = useState(false);

    const validateImageUrl = useCallback(async (url: string): Promise<boolean> => {
        if (!url) return false;

        setIsValidating(true);
        try {
            const isValid = await apiService.background.validateImageUrl(url);
            return isValid;
        } catch {
            return false;
        } finally {
            setIsValidating(false);
        }
    }, []);

    return { validateImageUrl, isValidating };
}
