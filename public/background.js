// Background service worker for Chrome Extension
console.log('Daily Boost Extension - Background script loaded');

// Install event - runs when extension is first installed
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed:', details);

    // Set default settings
    chrome.storage.sync.set({
        weatherApiKey: '', // User will need to add their own API key
        lastQuoteUpdate: 0,
        lastWeatherUpdate: 0,
        userLocation: null
    });
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    console.log('Extension icon clicked');
});

// Function to fetch motivational quote
async function fetchMotivationalQuote() {
    try {
        const response = await fetch('https://api.quotable.io/random?tags=motivational,inspirational');
        const data = await response.json();

        if (data.content) {
            await chrome.storage.local.set({
                currentQuote: data.content,
                quoteAuthor: data.author,
                lastQuoteUpdate: Date.now()
            });
            console.log('Quote updated:', data.content);
        }
    } catch (error) {
        console.error('Error fetching quote:', error);
        // Fallback quotes
        const fallbackQuotes = [
            "The only way to do great work is to love what you do. - Steve Jobs",
            "Innovation distinguishes between a leader and a follower. - Steve Jobs",
            "Your time is limited, don't waste it living someone else's life. - Steve Jobs",
            "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
            "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt"
        ];

        const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
        const [content, author] = randomQuote.split(' - ');

        await chrome.storage.local.set({
            currentQuote: content,
            quoteAuthor: author,
            lastQuoteUpdate: Date.now()
        });
    }
}

// Function to fetch weather data
async function fetchWeatherData() {
    try {
        // Get stored API key and location
        const result = await chrome.storage.sync.get(['weatherApiKey', 'userLocation']);

        if (!result.weatherApiKey) {
            console.log('No weather API key found');
            return;
        }

        let lat, lon;

        if (result.userLocation) {
            lat = result.userLocation.lat;
            lon = result.userLocation.lon;
        } else {
            // Try to get user's location
            if (navigator.geolocation) {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });

                lat = position.coords.latitude;
                lon = position.coords.longitude;

                // Store location for future use
                await chrome.storage.sync.set({
                    userLocation: { lat, lon }
                });
            } else {
                // Default to New York if geolocation fails
                lat = 40.7128;
                lon = -74.0060;
            }
        }

        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${result.weatherApiKey}&units=metric`
        );

        const data = await response.json();

        if (data.main) {
            await chrome.storage.local.set({
                currentWeather: {
                    city: data.name,
                    temp: Math.round(data.main.temp),
                    description: data.weather[0].description,
                    icon: data.weather[0].icon,
                    humidity: data.main.humidity,
                    windSpeed: data.wind.speed
                },
                lastWeatherUpdate: Date.now()
            });
            console.log('Weather updated:', data.name, data.main.temp + '°C');
        }
    } catch (error) {
        console.error('Error fetching weather:', error);
        // Set fallback weather data
        await chrome.storage.local.set({
            currentWeather: {
                city: 'Unknown',
                temp: '--',
                description: 'Weather unavailable',
                icon: '01d',
                humidity: '--',
                windSpeed: '--'
            },
            lastWeatherUpdate: Date.now()
        });
    }
}

// Update data on extension startup
chrome.runtime.onStartup.addListener(async () => {
    console.log('Extension started');
    await fetchMotivationalQuote();
    await fetchWeatherData();
});

// Handle messages from popup/content scripts
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    console.log('Message received:', request);

    try {
        switch (request.action) {
            case 'fetchQuote':
                await fetchMotivationalQuote();
                sendResponse({ success: true });
                break;

            case 'fetchWeather':
                await fetchWeatherData();
                sendResponse({ success: true });
                break;

            case 'refreshAll':
                await Promise.all([fetchMotivationalQuote(), fetchWeatherData()]);
                sendResponse({ success: true });
                break;

            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    } catch (error) {
        console.error('Error handling message:', error);
        sendResponse({ success: false, error: error.message });
    }

    return true; // Keep message channel open for async response
});

// Update data periodically (every 30 minutes for weather, every 2 hours for quotes)
setInterval(fetchWeatherData, 30 * 60 * 1000); // 30 minutes
setInterval(fetchMotivationalQuote, 2 * 60 * 60 * 1000); // 2 hours

// Initial data fetch
fetchMotivationalQuote();
fetchWeatherData();
