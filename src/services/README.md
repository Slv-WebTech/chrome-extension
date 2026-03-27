# API Service Documentation

## Project Summary

This project is a Chrome extension productivity dashboard built with Next.js that includes weather, quotes, todos, and dynamic background preferences powered by a centralized service layer and Redux state.

For full app overview, setup, and deployment instructions, see the root README.

This directory contains a centralized API service for handling all external API calls in the Chrome Extension Dashboard.

## Files Overview

- **`api.ts`** - Main API service with all API integration methods
- **`config.ts`** - Configuration and API keys management
- **`hooks.ts`** - React hooks for easy component integration
- **`.env.local`** - Local environment file for API keys (create this file in project root)

## Quick Start

### 1. Set up API Keys

1. Create a `.env.local` file in the project root
2. Fill in your API keys:

```bash
# Weather API - Get your free key from https://www.weatherapi.com/
NEXT_PUBLIC_WEATHER_API_KEY=your_weather_api_key_here

# Unsplash API - Get your free key from https://unsplash.com/developers
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here

# Pexels API - Get your free key from https://www.pexels.com/api/
NEXT_PUBLIC_PEXELS_API_KEY=your_pexels_api_key_here
```

### 2. Using in Components

#### Method 1: Using Hooks (Recommended)

```tsx
import { useWeather, useQuote, useBackgroundImage } from "../services/hooks";

function MyComponent() {
  const { weather, loading: weatherLoading } = useWeather(true); // Use location
  const { quote, refetch: getNewQuote } = useQuote();
  const { imageUrl } = useBackgroundImage("unsplash");

  return (
    <div>
      {weatherLoading ? "Loading..." : weather?.current.temp_c}
      <p>{quote?.content}</p>
      <button onClick={getNewQuote}>New Quote</button>
    </div>
  );
}
```

#### Method 2: Direct API Calls

```tsx
import apiService from "../services/api";

async function fetchData() {
  try {
    const weather = await apiService.weather.getWeatherByCity("London");
    const quote = await apiService.quotes.getRandomQuote();
    const backgroundUrl = await apiService.dashboard.getBackgroundImage("unsplash");

    console.log(weather, quote, backgroundUrl);
  } catch (error) {
    console.error("API Error:", error);
  }
}
```

## Available APIs

### Weather API

- `getWeatherByCoords(lat, lon)` - Get weather by coordinates
- `getWeatherByCity(city)` - Get weather by city name
- `getForecast(location, days)` - Get weather forecast

### Quotes API (FreeAPI)

- `getRandomQuote()` - Get random inspirational quote from FreeAPI
- `getQuoteByTag(tag)` - Get quote by specific tag (falls back to random)
- `getQuotesByAuthor(author)` - Get quotes by author (falls back to random)

**Note**: The FreeAPI quotes service (https://api.freeapi.app) provides high-quality random quotes but doesn't support filtering by tags or authors. Tag and author methods will fall back to random quotes with appropriate warnings.

### Background Images API

- `getUnsplashImage(query)` - Get random image from Unsplash
- `searchUnsplashImages(query, page)` - Search Unsplash images
- `getPexelsImage(query)` - Get random image from Pexels
- `getPexelsCurated(page)` - Get curated Pexels images
- `validateImageUrl(url)` - Validate custom image URL

### Location API

- `getCurrentLocation()` - Get user's GPS location
- `getLocationByIP()` - Get location by IP address (fallback)

### Dashboard API (Combined)

- `initializeDashboard(useLocation)` - Initialize all dashboard data
- `getWeatherWithLocation()` - Get weather with auto location detection
- `getBackgroundImage(source, customUrl)` - Get background based on source preference

## Available Hooks

### `useWeather(useLocation, city)`

Returns: `{ weather, loading, error, refetch }`

### `useQuote()`

Returns: `{ quote, loading, error, refetch }`

### `useBackgroundImage(source, customUrl)`

Returns: `{ imageUrl, loading, error, refetch }`

### `useGeolocation()`

Returns: `{ location, loading, error, getCurrentLocation }`

### `useDashboard(useLocation)`

Returns: `{ data, loading, error, refetch }`

### `useImageValidation()`

Returns: `{ validateImageUrl, isValidating }`

## Error Handling

All API calls include comprehensive error handling:

- Network errors are caught and logged
- Fallback data is provided for critical features
- Invalid API keys are detected and warned about
- Rate limiting is considered for each API

## API Key Setup Guide

### WeatherAPI.com

1. Visit https://www.weatherapi.com/
2. Sign up for free account
3. Get your API key from dashboard
4. Add to `.env.local` as `NEXT_PUBLIC_WEATHER_API_KEY`

### Unsplash API

1. Visit https://unsplash.com/developers
2. Create a new application
3. Get your Access Key
4. Add to `.env.local` as `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY`

### Pexels API

1. Visit https://www.pexels.com/api/
2. Sign up and create API key
3. Add to `.env.local` as `NEXT_PUBLIC_PEXELS_API_KEY`

## Best Practices

1. **Always handle errors** - Use try/catch or the provided hooks
2. **Use environment variables** - Never commit API keys to version control
3. **Implement loading states** - Provide user feedback during API calls
4. **Cache when appropriate** - Consider implementing caching for frequently accessed data
5. **Respect rate limits** - Each API has different rate limiting rules

## Development vs Production

- Development: API keys can be demo keys, warnings will be shown
- Production: All API keys must be properly configured
- The config automatically detects environment and provides appropriate feedback

## Extending the API Service

To add a new API:

1. Add configuration to `config.ts`
2. Create API methods in `api.ts`
3. Add corresponding hooks in `hooks.ts`
4. Update this documentation

Example:

```typescript
// In config.ts
NEW_API: {
  KEY: process.env.NEXT_PUBLIC_NEW_API_KEY || 'demo-key',
  BASE_URL: 'https://api.example.com',
},

// In api.ts
export const newAPI = {
  async getData(): Promise<SomeType> {
    const url = `${NEW_API.BASE_URL}/data`;
    return apiFetch<SomeType>(url, {
      headers: { 'Authorization': `Bearer ${NEW_API.KEY}` }
    });
  },
};

// In hooks.ts
export function useNewAPI() {
  // Implementation
}
```
