# Project Structure

> This reflects the planned structure based on the spec. Update as the codebase evolves.

```
muslim-dhikr-app/
├── app/                        # Expo Router screens (file-based routing)
│   ├── (tabs)/                 # Bottom tab navigator
│   │   ├── index.tsx           # Home screen — category list + favorites shortcut
│   │   ├── favorites.tsx       # Favorites list screen
│   │   └── search.tsx          # Search screen
│   ├── category/
│   │   └── [id].tsx            # Category detail — dhikr list
│   ├── dhikr/
│   │   └── [id].tsx            # Dhikr detail view
│   ├── session/
│   │   └── [categoryId].tsx    # Guided session screen with counter
│   └── settings.tsx            # Settings (language, text size, transliteration)
│
├── src/
│   ├── components/             # Shared UI components
│   │   ├── DhikrCard.tsx
│   │   ├── Counter.tsx
│   │   ├── SourceBadge.tsx
│   │   └── ...
│   ├── store/                  # Zustand stores
│   │   ├── sessionStore.ts     # Active session state and counter
│   │   ├── favoritesStore.ts   # Favorites list
│   │   └── settingsStore.ts    # User preferences (language, text size)
│   ├── db/                     # Database access layer
│   │   ├── client.ts           # expo-sqlite connection setup
│   │   ├── queries.ts          # Typed query functions (categories, dhikr, search)
│   │   └── seed/               # Bundled SQLite database file and seed scripts
│   │       └── adhkar.db
│   ├── i18n/                   # Internationalization
│   │   ├── index.ts            # i18next setup and language detection
│   │   └── locales/
│   │       ├── en.json
│   │       └── ...             # Additional language files
│   ├── theme/                  # Design tokens
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   ├── hooks/                  # Custom React hooks
│   └── utils/                  # Pure utility functions
│
├── assets/                     # Static assets (fonts, images, icons)
│   └── fonts/                  # Arabic font files (e.g., Amiri, Scheherazade)
│
├── web/                        # Web-only files
│   ├── service-worker.ts       # PWA service worker
│   └── manifest.json           # Web app manifest
│
├── __tests__/                  # Jest unit and integration tests (mirrors src/)
├── e2e/                        # Detox (mobile) and Playwright (web) E2E tests
│
├── app.json                    # Expo app configuration
├── eas.json                    # EAS Build profiles
├── tsconfig.json               # TypeScript config (strict mode)
├── .eslintrc.js
├── .prettierrc
└── package.json
```

## Key Conventions

- **Screens** live in `app/` using Expo Router file-based routing. Keep screen files thin — delegate logic to hooks and stores.
- **Components** in `src/components/` are platform-agnostic unless suffixed `.native.tsx` or `.web.tsx` for platform splits.
- **Database queries** are isolated in `src/db/queries.ts`. No raw SQL outside this file.
- **State** is managed in Zustand stores under `src/store/`. Stores are persisted via `zustand/middleware` (`persist`) using AsyncStorage (mobile) or localStorage (web).
- **Translations** for UI strings live in `src/i18n/locales/`. Dhikr translations are stored in the SQLite database, not in i18n files.
- **Arabic font** must be loaded via `expo-font` before any Arabic text renders. Use a loading gate at the app root.
- **RTL** — always use `I18nManager.isRTL` for conditional layout logic; never hardcode `left`/`right` directional values.
- **No network calls** for content — all adhkar data is read from the bundled `adhkar.db` file.
