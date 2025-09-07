/**
 * API Configuration
 * Centralized configuration for all API keys and endpoints
 * 
 * IMPORTANT: In production, use environment variables instead of hardcoded keys
 */

export const API_CONFIG = {
    // Weather API - Get your free key from https://www.weatherapi.com/
    WEATHER: {
        KEY: process.env.NEXT_PUBLIC_WEATHER_API_KEY || 'demo-key',
        BASE_URL: 'https://api.weatherapi.com/v1',
    },

    // Unsplash API - Get your free key from https://unsplash.com/developers
    UNSPLASH: {
        ACCESS_KEY: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || 'demo-key',
        BASE_URL: 'https://api.unsplash.com',
    },

    // Pexels API - Get your free key from https://www.pexels.com/api/
    PEXELS: {
        API_KEY: process.env.NEXT_PUBLIC_PEXELS_API_KEY || 'demo-key',
        BASE_URL: 'https://api.pexels.com/v1',
    },

    // FreeAPI Quotes - No key required (free)
    QUOTES: {
        BASE_URL: 'https://api.freeapi.app/api/v1/public/quotes',
    },

    // IP Geolocation API - No key required (free tier)
    IP_LOCATION: {
        BASE_URL: 'https://ipapi.co',
    },

    // Request timeouts (in milliseconds)
    TIMEOUTS: {
        DEFAULT: 10000, // 10 seconds
        GEOLOCATION: 15000, // 15 seconds
        IMAGE_VALIDATION: 5000, // 5 seconds
    },

    // Rate limiting (requests per minute)
    RATE_LIMITS: {
        WEATHER: 100,
        UNSPLASH: 50,
        PEXELS: 200,
        QUOTES: 100,
    },

    // Default fallback values
    DEFAULTS: {
        CITY: 'New York',
        QUOTE: {
            content: "The only way to do great work is to love what you do.",
            author: "Steve Jobs",
            tags: ["inspirational"],
        },
        BACKGROUND_GRADIENT: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
};

/**
 * Environment check
 */
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * API key validation
 */
export const validateApiKeys = () => {
    const warnings: string[] = [];

    if (API_CONFIG.WEATHER.KEY === 'demo-key') {
        warnings.push('Weather API key is not configured. Weather features may not work.');
    }

    if (API_CONFIG.UNSPLASH.ACCESS_KEY === 'demo-key') {
        warnings.push('Unsplash API key is not configured. Background images from Unsplash may not work.');
    }

    if (API_CONFIG.PEXELS.API_KEY === 'demo-key') {
        warnings.push('Pexels API key is not configured. Background images from Pexels may not work.');
    }

    if (isDevelopment && warnings.length > 0) {
        console.warn('API Configuration Warnings:');
        warnings.forEach(warning => console.warn(`- ${warning}`));
        console.warn('To set up API keys, create a .env.local file with your API keys.');
    }

    return warnings;
};

export default API_CONFIG;
