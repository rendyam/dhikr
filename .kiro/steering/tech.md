# Tech Stack

> This file reflects the planned stack based on the spec. Update it once implementation begins and actual tooling is confirmed.

## Framework

**React Native** (with **Expo**) — targets Android, iOS, and Web from a single codebase.

- `expo` — managed workflow, OTA updates, and build tooling
- `react-native-web` — renders the React Native component tree in the browser
- PWA support via Expo's web output (`expo export:web`) with a custom service worker

## Language

**TypeScript** — strict mode enabled across the entire codebase.

## Navigation

**React Navigation** (`@react-navigation/native`) — stack and tab navigators following platform conventions.

## State Management

**Zustand** — lightweight global state for session counter, favorites, and user preferences.

## Local Storage / Persistence

**expo-sqlite** or **WatermelonDB** — stores the bundled content database and persists user data (favorites, settings) locally on device and in IndexedDB on web.

## Content Database

- Adhkar content is bundled as a static SQLite database shipped with the app
- No network requests required for content access

## Styling

**StyleSheet API** (React Native) with a shared design token file for colors, spacing, and typography. No CSS-in-JS library.

## Internationalization

**i18next** + **react-i18next** — handles UI strings and dhikr translations. RTL layout toggled via `I18nManager` (React Native) and CSS `dir="rtl"` (web).

## Testing

- **Jest** — unit and integration tests
- **React Native Testing Library** — component tests
- **Detox** — end-to-end tests on Android and iOS simulators
- **Playwright** — end-to-end tests for the web build

## Linting & Formatting

- **ESLint** with `@typescript-eslint` and `eslint-plugin-react-native`
- **Prettier** for consistent formatting

## Build & CI

- **EAS Build** (Expo Application Services) — cloud builds for Android (`.apk`/`.aab`) and iOS (`.ipa`)
- **EAS Submit** — app store submission
- `expo export:web` — static web build output

## Common Commands

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on Android emulator
npx expo run:android

# Run on iOS simulator
npx expo run:ios

# Run web in browser
npx expo start --web

# Build for web (static export)
npx expo export:web

# Run unit tests (single pass)
npx jest --runInBand

# Run linter
npx eslint . --ext .ts,.tsx

# Format code
npx prettier --write .

# EAS cloud build (Android)
eas build --platform android

# EAS cloud build (iOS)
eas build --platform ios
```
