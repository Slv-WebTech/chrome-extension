/**
 * API Service - Centralized API calls handler
 * Handles all external API integrations including weather, quotes, and background images
 */

import { API_CONFIG, validateApiKeys } from './config';

// Initialize API key validation
validateApiKeys();

// Types for API responses
export interface WeatherData {
    name: string;
    coord: {
        lon: number;
        lat: number;
    };
    weather: Array<{
        main: string;
        description: string;
        icon: string;
    }>;
    main: {
        temp: number;
        feels_like: number;
        temp_min: number;
        temp_max: number;
        pressure: number;
        humidity: number;
    };
    clouds: {
        all: number;
    };
    wind: {
        speed: number;
        deg?: number;
        gust?: number;
    };
    sys: {
        country: string;
    };
}

export interface QuoteData {
    content: string;
    author: string;
    tags?: string[];
}

// FreeAPI specific response interface
export interface FreeAPIQuoteResponse {
    statusCode: number;
    data: {
        id: number;
        content: string;
        author: string;
        tags: string[];
        authorSlug: string;
        length: number;
        dateAdded: string;
        dateModified: string;
    };
    message: string;
    success: boolean;
}

export interface UnsplashImage {
    id: string;
    urls: {
        regular: string;
        full: string;
        small: string;
    };
    alt_description: string;
    user: {
        name: string;
    };
}

export interface PexelsImage {
    id: number;
    url: string;
    photographer: string;
    src: {
        original: string;
        large: string;
        medium: string;
    };
}

export interface GeolocationCoords {
    latitude: number;
    longitude: number;
}

// API Configuration imported from config file
const { WEATHER, UNSPLASH, PEXELS, QUOTES, IP_LOCATION, TIMEOUTS, DEFAULTS } = API_CONFIG;

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
        const method = (options.method || 'GET').toUpperCase();
        const headers: Record<string, string> = {
            ...(options.headers as Record<string, string> | undefined),
        };

        // Only send Content-Type when a request body is present.
        // Adding it to GET can trigger a preflight request that some APIs reject.
        if (options.body && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, {
            ...options,
            method,
            headers,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

/**
 * Weather API Service
 */
export const weatherAPI = {
    /**
     * Get weather by coordinates
     */
    async getWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
        const url = `${WEATHER.BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER.KEY}&units=metric`;
        return apiFetch<WeatherData>(url);
    },

    /**
     * Get weather by city name
     */
    async getWeatherByCity(city: string): Promise<WeatherData> {
        const url = `${WEATHER.BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${WEATHER.KEY}&units=metric`;
        return apiFetch<WeatherData>(url);
    },

    /**
     * Get weather forecast (optional extension)
     */
    async getForecast(location: string, days: number = 3): Promise<any> {
        const url = `${WEATHER.BASE_URL}/forecast?q=${encodeURIComponent(location)}&appid=${WEATHER.KEY}&units=metric`;
        return apiFetch(url);
    },
};

/**
 * Quotes API Service
 */
export const quotesAPI = {
    /**
     * Get random quote from FreeAPI
     */
    async getRandomQuote(): Promise<QuoteData> {
        try {
            const url = `${QUOTES.BASE_URL}/quote/random`;
            const response = await apiFetch<FreeAPIQuoteResponse>(url);

            // Transform FreeAPI response to our QuoteData format
            return {
                content: response.data.content,
                author: response.data.author,
                tags: response.data.tags,
            };
        } catch {
            // Some extension contexts block third-party fetch unless host permissions are granted.
            // Fall back to default quote so the UI remains stable without runtime noise.
            return DEFAULTS.QUOTE;
        }
    },

    /**
     * Get quote by specific tags (Note: FreeAPI may not support tag filtering)
     * Falls back to random quote
     */
    async getQuoteByTag(tag: string): Promise<QuoteData> {
        // FreeAPI doesn't support tag filtering, so we'll get a random quote
        console.warn('Tag filtering not supported by FreeAPI, returning random quote');
        return this.getRandomQuote();
    },

    /**
     * Get quotes by author (Note: FreeAPI may not support author filtering)
     * Falls back to random quote
     */
    async getQuotesByAuthor(author: string): Promise<{ results: QuoteData[] }> {
        // FreeAPI doesn't support author filtering, so we'll get a random quote
        console.warn('Author filtering not supported by FreeAPI, returning random quote');
        const randomQuote = await this.getRandomQuote();
        return { results: [randomQuote] };
    },
};

/**
 * Background Images API Service
 */
export const backgroundAPI = {
    /**
     * Get random image from Unsplash
     */
    async getUnsplashImage(query: string = 'nature,landscape'): Promise<UnsplashImage> {
        const url = `${UNSPLASH.BASE_URL}/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&w=1920&h=1080`;
        return apiFetch<UnsplashImage>(url, {
            headers: {
                'Authorization': `Client-ID ${UNSPLASH.ACCESS_KEY}`,
            },
        });
    },

    /**
     * Search Unsplash images
     */
    async searchUnsplashImages(query: string, page: number = 1): Promise<{ results: UnsplashImage[] }> {
        const url = `${UNSPLASH.BASE_URL}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=10&orientation=landscape`;
        return apiFetch<{ results: UnsplashImage[] }>(url, {
            headers: {
                'Authorization': `Client-ID ${UNSPLASH.ACCESS_KEY}`,
            },
        });
    },

    /**
     * Get random image from Pexels
     */
    async getPexelsImage(query: string = 'nature'): Promise<{ photos: PexelsImage[] }> {
        const url = `${PEXELS.BASE_URL}/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
        return apiFetch<{ photos: PexelsImage[] }>(url, {
            headers: {
                'Authorization': PEXELS.API_KEY,
            },
        });
    },

    /**
     * Get curated photos from Pexels
     */
    async getPexelsCurated(page: number = 1): Promise<{ photos: PexelsImage[] }> {
        const url = `${PEXELS.BASE_URL}/curated?page=${page}&per_page=10`;
        return apiFetch<{ photos: PexelsImage[] }>(url, {
            headers: {
                'Authorization': PEXELS.API_KEY,
            },
        });
    },

    /**
     * Validate custom image URL
     */
    async validateImageUrl(url: string): Promise<boolean> {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            const contentType = response.headers.get('content-type');
            return response.ok && contentType?.startsWith('image/') === true;
        } catch {
            return false;
        }
    },
};

/**
 * Geolocation API Service
 */
export const locationAPI = {
    /**
     * Get user's current location
     */
    async getCurrentLocation(): Promise<GeolocationCoords> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    reject(new Error(`Geolocation error: ${error.message}`));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 600000, // 10 minutes
                }
            );
        });
    },

    /**
     * Get location by IP (fallback)
     */
    async getLocationByIP(): Promise<{ lat: number; lon: number; city: string; country: string }> {
        const url = `${IP_LOCATION.BASE_URL}/json/`;
        return apiFetch<{ latitude: number; longitude: number; city: string; country_name: string }>(url)
            .then(data => ({
                lat: data.latitude,
                lon: data.longitude,
                city: data.city,
                country: data.country_name,
            }));
    },
};

/**
 * Combined API service for common operations
 */
export const dashboardAPI = {
    /**
     * Initialize dashboard data
     */
    async initializeDashboard(useLocation: boolean = false): Promise<{
        weather?: WeatherData;
        quote: QuoteData;
        backgroundImage?: string;
    }> {
        try {
            const results = await Promise.allSettled([
                quotesAPI.getRandomQuote(),
                useLocation ? this.getWeatherWithLocation() : null,
            ]);

            const quote = results[0].status === 'fulfilled' ? results[0].value : DEFAULTS.QUOTE;

            const weather = results[1]?.status === 'fulfilled' ? results[1].value : undefined;

            return {
                quote,
                weather: weather || undefined,
            };
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            // Return fallback data
            return {
                quote: DEFAULTS.QUOTE,
            };
        }
    },

    /**
     * Get weather with automatic location detection
     */
    async getWeatherWithLocation(): Promise<WeatherData> {
        try {
            const coords = await locationAPI.getCurrentLocation();
            return await weatherAPI.getWeatherByCoords(coords.latitude, coords.longitude);
        } catch (error) {
            console.warn('Failed to get location, trying IP-based location');
            try {
                const ipLocation = await locationAPI.getLocationByIP();
                return await weatherAPI.getWeatherByCoords(ipLocation.lat, ipLocation.lon);
            } catch (ipError) {
                console.warn('IP location failed, using default city');
                return await weatherAPI.getWeatherByCity(DEFAULTS.CITY);
            }
        }
    },

    /**
     * Get background image based on source preference
     */
    async getBackgroundImage(source: 'unsplash' | 'pexels' | 'custom', customUrl?: string): Promise<string> {
        try {
            switch (source) {
                case 'unsplash':
                    const unsplashImg = await backgroundAPI.getUnsplashImage('nature,landscape,mountains');
                    return unsplashImg.urls.regular;

                case 'pexels':
                    const pexelsResult = await backgroundAPI.getPexelsImage('nature landscape');
                    return pexelsResult.photos[0]?.src.large || '';

                case 'custom':
                    if (customUrl && await backgroundAPI.validateImageUrl(customUrl)) {
                        return customUrl;
                    }
                    throw new Error('Invalid custom URL');

                default:
                    throw new Error('Invalid background source');
            }
        } catch (error) {
            console.error('Failed to get background image:', error);
            // Return a fallback gradient or default image
            return DEFAULTS.BACKGROUND_GRADIENT;
        }
    },
};

// Export default
export default {
    weather: weatherAPI,
    quotes: quotesAPI,
    background: backgroundAPI,
    location: locationAPI,
    dashboard: dashboardAPI,
};
