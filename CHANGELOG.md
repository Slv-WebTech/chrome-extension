# Changelog

All notable changes are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).

## [2.0.0] — 2026-11-23

First production-ready release. One consolidated branch (`main`) replaces `master`, `Next.js` and `Next-new-version`.

### Added
- Premium glassmorphism UI with polished light/dark themes (system-aware), six accent colours, seven offline gradient backgrounds and reduced-motion support.
- Search bar with engine selector (11 engines + custom template), `!bang` prefixes, direct-URL detection and optional recent searches.
- Quick-links shortcuts (add / edit / remove / reorder).
- Weather: hourly strip, 5-day forecast, °C/°F, km/h/mph/m·s⁻¹, city search, "Locate me", cached with offline fallback. Open-Meteo is the keyless default; OpenWeather is an optional provider.
- Tasks: priorities (inline `!high`), filters, sorting, inline editing, undo delete, progress.
- Pomodoro focus timer with configurable phases, auto-start, chime, daily stats, tab-title countdown and optional notifications through a tiny MV3 service worker (`alarms` + optional `notifications`).
- Scratchpad notes with autosave.
- Command palette (`Ctrl/⌘ K`) and single-key keyboard shortcuts (can be disabled).
- Settings drawer and full-page Options; backup/restore as JSON (API keys excluded by default).
- Toolbar popup with the compact quote + weather view from the legacy "Daily Boost" popup, plus quick tasks and the timer.
- Cross-context sync between the popup and all open tabs.
- 60+ bundled quotes (offline) with optional online source.
- Optional Unsplash / Pexels photo backgrounds using the user's own key; image URL and local image upload.
- Test suite: 51 Vitest unit/component tests and 14 Playwright end-to-end tests (plus an optional live-network check) (load-unpacked smoke test, persistence, import/export, axe accessibility in both themes).
- Cross-platform build tooling: `postbuild-extension.mjs`, `validate-extension.mjs`, `package-extension.mjs`, icon generator; CI and GitHub Pages workflows.

### Changed
- Extension manifest: all four icon sizes (16/32/48/128), `action` popup, options page, service worker, strict CSP with explicit `connect-src`; required permissions reduced to `storage` + `alarms` (was `storage`, `geolocation` and seven host permissions).
- State management rewritten on Redux Toolkit with a purpose-built persistence layer (replaces `redux-persist`) and input sanitising.
- Fonts are bundled (Geist) instead of downloaded at build time; removed the unused UI-kit components and dozens of unused dependencies (smaller, faster new tab).
- Package manager standardised on pnpm; PowerShell build scripts replaced by cross-platform Node scripts.
- README, project descriptions and screenshots refreshed.

### Removed
- Duplicate `components/` tree, `App.tsx` and other leftovers from the first Next.js scaffold.
- Silent IP-geolocation fallback (`ipapi.co`) — location is now only used when the user asks.
- The obsolete `newtab.html` / `newtab.js` redirect wrapper.
- The old Pages workflow that injected API-key secrets into the public bundle.

### Security
- API keys are no longer compiled into the JavaScript bundle (`NEXT_PUBLIC_*`); they are optional, user-supplied and kept in `chrome.storage.local` only. **If you used the previous hosted demo, rotate any OpenWeather/Unsplash/Pexels keys that were configured as repository secrets.**
- Imported backups and stored data are validated and sanitised (URL schemes, lengths, enums).

### Legacy
- The Create React App + Chakra UI "Daily Boost" popup (`master`, v1.0.0) is preserved as tag `archive/master-197030e`; its features live on in the new popup.

## [1.0.0] — 2026-04
- Next.js new-tab dashboard: weather with geolocation, to-do list, quote banner, Unsplash/Pexels backgrounds, settings modal (tag `archive/Next-new-version-c1d3d69`).
