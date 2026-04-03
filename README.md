# Chrome Extension Dashboard UI

## Project Summary

A Chrome extension productivity dashboard (new-tab style UI) built with Next.js that combines weather, quotes, todos, and dynamic backgrounds with user preferences managed through Redux and external API integrations.

A customizable Chrome extension dashboard UI built with Next.js, TypeScript, Redux Toolkit, and Tailwind CSS.

The app includes:

- Weather widget with city search or current location
- Inspirational quote section
- Todo list
- Dynamic background image source selection (Unsplash, Pexels, or custom URL)
- Theme and preference settings persisted in app state

## Tech Stack

- Next.js 16 (App Router + Turbopack)
- React 19
- TypeScript
- Redux Toolkit + React Redux + redux-persist
- Tailwind CSS
- Radix UI primitives and related UI libraries

## Prerequisites

- Node.js 20+
- pnpm 10+

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create a .env.local file in the project root and add your API keys:

```bash
NEXT_PUBLIC_WEATHER_API_KEY=your_openweather_key
NEXT_PUBLIC_WEATHER_BASE_URL=https://api.openweathermap.org/data/2.5

NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_access_key
NEXT_PUBLIC_PEXELS_API_KEY=your_pexels_api_key
```

Notes:

- If keys are missing, parts of the app may fall back to demo behavior or show warnings.
- Quotes and IP-based location APIs are configured without keys in current defaults.

## API Key Matrix

| Variable                        | Purpose                               | Required                            | Default/Fallback                        |
| ------------------------------- | ------------------------------------- | ----------------------------------- | --------------------------------------- |
| NEXT_PUBLIC_WEATHER_API_KEY     | OpenWeather current weather API       | Yes (for weather feature)           | demo-key (weather may fail)             |
| NEXT_PUBLIC_WEATHER_BASE_URL    | Weather API base URL                  | No                                  | https://api.openweathermap.org/data/2.5 |
| NEXT_PUBLIC_UNSPLASH_ACCESS_KEY | Unsplash random/search photos         | Optional (if using Unsplash source) | demo-key (may fail)                     |
| NEXT_PUBLIC_PEXELS_API_KEY      | Pexels image search/curated photos    | Optional (if using Pexels source)   | demo-key (may fail)                     |
| WEATHER_KEY                     | Server-side fallback weather key      | Optional                            | demo-key                                |
| WEATHER_BASE_URL                | Server-side fallback weather base URL | Optional                            | OpenWeather default                     |

Recommendation:

- For a fully working dashboard, set at least NEXT_PUBLIC_WEATHER_API_KEY and one image provider key.

## Run Locally

Start development server:

```bash
pnpm dev
```

Default local URL:

- http://localhost:5000

## Build and Start

Create production build:

```bash
pnpm build
```

Start production server:

```bash
pnpm start
```

If `pnpm start` is showing old UI changes, run a fresh production build + start:

```bash
pnpm run start:fresh
```

## Chrome Extension Usage

### Development Mode

1. Run the UI locally:

```bash
pnpm dev
```

2. Use this local URL while developing extension UI behavior:

- http://localhost:5000

### Load as Extension

This repository includes a Manifest V3 file at `public/manifest.json` and supports static export for unpacked extension testing.

1. Build static extension output:

```bash
pnpm run extension:build
```

2. Open `chrome://extensions`
3. Enable Developer mode
4. Click `Load unpacked`
5. Select the `out` folder from this repo

The extension overrides Chrome new tab using `index.html` from the exported output.

### Create ZIP Package (Sharing/Testing)

```bash
pnpm run extension:zip
```

Generated package:

- `release/chrome-extension.zip`

### GitHub Pages (SSG)

A workflow is included at `.github/workflows/deploy-pages.yml`.

1. In GitHub repository settings, open `Pages`
2. Set `Build and deployment` source to `GitHub Actions`
3. Push to `master` or `Next-new-version`

The workflow builds with static export and deploys the `out` folder to GitHub Pages.

## Scripts

- pnpm dev: Start local dev server on port 5000 using Turbopack
- pnpm build: Production build
- pnpm start: Start production server
- pnpm start:fresh: Rebuild and start production server
- pnpm build:static: Build with static-export config (used by extension/pages workflows)
- pnpm extension:build: Build extension-ready static output into `out`
- pnpm extension:zip: Build static output and create `release/chrome-extension.zip`

## Project Structure

- src/app: App Router layout, page, and global styling
- src/components: Dashboard features and UI components
- src/components/ui: Reusable UI primitives/components
- src/services: API clients, config, and hooks
- src/store: Redux store, provider, and slices
- public: Static assets

## Screenshots / Demo

Add visuals to make onboarding easier for contributors and reviewers:

- Place images in public/screenshots/.
- Recommended assets:
  - public/screenshots/home-light.png
  - public/screenshots/home-dark.png
  - public/screenshots/settings-modal.png
  - public/screenshots/demo.gif

Markdown snippet:

```md
![Home Light](public/screenshots/home-light.png)
![Home Dark](public/screenshots/home-dark.png)
![Settings](public/screenshots/settings-modal.png)

![Dashboard Demo](public/screenshots/demo.gif)
```

## Core Feature Flow

1. User preferences are read from Redux state.
2. Weather data is fetched by geolocation or searched city.
3. Quote and background data are fetched via service layer APIs.
4. UI reacts to settings changes (theme, background source, temperature unit).

## Configuration

API and fallback behavior are centralized in:

- src/services/config.ts
- src/services/api.ts

You can tune:

- API endpoints
- Timeout and rate-limit constants
- Default fallback values

## Troubleshooting

- Module not found errors:
  Run pnpm install and ensure import paths do not include pinned versions in source code.
- API key warnings in console:
  Verify .env.local values and restart dev server.
- Weather not loading:
  Confirm OpenWeather key is valid and location permissions are granted if using current location.
- Extension not visible in chrome://extensions:
  Ensure your extension wrapper contains a valid manifest.json and correct paths to the built UI.

## License

This project is intended for internal/demo use unless a separate license is added.
