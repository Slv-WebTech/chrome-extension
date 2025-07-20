# Chrome Extension Build Instructions

## Building Your Daily Boost Chrome Extension

### Prerequisites

1. Node.js installed on your system
2. OpenWeatherMap API key (free at openweathermap.org)

### Build Steps

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Build the Extension**

   ```bash
   npm run build
   ```

3. **Load Extension in Chrome**
   - Open Chrome browser
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `build` folder from your project

### Setting Up Weather API

1. Get your free API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Click the extension icon in Chrome
3. Click "Settings" button
4. Enter your API key in the Weather API Key field
5. Click "Save API Key"

### Features

✨ **Daily Motivational Quotes** - Fresh inspiration every day
🌤️ **Weather Updates** - Current weather for your location
🔄 **Auto Refresh** - Data updates automatically
⚙️ **Settings** - Configure your API key and preferences
🎨 **Beautiful Design** - Modern glassmorphism UI

### Extension Structure

```
chrome-extension/
├── public/
│   ├── manifest.json      # Chrome extension manifest
│   ├── background.js      # Service worker
│   └── index.html         # Popup HTML
├── src/
│   ├── Components/
│   │   ├── Header.js      # Dramatic header component
│   │   ├── GlassCard.js   # Main glass card component
│   │   ├── QuoteWidget.js # Quote display widget
│   │   ├── WeatherWidget.js # Weather display widget
│   │   └── Settings.js    # Settings modal
│   ├── ApiServices/
│   │   └── Api.js         # API service layer
│   └── App.js             # Main application
└── build/                 # Built extension (after npm run build)
```

### Permissions

The extension requests these permissions:

- `storage` - To save settings and cache data
- `geolocation` - To get your location for weather
- `host_permissions` - To fetch quotes and weather data

### Troubleshooting

**No weather data showing?**

- Make sure you've entered a valid OpenWeatherMap API key
- Check that location permissions are enabled

**Quotes not loading?**

- The extension uses quotable.io which is free and doesn't require an API key
- Check your internet connection

**Extension not loading?**

- Make sure you've run `npm run build` first
- Check Chrome developer console for errors

### Development

To modify the extension:

1. Make changes to files in `src/`
2. Run `npm run build`
3. Click refresh button in Chrome extensions page
4. Test your changes

### Publishing

To publish to Chrome Web Store:

1. Create a developer account at Chrome Web Store
2. Package your `build` folder as a ZIP file
3. Upload through the developer dashboard
4. Fill out store listing details
5. Submit for review

Enjoy your Daily Boost extension! 🚀
