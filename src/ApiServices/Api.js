// src/ApiServices/Api.js - Chrome Extension API Services
console.log('API Services loaded');

// Chrome Extension API service for quotes and weather
export const chromeExtensionApi = {
   // Get current quote from Chrome storage
   async getCurrentQuote() {
      try {
         const result = await new Promise((resolve) => {
            chrome.storage.local.get(['currentQuote', 'quoteAuthor'], resolve);
         });

         return {
            quote: result.currentQuote || 'Stay positive and keep moving forward!',
            author: result.quoteAuthor || 'Unknown'
         };
      } catch (error) {
         console.error('Error getting quote from storage:', error);
         return {
            quote: 'Believe in yourself and all that you are.',
            author: 'Unknown'
         };
      }
   },

   // Get current weather from Chrome storage
   async getCurrentWeather() {
      try {
         const result = await new Promise((resolve) => {
            chrome.storage.local.get(['currentWeather'], resolve);
         });

         return result.currentWeather || {
            city: 'Unknown',
            temp: '--',
            description: 'Weather unavailable',
            icon: '01d',
            humidity: '--',
            windSpeed: '--'
         };
      } catch (error) {
         console.error('Error getting weather from storage:', error);
         return {
            city: 'Unknown',
            temp: '--',
            description: 'Weather unavailable',
            icon: '01d',
            humidity: '--',
            windSpeed: '--'
         };
      }
   },

   // Refresh quote (trigger background script to fetch new quote)
   async refreshQuote() {
      try {
         // Send message to background script to fetch new quote
         await chrome.runtime.sendMessage({ action: 'fetchQuote' });

         // Wait a moment for the background script to update storage
         setTimeout(async () => {
            return await this.getCurrentQuote();
         }, 1000);
      } catch (error) {
         console.error('Error refreshing quote:', error);
         return await this.getCurrentQuote();
      }
   },

   // Refresh weather (trigger background script to fetch new weather)
   async refreshWeather() {
      try {
         // Send message to background script to fetch new weather
         await chrome.runtime.sendMessage({ action: 'fetchWeather' });

         // Wait a moment for the background script to update storage
         setTimeout(async () => {
            return await this.getCurrentWeather();
         }, 1000);
      } catch (error) {
         console.error('Error refreshing weather:', error);
         return await this.getCurrentWeather();
      }
   },

   // Set weather API key
   async setWeatherApiKey(apiKey) {
      try {
         await new Promise((resolve) => {
            chrome.storage.sync.set({ weatherApiKey: apiKey }, resolve);
         });
         console.log('Weather API key saved');
         return true;
      } catch (error) {
         console.error('Error saving API key:', error);
         return false;
      }
   },

   // Get settings
   async getSettings() {
      try {
         const result = await new Promise((resolve) => {
            chrome.storage.sync.get(['weatherApiKey', 'userLocation'], resolve);
         });

         return {
            weatherApiKey: result.weatherApiKey || '',
            userLocation: result.userLocation || null
         };
      } catch (error) {
         console.error('Error getting settings:', error);
         return {
            weatherApiKey: '',
            userLocation: null
         };
      }
   }
};

// Fallback API for development/testing (when not in extension context)
export const fallbackApi = {
   async getCurrentQuote() {
      const fallbackQuotes = [
         { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
         { quote: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
         { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
         { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
         { quote: "Believe in yourself and all that you are.", author: "Unknown" }
      ];

      const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
      return randomQuote;
   },

   async getCurrentWeather() {
      return {
         city: 'Demo City',
         temp: 22,
         description: 'partly cloudy',
         icon: '02d',
         humidity: 65,
         windSpeed: 3.5
      };
   },

   async refreshQuote() {
      return await this.getCurrentQuote();
   },

   async refreshWeather() {
      return await this.getCurrentWeather();
   }
};

// Export the appropriate API based on context
export const apiService = (typeof chrome !== 'undefined' && chrome.storage)
   ? chromeExtensionApi
   : fallbackApi;

// Legacy exports for backward compatibility
export const fetchQuote = async () => {
   const result = await apiService.getCurrentQuote();
   return result.quote;
};

export const fetchWeather = async (city = '') => {
   const result = await apiService.getCurrentWeather();
   return { city: result.city, temp: result.temp };
};
