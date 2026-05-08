# Design Document: Muslim Dhikr App

## Overview

The Muslim Dhikr App is a cross-platform application built with React Native + Expo (managed workflow) targeting Android, iOS, and Web (PWA). It delivers a fully offline-capable library of authentic adhkar with guided session support, daily check-in streaks, push notifications, Google Sign-In, and a personal to-do list — all from a single TypeScript codebase.

### Design Goals

- **Offline-first**: All dhikr content is bundled in a local SQLite database (`adhkar.db`). No network call is ever required to read content.
- **Cross-platform parity**: A single React Native codebase renders on Android, iOS, and Web via `react-native-web`. Platform-specific splits are limited to notification delivery and service worker registration.
- **Separation of concerns**: Screens are thin; business logic lives in Zustand stores and custom hooks; data access is isolated in `src/db/queries.ts`.
- **Authenticated sync is additive**: All core features work for Guest Users. Firebase Auth and Firestore are layered on top for sync — they never gate content access.
- **RTL-safe**: All layout uses logical properties or `I18nManager.isRTL` checks. No hardcoded `left`/`right` directional values.

---

## Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Native / Expo                       │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Expo Router │  │   Zustand    │  │   i18next / RTL      │  │
│  │  (screens)   │  │   (stores)   │  │   (localization)     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────┘  │
│         │                 │                                      │
│  ┌──────▼─────────────────▼──────────────────────────────────┐  │
│  │                    Custom Hooks Layer                      │  │
│  │  useDhikr · useSession · useStreak · useTodo · useAuth · useDhikrView    │  │
│  └──────┬──────────────────────────┬────────────────────────┘  │
│         │                          │                             │
│  ┌──────▼──────────┐    ┌──────────▼──────────────────────────┐ │
│  │  src/db/        │    │  Firebase SDK                        │ │
│  │  (expo-sqlite)  │    │  Auth · Firestore · Cloud Messaging  │ │
│  │  adhkar.db      │    │  Storage (manifest + patches)        │ │
│  │  (bundled)      │    └─────────────────────────────────────┘ │
│  └────────┬────────┘              ▲                              │
│           │                       │                              │
│  ┌────────▼────────────────────────────────────────────────────┐ │
│  │  ContentUpdateService (src/services/contentUpdate.ts)       │ │
│  │  App launch → check manifest → download patch → apply to DB │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
         │ Web platform only
┌────────▼────────────────────────────────────────────────────────┐
│  Service Worker (web/service-worker.ts)                          │
│  Caches: app shell, JS bundles, adhkar.db, fonts, icons          │
└─────────────────────────────────────────────────────────────────┘

         Firebase Cloud (backend)
┌────────────────────────────────────────────────────────────────┐
│  Firestore: /adhkar_content/{dhikrId}  (content source of truth)│
│  Cloud Function: generateContentPatch  (triggered on writes)    │
│  Firebase Storage: content/manifest.json + content/patches/     │
└────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Technology | Responsibility |
|---|---|---|
| Screens | Expo Router (`app/`) | Navigation, layout, user interaction |
| State | Zustand (`src/store/`) | In-memory app state, persisted via middleware |
| Hooks | Custom hooks (`src/hooks/`) | Encapsulate data-fetching and business logic |
| Content DB | expo-sqlite + `adhkar.db` | Read-only access to all dhikr content |
| User DB | expo-sqlite (user tables) | Local persistence of favorites, settings, streak, todos |
| Content Update | `ContentUpdateService` | Background delta patch check, download, and apply on launch |
| Sync | Firebase Firestore | Cloud sync for authenticated users |
| Content Source | Firestore `/adhkar_content` | Admin-managed source of truth for all dhikr content |
| Content Delivery | Firebase Storage | Hosts version manifest and delta patch files |
| Content Generation | Firebase Cloud Function | Generates delta patches when Firestore content changes |
| Auth | Firebase Authentication | Google Sign-In identity |
| Notifications | expo-notifications + Web Push | Daily dhikr reminders |
| i18n | i18next + react-i18next | UI strings, language switching, RTL |
| Service Worker | Workbox (web only) | PWA offline caching |

### Data Flow: Content Read (Offline)

```
Screen → useCategory/useDhikr hook → src/db/queries.ts → expo-sqlite → adhkar.db
```

No network involved. All content reads are synchronous SQLite queries against the bundled database.

### Data Flow: User Data (Authenticated)

```
Screen → Zustand store action → src/db/queries.ts (local write)
                              → Firebase Firestore (cloud write, if online)
```

Local write always happens first. Firestore write is fire-and-forget with offline persistence enabled, so it queues automatically when offline.

---

## Components and Interfaces

### Screen Architecture

```
app/
├── _layout.tsx                  # Root layout: font loading gate, auth listener, i18n init
├── (tabs)/
│   ├── _layout.tsx              # Bottom tab navigator (Home, Favorites, Search, Todo, Profile)
│   ├── index.tsx                # Home: streak widget, check-in button, category grid
│   ├── favorites.tsx            # Favorites list
│   ├── search.tsx               # Search input + results
│   ├── todo.tsx                 # To-Do List screen
│   └── profile.tsx              # Sign-in / profile / settings entry point
├── category/[id].tsx            # Category detail: ordered dhikr list
├── dhikr/[id].tsx               # Dhikr detail: Arabic, translation, source, counter — triggers check-in on mount via `useDhikrView` hook
├── session/[categoryId].tsx     # Guided session: one dhikr at a time + counter
├── settings.tsx                 # Language, text size, transliteration, notifications
├── sign-in.tsx                  # Google Sign-In screen
└── source/[dhikrId].tsx         # Expanded source / Hadith context view
```

### Key Shared Components

| Component | Props | Responsibility |
|---|---|---|
| `DhikrCard` | `dhikr: Dhikr, onPress, onFavorite` | Compact dhikr list item with Arabic snippet and source badge |
| `ArabicText` | `text: string, size: TextSize` | Renders Arabic in Amiri/Scheherazade font with correct RTL alignment |
| `Counter` | `count, target?, onTap, onLongPress` | Tap counter with progress ring; shows `count / target` when target defined |
| `SourceBadge` | `grade: AuthenticityGrade` | Colored pill showing Sahih / Hasan |
| `StreakWidget` | `streak: number, checkedInToday: boolean` | Flame icon + count + check-in button |
| `CategoryCard` | `category: Category, onPress` | Grid card with Arabic name + translated name |
| `SessionProgress` | `current: number, total: number` | Progress bar for guided session |
| `BadgeDisplay` | `badges: Badge[]` | Grid of earned badge icons |
| `TodoItem` | `item: TodoItem, onToggle, onDelete, onEdit` | Single to-do row with checkbox, title, swipe-to-delete |
| `StreakNudgeModal` | `visible: boolean, streak: number, onSignIn, onLater, onDismissPermanently` | Bottom sheet modal nudging Guest Users with streaks ≥ 3 to sign in; provides "Sign In", "Maybe Later", and "Don't show again" actions |
| `StreakMigrationModal` | `visible: boolean, localStreak: number, onMigrate, onSkip` | Modal shown after first-time Google Sign-In when local streak > 0; offers "Migrate" and "Skip" actions |

### Navigation Structure

```
Root Stack
├── (tabs) — Bottom Tab Navigator
│   ├── Home (index)
│   ├── Favorites
│   ├── Search
│   ├── Todo
│   └── Profile
├── category/[id]          — pushed from Home
├── dhikr/[id]             — pushed from Category, Favorites, Search results
├── session/[categoryId]   — pushed from Category detail
├── source/[dhikrId]       — pushed from Dhikr detail (modal)
├── settings               — pushed from Profile tab
└── sign-in                — pushed from Profile tab (if guest)
```

Bottom tabs follow platform conventions: Android uses Material-style bottom nav; iOS uses UITabBar. Back gestures are handled by React Navigation's native stack.

---

## Data Models

### Content Database Schema (`adhkar.db` — read-only, bundled)

```sql
-- Categories
CREATE TABLE categories (
  id          INTEGER PRIMARY KEY,
  slug        TEXT    NOT NULL UNIQUE,   -- e.g. 'morning', 'after-prayer'
  name_ar     TEXT    NOT NULL,          -- Arabic name
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- Category translations (one row per category per locale)
CREATE TABLE category_translations (
  category_id INTEGER NOT NULL REFERENCES categories(id),
  locale      TEXT    NOT NULL,          -- e.g. 'en', 'id'
  name        TEXT    NOT NULL,
  PRIMARY KEY (category_id, locale)
);

-- Dhikr entries
CREATE TABLE dhikr (
  id                  INTEGER PRIMARY KEY,
  arabic_text         TEXT    NOT NULL,
  transliteration     TEXT,
  repetition_count    INTEGER,           -- NULL if not prescribed
  source_type         TEXT    NOT NULL CHECK(source_type IN ('quran','hadith')),
  -- Qur'an source fields
  surah_name          TEXT,
  ayah_number         INTEGER,
  -- Hadith source fields
  collection_name     TEXT,
  book_number         TEXT,
  hadith_number       TEXT,
  -- Authenticity
  authenticity_grade  TEXT    NOT NULL CHECK(authenticity_grade IN ('sahih','hasan')),
  scholar_names       TEXT,              -- JSON array of grading scholars
  grading_rationale   TEXT,
  full_hadith_text    TEXT,              -- Full Hadith text for expanded source view
  sort_order          INTEGER NOT NULL DEFAULT 0
);

-- Dhikr translations (one row per dhikr per locale)
CREATE TABLE dhikr_translations (
  dhikr_id    INTEGER NOT NULL REFERENCES dhikr(id),
  locale      TEXT    NOT NULL,
  translation TEXT    NOT NULL,
  PRIMARY KEY (dhikr_id, locale)
);

-- Category ↔ Dhikr mapping (many-to-many)
CREATE TABLE category_dhikr (
  category_id INTEGER NOT NULL REFERENCES categories(id),
  dhikr_id    INTEGER NOT NULL REFERENCES dhikr(id),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (category_id, dhikr_id)
);

-- Full-text search virtual table
CREATE VIRTUAL TABLE dhikr_fts USING fts5(
  dhikr_id UNINDEXED,
  arabic_text,
  transliteration,
  content='dhikr',
  content_rowid='id'
);
```

### User Database Schema (expo-sqlite, local — read/write)

```sql
-- User preferences
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- Keys: 'language', 'text_size', 'show_transliteration',
--       'notification_enabled', 'notification_time', 'dhikr_of_day_history',
--       'content_version'  ← stores the currently applied content patch version (integer as text, default '0')
--       'nudge_dismissed_permanently'      ← '0' or '1'; suppresses StreakNudgeModal permanently when '1'
--       'nudge_last_dismissed_at'          ← ISO date string 'YYYY-MM-DD' of last "Maybe Later" dismissal
--       'nudge_streak_at_last_dismissal'   ← integer (as text); local streak value at time of last dismissal
--       'streak_migration_offered'         ← '0' or '1'; set to '1' after StreakMigrationModal is shown (one-time)

-- Favorites
CREATE TABLE IF NOT EXISTS favorites (
  dhikr_id    INTEGER PRIMARY KEY,
  added_at    INTEGER NOT NULL  -- Unix timestamp
);

-- Daily check-in and streak
CREATE TABLE IF NOT EXISTS streak (
  id              INTEGER PRIMARY KEY CHECK(id = 1),  -- singleton row
  current_streak  INTEGER NOT NULL DEFAULT 0,
  last_checkin    TEXT,    -- ISO date string 'YYYY-MM-DD'
  longest_streak  INTEGER NOT NULL DEFAULT 0
);

-- Earned badges
CREATE TABLE IF NOT EXISTS badges (
  milestone   INTEGER PRIMARY KEY,  -- 7, 30, 100
  earned_at   INTEGER NOT NULL,     -- Unix timestamp
  reward_claimed INTEGER NOT NULL DEFAULT 0  -- 0 or 1
);

-- To-Do items
CREATE TABLE IF NOT EXISTS todos (
  id          TEXT    PRIMARY KEY,  -- UUID v4
  title       TEXT    NOT NULL,
  notes       TEXT,
  completed   INTEGER NOT NULL DEFAULT 0,  -- 0 or 1
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  deleted_at  INTEGER          -- soft delete for sync tombstoning
);

-- Guest check-in history (one row per calendar day the guest checked in)
-- Used for local streak computation and migration to Firestore on first sign-in
CREATE TABLE IF NOT EXISTS checkin_history (
  date          TEXT    PRIMARY KEY,  -- 'YYYY-MM-DD'
  checked_in_at INTEGER NOT NULL      -- Unix timestamp of when the check-in was recorded
);
```

### Firestore Schema (authenticated users only)

```
/users/{uid}/
  profile:
    displayName: string
    email: string
    photoURL: string
    createdAt: Timestamp

/users/{uid}/streak/data:
  currentStreak: number      // written by recomputeStreak Cloud Function (authenticated users)
  lastCheckin: string        // 'YYYY-MM-DD'
  longestStreak: number
  updatedAt: Timestamp       // set by Cloud Function on every recomputation

/users/{uid}/checkins/{date}:  // date = 'YYYY-MM-DD', one document per calendar day
  date: string               // 'YYYY-MM-DD' — matches the document ID
  checkedInAt: Timestamp     // Firestore server timestamp (FieldValue.serverTimestamp())

/users/{uid}/badges/{milestone}:
  milestone: number          // 7 | 30 | 100
  earnedAt: Timestamp
  rewardClaimed: boolean

/users/{uid}/favorites/{dhikrId}:
  dhikrId: number
  addedAt: Timestamp

/users/{uid}/todos/{todoId}:
  id: string                 // UUID
  title: string
  notes: string | null
  completed: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
  deletedAt: Timestamp | null  // tombstone for sync

/reward_claims/{claimId}:
  userId: string
  displayName: string
  email: string
  gopayNumber: string
  milestone: number
  submittedAt: Timestamp
  status: 'pending' | 'sent' | 'claimed'

/adhkar_content/{dhikrId}:
  id: number                  // matches SQLite dhikr.id
  arabicText: string
  transliteration: string | null
  repetitionCount: number | null
  sourceType: 'quran' | 'hadith'
  surahName: string | null
  ayahNumber: number | null
  collectionName: string | null
  bookNumber: string | null
  hadithNumber: string | null
  authenticityGrade: 'sahih' | 'hasan'
  scholarNames: string[]
  gradingRationale: string | null
  fullHadithText: string | null
  sortOrder: number
  translations: Array<{ locale: string; translation: string }>
  version: number             // incremented on every admin edit; used by generateContentPatch to detect changes
  updatedAt: Timestamp        // Firestore server timestamp set on every write
```

### TypeScript Types

```typescript
// src/types/content.ts

export type AuthenticityGrade = 'sahih' | 'hasan';
export type SourceType = 'quran' | 'hadith';
export type TextSize = 'small' | 'medium' | 'large';
export type Locale = 'en' | 'id' | string;

export interface Category {
  id: number;
  slug: string;
  nameAr: string;
  name: string;          // translated for current locale
  sortOrder: number;
}

export interface Dhikr {
  id: number;
  arabicText: string;
  transliteration: string | null;
  translation: string;   // for current locale, falls back to 'en'
  translationFallback: boolean;  // true if fell back to English
  repetitionCount: number | null;
  sourceType: SourceType;
  // Qur'an
  surahName: string | null;
  ayahNumber: number | null;
  // Hadith
  collectionName: string | null;
  bookNumber: string | null;
  hadithNumber: string | null;
  // Authenticity
  authenticityGrade: AuthenticityGrade;
  scholarNames: string[];
  gradingRationale: string | null;
  fullHadithText: string | null;
}

// src/types/user.ts

export interface TodoItem {
  id: string;
  title: string;
  notes: string | null;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export interface StreakData {
  currentStreak: number;
  lastCheckin: string | null;  // 'YYYY-MM-DD'
  longestStreak: number;
}

export interface Badge {
  milestone: 7 | 30 | 100;
  earnedAt: number;
  rewardClaimed: boolean;
}

export type RewardStatus = 'pending' | 'sent' | 'claimed';

export interface RewardClaim {
  userId: string;
  displayName: string;
  email: string;
  gopayNumber: string;
  milestone: number;
  submittedAt: number;
  status: RewardStatus;
}
```

---

## State Management Design (Zustand Stores)

### `settingsStore.ts`

```typescript
interface SettingsState {
  language: Locale;
  textSize: TextSize;
  showTransliteration: boolean;
  notificationEnabled: boolean;
  notificationTime: string;  // 'HH:MM' 24-hour
  // Actions
  setLanguage: (lang: Locale) => void;
  setTextSize: (size: TextSize) => void;
  toggleTransliteration: () => void;
  setNotificationEnabled: (enabled: boolean) => void;
  setNotificationTime: (time: string) => void;
}
```

Persisted via `zustand/middleware/persist` → AsyncStorage (mobile) / localStorage (web).

### `sessionStore.ts`

```typescript
interface SessionState {
  categoryId: number | null;
  dhikrIds: number[];          // ordered list for the session
  currentIndex: number;
  count: number;               // current repetition count
  isComplete: boolean;
  // Actions
  startSession: (categoryId: number, dhikrIds: number[]) => void;
  increment: () => void;
  resetCount: () => void;
  advance: () => void;         // move to next dhikr
  exitSession: () => void;
}
```

Not persisted — session state is ephemeral and discarded on exit (Requirement 4.6).

### `favoritesStore.ts`

```typescript
interface FavoritesState {
  dhikrIds: Set<number>;
  // Actions
  addFavorite: (dhikrId: number) => void;
  removeFavorite: (dhikrId: number) => void;
  isFavorite: (dhikrId: number) => boolean;
  hydrate: (ids: number[]) => void;  // called on app start from DB
}
```

Persisted to local SQLite `favorites` table. For authenticated users, also synced to Firestore.

### `streakStore.ts`

```typescript
interface StreakState {
  currentStreak: number;
  lastCheckin: string | null;
  longestStreak: number;
  checkedInToday: boolean;
  badges: Badge[];
  source: 'local' | 'firestore';  // 'firestore' for authenticated users, 'local' for guests
  // Actions
  checkIn: () => void;         // idempotent — safe to call multiple times per day
                               // Called from `useDhikrView` hook on first dhikr view of the day — idempotent, safe to call on every dhikr screen mount.
  hydrate: (data: StreakData, badges: Badge[], source?: 'local' | 'firestore') => void;
  subscribeToFirestore: (uid: string) => () => void;  // returns unsubscribe fn
}
```

For **Guest Users**, the store reads from and writes to local SQLite (`streak` and `badges` tables). The `source` field is `'local'`.

For **Authenticated Users**, the store subscribes to Firestore via `onSnapshot` on `/users/{uid}/streak/data`. When a snapshot arrives, the store updates `currentStreak`, `longestStreak`, and `checkedInToday` from the Firestore document — the local SQLite `streak` table is no longer the authoritative source. The `source` field is `'firestore'`.

The `subscribeToFirestore(uid)` action is called after sign-in completes (and after streak migration if applicable). It sets up the `onSnapshot` listener and returns the unsubscribe function, which is called on sign-out.

Check-in writes for authenticated users still write to both local SQLite (for offline resilience) and to Firestore `/users/{uid}/checkins/{date}` (which triggers the `recomputeStreak` Cloud Function). The displayed streak value always comes from the Firestore `onSnapshot` listener.

### `authStore.ts`

```typescript
interface AuthState {
  user: FirebaseUser | null;
  isLoading: boolean;
  // Actions
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: FirebaseUser | null) => void;
}
```

Not persisted — Firebase SDK manages its own token persistence.

### `todoStore.ts`

```typescript
interface TodoState {
  items: TodoItem[];
  // Actions
  addItem: (title: string, notes?: string) => void;
  toggleItem: (id: string) => void;
  editItem: (id: string, title: string, notes?: string) => void;
  deleteItem: (id: string) => void;
  hydrate: (items: TodoItem[]) => void;
}
```

Persisted to local SQLite `todos` table. For authenticated users, synced to Firestore in real time.

---

## Offline Strategy

### Mobile (Android / iOS)

The bundled `adhkar.db` is copied from the app bundle to the device's document directory on first launch using `expo-sqlite`'s asset import mechanism. All content reads go directly to this local file — no network involved.

User data (favorites, settings, streak, todos) is stored in a separate `user.db` SQLite database on the device.

Firebase Firestore SDK has offline persistence enabled by default on mobile. When the device is offline, Firestore queues writes locally and replays them when connectivity is restored. Reads are served from the local Firestore cache.

**Content update behavior when offline:** `ContentUpdateService.checkForUpdates()` is called on every launch. If the manifest fetch fails (including due to no network), the error is caught silently and the service returns immediately. The app always falls back to the bundled baseline `adhkar.db` — no content update is attempted, and the user experiences no degradation.

```typescript
// src/db/client.ts
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

export async function openContentDb(): Promise<SQLite.SQLiteDatabase> {
  const dbPath = `${FileSystem.documentDirectory}SQLite/adhkar.db`;
  const dbExists = await FileSystem.getInfoAsync(dbPath);
  if (!dbExists.exists) {
    await FileSystem.makeDirectoryAsync(
      `${FileSystem.documentDirectory}SQLite`,
      { intermediates: true }
    );
    const asset = Asset.fromModule(require('../../src/db/seed/adhkar.db'));
    await asset.downloadAsync();
    await FileSystem.copyAsync({ from: asset.localUri!, to: dbPath });
  }
  return SQLite.openDatabase('adhkar.db');
}

export function openUserDb(): SQLite.SQLiteDatabase {
  return SQLite.openDatabase('user.db');
}
```

### Web (PWA Service Worker)

The service worker (`web/service-worker.ts`) uses Workbox with a **cache-first** strategy for static assets and a **stale-while-revalidate** strategy for the app shell.

```
Cache Strategy:
  App shell (HTML, JS, CSS bundles)  → Cache First
  adhkar.db (SQLite WASM file)       → Cache First (large, rarely changes)
  Arabic fonts                       → Cache First
  Icons / images                     → Cache First
  API calls (none for content)       → N/A
```

On first load, the service worker pre-caches all assets listed in the Workbox manifest. On subsequent loads, the app shell is served from cache immediately, then the service worker checks for updates in the background. When a new version is detected, a banner prompts the user to reload (Requirement 13.4).

For web, `expo-sqlite` uses a WASM-based SQLite implementation backed by IndexedDB (via `sql.js` or the Expo SQLite web shim). The `adhkar.db` file is fetched once and stored in the service worker cache.

```typescript
// web/service-worker.ts (Workbox)
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

precacheAndRoute(self.__WB_MANIFEST);

// Cache the SQLite database file
registerRoute(
  ({ url }) => url.pathname.endsWith('adhkar.db'),
  new CacheFirst({ cacheName: 'content-db' })
);

// Notify clients when a new service worker is waiting
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
```

---

## Firebase Integration

### Authentication

Firebase Authentication handles Google Sign-In via `expo-auth-session` (for managed Expo workflow compatibility) on mobile, and `signInWithPopup` on web.

```
Sign-In Flow:
  1. User taps "Sign in with Google"
  2. expo-auth-session opens Google OAuth consent screen
  3. On success, exchange auth code for Firebase credential
  4. firebase.auth().signInWithCredential(credential)
  5. authStore.setUser(user)
  6. Trigger data sync: pull Firestore → merge with local SQLite
  7. Navigate back to previous screen
```

The `_layout.tsx` root subscribes to `onAuthStateChanged` and updates `authStore` on every auth state change, including token refresh and sign-out.

### Firestore Sync Strategy

Sync is **local-first with Firestore as the source of truth for authenticated users**.

**On sign-in (new device):**
1. Fetch all user documents from Firestore (favorites, streak, badges, todos).
2. Merge with local SQLite data using `updatedAt` timestamps — most recent wins.
3. Write merged state back to both local SQLite and Firestore.

**During normal operation:**
- Every local write (add favorite, check in, add todo) is immediately written to local SQLite.
- The same write is sent to Firestore. If offline, Firestore SDK queues it.
- Firestore `onSnapshot` listeners update the Zustand stores in real time when remote changes arrive (e.g., user edits todos on another device).

**Conflict resolution:**
- Todos: `updatedAt` timestamp wins. Soft-deleted items (tombstones) are preserved for 30 days.
- Streak: `lastCheckin` date is the authoritative field; `currentStreak` is recomputed from it.
- Favorites: union merge — a favorite added on any device is kept; removal is explicit.

### Security Rules (Firestore)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    // Reward claims: authenticated users can create, admins can update
    match /reward_claims/{claimId} {
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.status == 'pending';
      allow read: if request.auth != null
        && resource.data.userId == request.auth.uid;
      allow update: if false;  // admin SDK only
    }
  }
}
```

---

## Content Update System

The Content Update System enables the app to receive new or corrected adhkar content without requiring a full app store release. It uses a delta patch approach: only the differences between content versions are downloaded and applied to the local SQLite database.

### Firebase Storage Layout

```
Firebase Storage bucket
└── content/
    ├── manifest.json          # Version manifest — always the latest
    └── patches/
        ├── v1.json            # Patch from v0 (baseline) to v1
        ├── v2.json            # Patch from v1 to v2
        └── v{N}.json          # Patch from v{N-1} to v{N}
```

Each patch file is named after the version it produces (e.g., `v3.json` brings the local DB from version 2 to version 3).

### Version Manifest Structure

`content/manifest.json` is a small JSON file checked on every app launch:

```json
{
  "latestVersion": 5,
  "patches": [
    { "version": 1, "baseVersion": 0, "url": "https://storage.googleapis.com/.../content/patches/v1.json" },
    { "version": 2, "baseVersion": 1, "url": "https://storage.googleapis.com/.../content/patches/v2.json" },
    { "version": 5, "baseVersion": 4, "url": "https://storage.googleapis.com/.../content/patches/v5.json" }
  ]
}
```

TypeScript type:

```typescript
// src/types/content.ts

export interface PatchManifestEntry {
  version: number;
  baseVersion: number;
  url: string;
}

export interface VersionManifest {
  latestVersion: number;
  patches: PatchManifestEntry[];
}
```

### Delta Patch Structure

Each patch file at `content/patches/v{N}.json` describes only the changes from the previous version:

```json
{
  "version": 5,
  "baseVersion": 4,
  "additions": [ /* DhikrEntry objects to INSERT */ ],
  "updates":   [ /* DhikrEntry objects to UPDATE (matched by id) */ ],
  "deletions": [ 42, 87 ]  /* dhikr IDs to DELETE */
}
```

TypeScript type:

```typescript
// src/types/content.ts

export interface DhikrEntry {
  id: number;
  arabicText: string;
  transliteration: string | null;
  repetitionCount: number | null;
  sourceType: 'quran' | 'hadith';
  surahName: string | null;
  ayahNumber: number | null;
  collectionName: string | null;
  bookNumber: string | null;
  hadithNumber: string | null;
  authenticityGrade: 'sahih' | 'hasan';
  scholarNames: string[];
  gradingRationale: string | null;
  fullHadithText: string | null;
  sortOrder: number;
  // Translations are included inline for patch application
  translations: Array<{ locale: string; translation: string }>;
}

export interface DeltaPatch {
  version: number;
  baseVersion: number;
  additions: DhikrEntry[];
  updates: DhikrEntry[];
  deletions: number[];
}
```

### `ContentUpdateService`

Located at `src/services/contentUpdate.ts`. This service is instantiated once and called during app launch, after the SQLite databases are open and before the home screen renders (but non-blocking — the home screen does not wait for it).

```typescript
// src/services/contentUpdate.ts

import * as SQLite from 'expo-sqlite';
import { VersionManifest, DeltaPatch } from '../types/content';

const MANIFEST_URL = 'https://storage.googleapis.com/{bucket}/content/manifest.json';
const SETTINGS_KEY = 'content_version';

export class ContentUpdateService {
  private db: SQLite.SQLiteDatabase;

  constructor(db: SQLite.SQLiteDatabase) {
    this.db = db;
  }

  /**
   * Entry point called on app launch (fire-and-forget).
   * Checks for a newer content version and applies the patch if available.
   * All failures are silent — the app always falls back to local content.
   */
  async checkForUpdates(): Promise<void> {
    try {
      const manifest = await this.fetchManifest();
      const localVersion = await this.getLocalVersion();

      if (manifest.latestVersion <= localVersion) return;  // already up to date

      const patchEntry = manifest.patches.find(
        p => p.version === manifest.latestVersion && p.baseVersion === localVersion
      );
      if (!patchEntry) return;  // no direct patch available for this base version

      const patch = await this.downloadPatch(patchEntry.url);
      await this.applyPatch(patch);
    } catch {
      // Silent failure — local content is always the fallback
    }
  }

  /** Fetches and parses the version manifest from Firebase Storage. */
  async fetchManifest(): Promise<VersionManifest> {
    const response = await fetch(MANIFEST_URL);
    if (!response.ok) throw new Error(`Manifest fetch failed: ${response.status}`);
    return response.json() as Promise<VersionManifest>;
  }

  /** Downloads and parses a delta patch file from the given URL. */
  async downloadPatch(url: string): Promise<DeltaPatch> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Patch download failed: ${response.status}`);
    return response.json() as Promise<DeltaPatch>;
  }

  /**
   * Applies a delta patch to the local SQLite database inside a single transaction.
   * On any error, the transaction is rolled back and the error is re-thrown.
   */
  async applyPatch(patch: DeltaPatch): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(
        tx => {
          // Deletions
          for (const id of patch.deletions) {
            tx.executeSql('DELETE FROM dhikr WHERE id = ?', [id]);
            tx.executeSql('DELETE FROM dhikr_translations WHERE dhikr_id = ?', [id]);
            tx.executeSql('DELETE FROM category_dhikr WHERE dhikr_id = ?', [id]);
          }
          // Additions
          for (const entry of patch.additions) {
            tx.executeSql(
              `INSERT OR REPLACE INTO dhikr
               (id, arabic_text, transliteration, repetition_count, source_type,
                surah_name, ayah_number, collection_name, book_number, hadith_number,
                authenticity_grade, scholar_names, grading_rationale, full_hadith_text, sort_order)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
              [entry.id, entry.arabicText, entry.transliteration, entry.repetitionCount,
               entry.sourceType, entry.surahName, entry.ayahNumber, entry.collectionName,
               entry.bookNumber, entry.hadithNumber, entry.authenticityGrade,
               JSON.stringify(entry.scholarNames), entry.gradingRationale,
               entry.fullHadithText, entry.sortOrder]
            );
            for (const t of entry.translations) {
              tx.executeSql(
                'INSERT OR REPLACE INTO dhikr_translations (dhikr_id, locale, translation) VALUES (?,?,?)',
                [entry.id, t.locale, t.translation]
              );
            }
          }
          // Updates (same SQL as additions — INSERT OR REPLACE handles upsert)
          for (const entry of patch.updates) {
            tx.executeSql(
              `INSERT OR REPLACE INTO dhikr
               (id, arabic_text, transliteration, repetition_count, source_type,
                surah_name, ayah_number, collection_name, book_number, hadith_number,
                authenticity_grade, scholar_names, grading_rationale, full_hadith_text, sort_order)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
              [entry.id, entry.arabicText, entry.transliteration, entry.repetitionCount,
               entry.sourceType, entry.surahName, entry.ayahNumber, entry.collectionName,
               entry.bookNumber, entry.hadithNumber, entry.authenticityGrade,
               JSON.stringify(entry.scholarNames), entry.gradingRationale,
               entry.fullHadithText, entry.sortOrder]
            );
            for (const t of entry.translations) {
              tx.executeSql(
                'INSERT OR REPLACE INTO dhikr_translations (dhikr_id, locale, translation) VALUES (?,?,?)',
                [entry.id, t.locale, t.translation]
              );
            }
          }
          // Persist the new version number
          tx.executeSql(
            'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
            [SETTINGS_KEY, String(patch.version)]
          );
        },
        error => reject(error),
        () => resolve()
      );
    });
  }

  /**
   * Rolls back a failed patch by re-opening the transaction and doing nothing —
   * expo-sqlite rolls back automatically on transaction error.
   * This method exists as an explicit hook for testing and logging.
   */
  async rollbackPatch(): Promise<void> {
    // expo-sqlite transactions are atomic: any error in the transaction callback
    // causes a full rollback. No manual rollback SQL is needed.
    // This method is a no-op in production; it exists for test instrumentation.
  }

  private async getLocalVersion(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.readTransaction(tx => {
        tx.executeSql(
          'SELECT value FROM settings WHERE key = ?',
          [SETTINGS_KEY],
          (_, result) => {
            const row = result.rows.item(0);
            resolve(row ? parseInt(row.value, 10) : 0);
          },
          (_, error) => { reject(error); return false; }
        );
      });
    });
  }
}
```

### Update Flow

```
App launch
  │
  ├─► Open SQLite databases (adhkar.db + user.db)
  │
  ├─► Render home screen immediately (non-blocking)
  │
  └─► ContentUpdateService.checkForUpdates() [fire-and-forget]
        │
        ├─► GET content/manifest.json from Firebase Storage
        │     └─ failure → silent return, use local content
        │
        ├─► Read content_version from settings table
        │
        ├─► Compare: manifest.latestVersion > localVersion?
        │     └─ No → return (already up to date)
        │
        ├─► Find patch entry where baseVersion == localVersion
        │     └─ Not found → return (no direct upgrade path)
        │
        ├─► GET patch URL from Firebase Storage
        │     └─ failure → silent return, use local content
        │
        ├─► Begin SQLite transaction
        │     ├─ DELETE rows in patch.deletions
        │     ├─ INSERT OR REPLACE rows in patch.additions
        │     ├─ INSERT OR REPLACE rows in patch.updates
        │     └─ UPDATE settings SET value = patch.version WHERE key = 'content_version'
        │
        ├─► Transaction success → commit, local DB now at new version
        │
        └─► Transaction failure → automatic rollback, local DB unchanged
```

### Firebase Cloud Function: `generateContentPatch`

The `generateContentPatch` Cloud Function runs in the Firebase backend. It triggers on Firestore writes to the `/adhkar_content` collection and is responsible for computing the delta and publishing it to Firebase Storage.

**Trigger:** `onWrite` on `/adhkar_content/{dhikrId}`

**Logic:**

```typescript
// functions/src/generateContentPatch.ts (Firebase Cloud Functions)

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { DeltaPatch, DhikrEntry } from './types';

export const generateContentPatch = functions.firestore
  .document('adhkar_content/{dhikrId}')
  .onWrite(async () => {
    const storage = admin.storage().bucket();
    const firestore = admin.firestore();

    // 1. Read current manifest to determine the current latest version
    const manifestFile = storage.file('content/manifest.json');
    const [manifestExists] = await manifestFile.exists();
    const currentVersion = manifestExists
      ? JSON.parse((await manifestFile.download())[0].toString()).latestVersion
      : 0;
    const newVersion = currentVersion + 1;

    // 2. Fetch all current content from Firestore
    const snapshot = await firestore.collection('adhkar_content').get();
    const currentEntries = snapshot.docs.map(doc => doc.data() as FirestoreDhikrEntry);

    // 3. Fetch the previous version's content snapshot (stored alongside patches)
    const prevSnapshotFile = storage.file(`content/snapshots/v${currentVersion}.json`);
    const [prevExists] = await prevSnapshotFile.exists();
    const previousEntries: FirestoreDhikrEntry[] = prevExists
      ? JSON.parse((await prevSnapshotFile.download())[0].toString())
      : [];

    // 4. Compute delta
    const previousMap = new Map(previousEntries.map(e => [e.id, e]));
    const currentMap = new Map(currentEntries.map(e => [e.id, e]));

    const additions: DhikrEntry[] = [];
    const updates: DhikrEntry[] = [];
    const deletions: number[] = [];

    for (const [id, entry] of currentMap) {
      if (!previousMap.has(id)) {
        additions.push(toClientEntry(entry));
      } else if (entry.version > previousMap.get(id)!.version) {
        updates.push(toClientEntry(entry));
      }
    }
    for (const id of previousMap.keys()) {
      if (!currentMap.has(id)) deletions.push(id);
    }

    const patch: DeltaPatch = {
      version: newVersion,
      baseVersion: currentVersion,
      additions,
      updates,
      deletions,
    };

    // 5. Upload patch file
    await storage.file(`content/patches/v${newVersion}.json`).save(
      JSON.stringify(patch),
      { contentType: 'application/json' }
    );

    // 6. Save current snapshot for next diff
    await storage.file(`content/snapshots/v${newVersion}.json`).save(
      JSON.stringify(currentEntries),
      { contentType: 'application/json' }
    );

    // 7. Update manifest
    const manifest = {
      latestVersion: newVersion,
      patches: [
        ...(manifestExists ? JSON.parse((await manifestFile.download())[0].toString()).patches : []),
        { version: newVersion, baseVersion: currentVersion, url: getPublicUrl(`content/patches/v${newVersion}.json`) },
      ],
    };
    await manifestFile.save(JSON.stringify(manifest), { contentType: 'application/json' });
  });
```

### Firestore Content Collection Schema

The source of truth for all dhikr content lives in Firestore under `/adhkar_content/{dhikrId}`. The app administrator manages this collection via the Firebase Console or admin scripts.

```
/adhkar_content/{dhikrId}
  id:                 number          // matches SQLite dhikr.id
  arabicText:         string
  transliteration:    string | null
  repetitionCount:    number | null
  sourceType:         'quran' | 'hadith'
  surahName:          string | null
  ayahNumber:         number | null
  collectionName:     string | null
  bookNumber:         string | null
  hadithNumber:       string | null
  authenticityGrade:  'sahih' | 'hasan'
  scholarNames:       string[]
  gradingRationale:   string | null
  fullHadithText:     string | null
  sortOrder:          number
  translations:       Array<{ locale: string; translation: string }>
  version:            number          // incremented on every admin edit
  updatedAt:          Timestamp       // Firestore server timestamp
```

The `version` field on each document is an integer incremented by the admin script on every edit. The Cloud Function uses this field to detect which entries have changed since the last patch was generated.

---

## Server-Side Streak Verification (Requirement 20)

### Firebase Cloud Function: `recomputeStreak`

The `recomputeStreak` Cloud Function runs in the Firebase backend. It triggers whenever a new check-in document is written to `/users/{uid}/checkins/{date}` and recomputes the user's streak from the full check-in history. This document is written when the user first views a dhikr detail screen on a given calendar day (via the `useDhikrView` hook), not when they open the app.

**Trigger:** `onWrite` on `/users/{uid}/checkins/{date}`

**Logic:**

```typescript
// functions/src/recomputeStreak.ts (Firebase Cloud Functions)

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const recomputeStreak = functions.firestore
  .document('users/{uid}/checkins/{date}')
  .onWrite(async (change, context) => {
    const { uid } = context.params;
    const firestore = admin.firestore();

    // 1. Duplicate check-in guard: if the document already existed before this write,
    //    this is a no-op (write-once semantics per calendar day).
    if (change.before.exists) return;

    // 2. Read all check-in documents for this user
    const checkinsSnap = await firestore
      .collection(`users/${uid}/checkins`)
      .get();

    // 3. Extract and sort all check-in dates ascending
    const dates: string[] = checkinsSnap.docs
      .map(doc => doc.id)          // document ID is 'YYYY-MM-DD'
      .sort();                     // lexicographic sort works for ISO dates

    if (dates.length === 0) return;

    // 4. Count consecutive days ending on the most recent date
    let currentStreak = 1;
    for (let i = dates.length - 1; i > 0; i--) {
      const current = new Date(dates[i]);
      const previous = new Date(dates[i - 1]);
      const diffDays = (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;  // gap found — streak ends here
      }
    }

    // 5. Compute longestStreak by scanning all runs
    let longestStreak = 1;
    let runLength = 1;
    for (let i = 1; i < dates.length; i++) {
      const current = new Date(dates[i]);
      const previous = new Date(dates[i - 1]);
      const diffDays = (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        runLength++;
        longestStreak = Math.max(longestStreak, runLength);
      } else {
        runLength = 1;
      }
    }

    // 6. Write recomputed values back to the streak document
    await firestore.doc(`users/${uid}/streak/data`).set(
      {
        currentStreak,
        longestStreak,
        lastCheckin: dates[dates.length - 1],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
```

**Duplicate check-in guard:** The function checks `change.before.exists` at the top. If the document already existed (i.e., this is an update rather than a create), the function exits immediately without recomputing. This enforces write-once semantics: only the first write for a given calendar day triggers a recomputation.

**Streak computation:** The function reads all check-in documents, sorts the date strings (ISO format sorts lexicographically), then walks backwards from the most recent date counting consecutive days. A gap of more than 1 day breaks the streak.

### Reward Claim Pre-Validation (Requirement 20.6)

Before writing a new document to `reward_claims`, the app reads the Firestore streak document for the authenticated user and verifies that `currentStreak >= milestone`. This read happens client-side immediately before the claim write:

```typescript
// src/hooks/useRewardClaim.ts (relevant excerpt)

async function submitClaim(milestone: number, gopayNumber: string): Promise<void> {
  const streakDoc = await getDoc(doc(firestore, `users/${uid}/streak/data`));
  const firestoreStreak = streakDoc.data()?.currentStreak ?? 0;

  if (firestoreStreak < milestone) {
    // Reject: Firestore streak does not meet the milestone threshold
    setError('Your verified streak does not meet the milestone requirement.');
    return;
  }

  // Proceed with writing the reward claim
  await addDoc(collection(firestore, 'reward_claims'), {
    userId: uid,
    displayName,
    email,
    gopayNumber,
    milestone,
    submittedAt: serverTimestamp(),
    status: 'pending',
  });
}
```

The Firestore Security Rules for `reward_claims` remain unchanged — the server-side streak check is an additional client-side guard to prevent accidental submissions, not a replacement for server-side validation.

### `useStreakNudge` Hook (Requirement 21)

Located at `src/hooks/useStreakNudge.ts`. This hook encapsulates all logic for deciding whether to show the `StreakNudgeModal` to a Guest User.

**Settings keys read/written:**

| Key | Type | Description |
|---|---|---|
| `nudge_dismissed_permanently` | `'0'` or `'1'` | Set to `'1'` when user taps "Don't show again" |
| `nudge_last_dismissed_at` | ISO date string | Date of last "Maybe Later" dismissal |
| `nudge_streak_at_last_dismissal` | integer as string | Local streak value at time of last dismissal |

**Hook interface:**

```typescript
// src/hooks/useStreakNudge.ts

interface StreakNudgeState {
  shouldShow: boolean;
  dismiss: () => void;           // "Maybe Later" — records date + streak, 3-day cooldown
  dismissPermanently: () => void; // "Don't show again" — sets permanent flag
}

export function useStreakNudge(): StreakNudgeState;
```

**Trigger logic (evaluated on home screen mount, after streak hydration):**

The hook returns `shouldShow = true` if and only if ALL of the following conditions are met:

1. User is a Guest (not authenticated — `authStore.user === null`)
2. `localStreak >= 3`
3. `nudge_dismissed_permanently !== '1'`
4. Either:
   - `nudge_last_dismissed_at` is not set (never dismissed), OR
   - Current date is more than 3 days after `nudge_last_dismissed_at`, OR
   - `localStreak >= nudge_streak_at_last_dismissal + 7` (streak has grown by 7+ since last dismissal)

**Dismissal behavior:**

- **"Maybe Later"** (`dismiss()`): writes `nudge_last_dismissed_at = today` and `nudge_streak_at_last_dismissal = currentStreak` to the settings table, then sets `shouldShow = false`.
- **"Don't show again"** (`dismissPermanently()`): writes `nudge_dismissed_permanently = '1'` to the settings table, then sets `shouldShow = false`. This suppression is permanent for the device.

### `useDhikrView` Hook (Requirement 14)

Located at `src/hooks/useDhikrView.ts`. This hook is called on every `dhikr/[id].tsx` screen mount. It records the daily check-in the first time the user views any dhikr detail screen on a given calendar day — no manual button tap is required.

**Hook interface:**

```typescript
// src/hooks/useDhikrView.ts

export function useDhikrView(): void;
```

**Behavior on mount:**

1. Read `streak.lastCheckin` from `streakStore`.
2. Compare against today's date (`'YYYY-MM-DD'`).
3. If `streak.lastCheckin !== today`, record the check-in:
   - **Guest Users**: write to local SQLite `checkin_history` table (one row for today's date + Unix timestamp) and update the `streak` table via `streakStore.checkIn()`.
   - **Authenticated Users**: write to Firestore `/users/{uid}/checkins/{date}` with `FieldValue.serverTimestamp()`, which triggers the `recomputeStreak` Cloud Function. Also writes to local SQLite for offline resilience.
4. If `streak.lastCheckin === today`, the hook is a no-op — the check-in has already been recorded for this calendar day.

> **Note:** The hook is idempotent and safe to call on every `dhikr/[id].tsx` mount. Calling it multiple times on the same day has no additional effect.

### Streak Migration Flow (Requirement 22)

#### Detection of First-Time Sign-In

After Google Sign-In completes, the app checks whether this is a first-time sign-in on this device by reading the `streak_migration_offered` flag from the local settings table. If the flag is not set (value `'0'` or absent), the migration flow is initiated.

Additionally, the app checks whether the Firestore check-in history is empty (`/users/{uid}/checkins` collection has zero documents) OR whether the Firestore user profile `createdAt` is within the last 60 seconds — either condition confirms a brand-new account.

#### `StreakMigrationModal` Component

Shown as a modal immediately after sign-in if:
- `streak_migration_offered` is not set, AND
- Local `currentStreak > 0`

The modal displays the local streak count and two action buttons: **Migrate** and **Skip**.

#### Migration Steps (on "Migrate")

```
1. Read local checkin_history table from SQLite
   → produces: localDates: string[]  (array of 'YYYY-MM-DD' strings)

2. Read existing Firestore check-in documents for the user
   → produces: remoteDates: string[]

3. Compute union: mergedDates = Array.from(new Set([...localDates, ...remoteDates]))

4. Batch-write all dates in mergedDates to Firestore /users/{uid}/checkins/{date}
   → each document: { date: 'YYYY-MM-DD', checkedInAt: serverTimestamp() }
   → use Firestore batch writes (max 500 per batch; split if needed)
   → skip dates that already exist in Firestore (set with merge: false, or check before writing)

5. Cloud Function recomputeStreak triggers on each new write and recomputes streak

6. streakStore.subscribeToFirestore(uid) is called → store switches to onSnapshot listener
   → streakStore.source becomes 'firestore'

7. Write streak_migration_offered = '1' to local settings table
```

#### Skip Behavior (on "Skip")

- Write `streak_migration_offered = '1'` to local settings (one-time offer enforced).
- `streakStore.subscribeToFirestore(uid)` is called — store switches to Firestore source.
- Local streak data is not migrated; the Firestore streak (which may be zero) becomes authoritative.

#### One-Time Offer Enforcement

The `streak_migration_offered` flag is written to the local settings table **regardless of whether the user chose Migrate or Skip**. On subsequent app launches, the migration modal is never shown again for this device.

---

## Notification System Design

### Mobile (expo-notifications)

```
Notification Lifecycle:
  1. App first launch → request permission (explain purpose)
  2. Permission granted → schedule daily local notification
  3. Each day at notification_time:
     a. Check if user has read at least one dhikr today (streak.lastCheckin == today)
     b. If not read → fire notification with Dhikr of the Day
     c. If already read → cancel/skip notification
  4. On app open → cancel today's pending notification
  5. On notification tap → navigate to dhikr/[id] for featured dhikr
```

The Dhikr of the Day is selected using a deterministic rotation algorithm:

```typescript
// src/utils/dhikrOfDay.ts
export function getDhikrOfDayId(
  allDhikrIds: number[],
  history: number[],  // last 30 dhikr IDs shown
  today: string       // 'YYYY-MM-DD'
): number {
  // Filter out recently shown dhikr (within 30-day window)
  const eligible = allDhikrIds.filter(id => !history.includes(id));
  const pool = eligible.length > 0 ? eligible : allDhikrIds;
  // Deterministic selection based on date seed
  const seed = parseInt(today.replace(/-/g, ''), 10);
  return pool[seed % pool.length];
}
```

### Web (Web Push API)

Web push notifications require a VAPID key pair and a push subscription stored server-side. For the PWA:

1. On permission grant, subscribe to push via `PushManager.subscribe()`.
2. Store the push subscription endpoint in Firestore under `/users/{uid}/pushSubscriptions/{subscriptionId}`.
3. A Firebase Cloud Function (or scheduled job) sends push messages daily to subscriptions where the user has not checked in.

For Guest Users on web, local notification scheduling via the Notifications API is used where supported, with the same logic as mobile.

### Notification Payload

```json
{
  "title": "Daily Dhikr Reminder",
  "body": "سُبْحَانَ اللَّهِ — Glory be to Allah",
  "data": {
    "dhikrId": 42,
    "type": "daily_dhikr"
  },
  "icon": "/icons/icon-192.png"
}
```

---

## Error Handling

### Database Errors

- Content DB open failure (corrupted bundle): show a full-screen error with a "Reinstall app" prompt. This is unrecoverable.
- User DB migration failure: log error, attempt to recreate tables, preserve existing data where possible.
- Query errors: caught at the hook level; screens receive `{ data: null, error: Error }` and render an inline error state.

### Firebase / Network Errors

- Sign-in failure (network, cancelled): `authStore` catches the error, displays a toast message, does not crash. The user remains a Guest.
- Firestore write failure: Firestore SDK handles retry automatically via offline queue. No user-facing error for transient failures.
- Firestore read failure on sign-in: fall back to local SQLite data; show a banner "Could not sync — using local data".

### Content Update Errors

All content update errors are silent — the app never surfaces them to the user. The local content is always the fallback.

- **Manifest fetch failure** (network error, HTTP error, malformed JSON): caught in `checkForUpdates()`, service returns immediately, local content unchanged. No error displayed.
- **Patch download failure** (network error, HTTP error, malformed JSON): caught in `checkForUpdates()`, service returns immediately, local content unchanged. No error displayed.
- **Patch application failure** (SQLite error, constraint violation, partial write): the `expo-sqlite` transaction is rolled back automatically on any error inside the transaction callback. The `applyPatch()` promise rejects, the rejection is caught in `checkForUpdates()`, and the service returns silently. The local DB is guaranteed to be in its pre-patch state.

### Notification Errors

- Permission denied: settings screen shows a disabled toggle with a link to system settings.
- Scheduling failure: silently log; notifications are best-effort and not critical to core functionality.

### Input Validation

- GoPay number validation (Requirement 18.4): Indonesian mobile number format — must match `/^(\+62|62|0)8[1-9][0-9]{6,10}$/`.
- Todo title: must be non-empty after trimming whitespace.
- Search query: minimum 1 character after trimming; empty queries show no results without hitting the DB.

### Streak Migration Errors

- **Firestore batch write failure during migration**: if the batch write of local check-in dates to Firestore fails (network error, permission error), the app shows an inline error message in the `StreakMigrationModal` with a "Retry" button. The local `checkin_history` data is preserved in SQLite — it is never deleted until migration succeeds. The `streak_migration_offered` flag is NOT written on failure, so the user can retry on the next app launch.
- **Partial batch write failure** (some dates written, some not): the app treats this as a full failure and prompts retry. The `recomputeStreak` Cloud Function is idempotent — re-writing already-existing check-in documents is a no-op (duplicate guard in the function).

### Streak Nudge Errors

- **`useStreakNudge` hook throws** (e.g., SQLite read failure when checking settings): the error is caught silently and `shouldShow` defaults to `false`. The nudge is skipped for this session. No user-facing error is displayed — the nudge is non-critical UI.

### Reward Claim Pre-Validation Errors

- **Firestore streak read fails before claim submission** (network error): the app shows an error toast "Could not verify streak — please try again" and does not write the claim. The user can retry when connectivity is restored.

### Graceful Degradation

| Scenario | Behavior |
|---|---|
| No network, guest user | Full app functionality (content + session + favorites + streak); check-in is recorded locally when the user reads a dhikr |
| No network, signed-in user | Full functionality; Firestore writes queued for later sync |
| Firebase Auth unavailable | Guest mode only; sign-in button shows error toast |
| Notification permission denied | App works normally; notification settings toggle is disabled |
| Web Push not supported | Notification settings hidden on web; no error shown |
| Translation missing for locale | Fall back to English; show "(English)" notice next to translation |
| Manifest fetch fails (offline or error) | Content update skipped silently; app uses existing local content |
| Patch download fails | Content update skipped silently; app uses existing local content |
| Patch application fails (SQLite error) | Transaction rolled back; app uses pre-patch local content |
| Streak migration batch write fails | Error shown in StreakMigrationModal with Retry; local data preserved; migration flag not set |
| Firestore streak read fails before reward claim | Error toast shown; claim not submitted; user can retry |
| `useStreakNudge` hook throws | Nudge silently skipped for this session; no user-facing error |
| Firestore `onSnapshot` disconnects (authenticated user) | streakStore retains last known Firestore value; reconnects automatically when online |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The properties below apply to the Content Update System (Requirement 19) and the Server-Side Streak Verification, Streak Nudge, and Streak Migration features (Requirements 20–22). They are implemented using **fast-check** with a minimum of 100 iterations each.

Each property test is tagged:
```
// Feature: muslim-dhikr-app, Property N: <property text>
```

### Property 1: Version comparison drives update decision

*For any* local content version number and any version manifest, `checkForUpdates()` SHALL attempt to download a patch if and only if `manifest.latestVersion > localVersion`. When `localVersion >= manifest.latestVersion`, no download is initiated and the local DB is unchanged.

**Validates: Requirements 19.1, 19.2**

### Property 2: Patch application correctness and version persistence

*For any* valid initial SQLite DB state and any valid delta patch (with arbitrary additions, updates, and deletions), after `applyPatch(patch)` completes successfully: (a) every entry in `patch.additions` is present in the DB, (b) every entry in `patch.updates` reflects the updated field values, (c) no entry whose ID appears in `patch.deletions` remains in the DB, and (d) the `content_version` key in the settings table equals `patch.version`.

**Validates: Requirements 19.4, 19.5**

### Property 3: Silent failure on network errors

*For any* network error type (connection refused, timeout, HTTP 4xx/5xx, malformed JSON) occurring during either the manifest fetch or the patch download, `checkForUpdates()` SHALL complete without throwing, the local DB state SHALL be unchanged, and the `content_version` setting SHALL be unchanged.

**Validates: Requirements 19.7, 19.8**

### Property 4: Rollback preserves original DB state

*For any* initial SQLite DB state and any delta patch where the application fails at an arbitrary point mid-transaction (simulated by injecting an error after N SQL statements), the DB state after the failed `applyPatch()` call SHALL be byte-for-byte identical to the DB state before the call was made.

**Validates: Requirement 19.9**

### Property 5: Cloud Function generates correct delta

*For any* pair of content snapshots (previousEntries, currentEntries), the delta computed by `generateContentPatch` logic SHALL satisfy: (a) `additions` contains exactly the entries present in `currentEntries` but not in `previousEntries`, (b) `updates` contains exactly the entries present in both snapshots where `currentEntry.version > previousEntry.version`, and (c) `deletions` contains exactly the IDs present in `previousEntries` but not in `currentEntries`.

**Validates: Requirement 19.12**

### Property 6: Streak counting correctness

*For any* non-empty set of calendar date strings (representing check-in history), the `recomputeStreak` Cloud Function's counting logic SHALL return a `currentStreak` equal to the length of the longest consecutive-day run ending on the most recent date in the set, where "consecutive" means each date is exactly one calendar day after the previous.

**Validates: Requirements 20.3, 20.7**

### Property 7: Duplicate check-in idempotence

*For any* set of check-in dates that contains duplicate entries for one or more calendar days, the streak computed from the deduplicated set SHALL be identical to the streak computed from the original set with duplicates. The `recomputeStreak` function's duplicate guard ensures write-once semantics produce the same result as if duplicates were never written.

**Validates: Requirement 20.7**

### Property 8: Reward claim threshold validation

*For any* milestone value and any Firestore `currentStreak` value, the reward claim pre-validation SHALL accept the claim if and only if `currentStreak >= milestone`. For all inputs where `currentStreak < milestone`, the claim SHALL be rejected and no document SHALL be written to `reward_claims`.

**Validates: Requirement 20.6**

### Property 9: Streak nudge trigger conditions

*For any* combination of (localStreak, nudge_dismissed_permanently, nudge_last_dismissed_at, nudge_streak_at_last_dismissal, currentDate, isAuthenticated), the `useStreakNudge` hook SHALL return `shouldShow = true` if and only if: (a) user is a Guest, (b) localStreak >= 3, (c) nudge_dismissed_permanently is not '1', and (d) either no prior dismissal exists, or currentDate is more than 3 days after nudge_last_dismissed_at, or localStreak >= nudge_streak_at_last_dismissal + 7.

**Validates: Requirements 21.1, 21.4, 21.5, 21.6, 21.7**

### Property 10: Migration union merge correctness

*For any* set of local check-in dates and any set of remote Firestore check-in dates, the merged date set produced by the migration flow SHALL contain exactly the set union of both inputs — every date present in either set appears exactly once in the merged result, and no date absent from both sets appears in the merged result.

**Validates: Requirement 22.5**

### Property 11: Migration offer shown iff local streak > 0

*For any* local streak value, the `StreakMigrationModal` SHALL be shown if and only if `localStreak > 0` and `streak_migration_offered` is not set. For `localStreak = 0`, the modal SHALL NOT be shown regardless of other conditions.

**Validates: Requirement 22.2**

---

## Testing Strategy

### Unit Tests (Jest + React Native Testing Library)

Focus on pure functions and isolated component behavior:

- `src/utils/dhikrOfDay.ts` — rotation algorithm, 30-day window exclusion
- `src/utils/streak.ts` — streak increment, reset on missed day, milestone detection
- `src/utils/validation.ts` — GoPay number format validation, todo title validation
- `src/db/queries.ts` — query functions with an in-memory SQLite mock
- Zustand stores — action correctness, state transitions
- `Counter` component — tap increments, long-press reset, target display
- `ArabicText` component — RTL rendering, font size application
- `ContentUpdateService` — the following specific scenarios:
  - **Version comparison**: verify `checkForUpdates()` is a no-op when `localVersion >= manifest.latestVersion`
  - **Patch application correctness**: given a known initial DB state and a patch, verify additions are inserted, updates are applied, and deletions are removed
  - **Rollback on failure**: simulate a SQLite error mid-transaction, verify the DB state after the failed call is identical to the state before
  - **Version persistence**: after a successful `applyPatch()`, verify `content_version` in the settings table equals `patch.version`
  - **Non-blocking launch**: verify content queries succeed while a slow `checkForUpdates()` is in progress (mock a delayed fetch)
- `recomputeStreak` Cloud Function — the following specific scenarios:
  - **Consecutive day counting**: given a sorted list of consecutive dates, verify `currentStreak` equals the list length
  - **Gap detection**: given a date list with a gap, verify `currentStreak` counts only the run ending on the most recent date
  - **Single date**: verify `currentStreak = 1` and `longestStreak = 1` for a single check-in
  - **Duplicate check-in no-op**: simulate a write where `change.before.exists = true`, verify the function returns without recomputing
  - **longestStreak tracking**: verify `longestStreak` reflects the longest run across the full history, not just the current run
- `useStreakNudge` hook — the following specific scenarios:
  - **Threshold trigger**: verify `shouldShow = true` when `localStreak >= 3` and all other conditions met
  - **Below threshold**: verify `shouldShow = false` when `localStreak < 3`
  - **Authenticated user guard**: verify `shouldShow = false` when user is authenticated, regardless of streak
  - **Permanent dismissal**: verify `shouldShow = false` when `nudge_dismissed_permanently = '1'`
  - **3-day cooldown**: verify `shouldShow = false` when current date is within 3 days of `nudge_last_dismissed_at`
  - **Re-trigger on streak growth**: verify `shouldShow = true` when `localStreak >= nudge_streak_at_last_dismissal + 7`, even within the 3-day cooldown window
- `useDhikrView` hook — the following specific scenarios:
  - **Check-in on first dhikr view**: verify check-in is recorded (SQLite write for guest, Firestore write for authenticated) when `lastCheckin !== today` and the dhikr detail screen mounts
  - **Idempotent on same day**: verify check-in is NOT recorded again if `lastCheckin === today` and the user views another dhikr on the same day
  - **No check-in without dhikr view**: verify that navigating to the home screen or category list does NOT trigger a check-in (hook is not called from those screens)
- Migration flow — the following specific scenarios:
  - **Union merge logic**: given overlapping local and remote date sets, verify merged result equals the set union
  - **Empty local history**: verify migration modal is not shown when `localStreak = 0`
  - **One-time offer enforcement**: verify `streak_migration_offered` is written after modal is shown (both Migrate and Skip paths), and modal does not reappear on subsequent launches
  - **Skip path**: verify `streakStore.source` switches to `'firestore'` after skip, and local streak data is not written to Firestore
  - **Migrate path**: verify all local dates are batch-written to Firestore and `streakStore.source` switches to `'firestore'`

### Property-Based Tests (fast-check)

**fast-check** is the chosen PBT library for TypeScript. Each property test runs a minimum of 100 iterations.

Property tests are tagged with:
```
// Feature: muslim-dhikr-app, Property N: <property text>
```

See Correctness Properties section for the full list of properties to implement.

### Component Tests (React Native Testing Library)

- `DhikrCard` — renders Arabic text, source badge, favorite toggle
- `SessionProgress` — progress bar reflects current/total correctly
- `StreakWidget` — displays streak count, check-in state
- `TodoItem` — toggle, delete confirmation, edit flow

### End-to-End Tests

- **Detox** (Android + iOS): full session flow, check-in, favorites, sign-in
- **Playwright** (Web): PWA install prompt, offline mode, search, session flow

### Test Configuration

```typescript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterFramework: ['@testing-library/jest-native/extend-expect'],
  testPathPattern: ['__tests__/**/*.test.ts', '__tests__/**/*.test.tsx'],
};
```

Property tests use `fast-check` with `fc.assert(fc.property(...), { numRuns: 100 })`.

