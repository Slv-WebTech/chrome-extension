# Daily Boost - Chrome Extension

<p align="center">
  <strong>Daily motivational quotes and weather updates in a Chrome extension</strong>
  <br />
  Built with React (Create React App), Chakra UI and Chrome Manifest V3.
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-18-149eca" />
  <img alt="Create React App" src="https://img.shields.io/badge/Create%20React%20App-react--scripts-09d3ac" />
  <img alt="Chakra UI" src="https://img.shields.io/badge/Chakra%20UI-3-319795" />
  <img alt="Manifest V3" src="https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4" />
</p>

## Overview

Daily Boost ("Daily Boost - Motivation & Weather") is a Chrome extension that shows a motivational quote and the current weather for your location in a modern glassmorphism-style interface. It opens from the extension icon (popup) and is configured through a Settings modal.

## Features

- Daily motivational quotes
- Weather updates for your location (OpenWeatherMap API, browser geolocation)
- Automatic data refresh
- Settings modal to configure your OpenWeatherMap API key and preferences (stored with the Chrome storage API)
- Glassmorphism UI built with Chakra UI components

## Tech Stack

- React 18, bootstrapped with Create React App (react-scripts)
- Chakra UI v3 (with Emotion and Framer Motion)
- Chrome Extension, Manifest V3 (service worker background script, `storage` and `geolocation` permissions)
- OpenWeatherMap and Quotable HTTP APIs

## Prerequisites

- Node.js and npm
- A free OpenWeatherMap API key (entered in the extension Settings, no `.env` file needed)

## Commands

| Command | Description |
| --- | --- |
| `npm start` | Start the Create React App development server |
| `npm run build` | Production build, then run the post-build script (`scripts/post-build.js`) |
| `npm run build-extension` | Build the extension into the `build` folder |
| `npm test` | Run the Create React App test runner |

## Load as a Chrome Extension

1. Install dependencies: `npm install`
2. Build the extension: `npm run build`
3. Open `chrome://extensions/` and enable **Developer mode**
4. Click **Load unpacked** and select the `build` folder
5. Click the extension icon, open **Settings**, enter your OpenWeatherMap API key and click **Save API Key**

See [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) for the same steps in more detail.

## Project Structure

```
public/
  manifest.json        Chrome extension manifest (Manifest V3)
  background.js        Service worker
  index.html           Popup HTML
src/
  App.js               Main application
  ApiServices/Api.js   API service layer (weather, quotes, storage)
  Components/          Header, GlassCard, QuoteWidget, WeatherWidget, Settings, Home
scripts/
  post-build.js        Post-build step for the extension build
```

## License

No explicit license file is currently included.
