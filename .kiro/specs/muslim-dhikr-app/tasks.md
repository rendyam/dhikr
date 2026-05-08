# Tasks: Muslim Dhikr App

## Task Dependency Graph

```
Phase 1 — Foundation
  1 → 2 → 3 → 4

Phase 2 — Content Layer
  4 → 5 → 6 → 7 → 8

Phase 3 — Core UI
  7 → 9 → 10 → 11 → 12 → 13 → 14

Phase 4 — State & Persistence
  4 → 15 → 16 → 17 → 18

Phase 5 — Guided Session
  7, 16 → 19 → 20

Phase 6 — Favorites & Search
  7, 16 → 21 → 22

Phase 7 — Streak & Check-in
  4, 16 → 23 → 24 → 25 → 26

Phase 8 — Notifications
  23 → 27 → 28

Phase 9 — Authentication & Sync
  15, 23 → 29 → 30 → 31 → 32 → 33

Phase 10 — To-Do List
  16, 29 → 34 → 35

Phase 11 — Streak Nudge & Migration
  23, 29 → 36 → 37

Phase 12 — Reward Claims
  26, 29 → 38

Phase 13 — Content Update System
  4 → 39 → 40 → 41

Phase 14 — Firebase Cloud Functions
  39 → 42 → 43

Phase 15 — PWA / Web
  3 → 44 → 45

Phase 16 — Property-Based Tests
  40, 42, 23, 36, 37 → 46 → 47 → 48 → 49 → 50 → 51 → 52 → 53 → 54 → 55 → 56

Phase 17 — E2E Tests
  All screens complete → 57 → 58
```

---

## Tasks

### Phase 1 — Project Foundation

- [x] 1. Initialize Expo managed-workflow project with TypeScript strict mode
  - Run `npx create-expo-app muslim-dhikr-app --template expo-template-blank-typescript`
  - Enable `strict: true` in `tsconfig.json`
  - Configure path aliases (`@/` → `src/`) in `tsconfig.json` and `babel.config.js`
  - Add `.eslintrc.js` with `@typescript-eslint` + `eslint-plugin-react-native` rules
  - Add `.prettierrc` with project formatting conventions
  - Add `eas.json` with `development`, `preview`, and `production` build profiles
  - Verify `npx expo start` launches without errors
  - **Requirement**: Project scaffold (all requirements)

- [ ] 2. Install and configure core dependencies
  - Install Expo Router: `expo-router`, `expo-linking`, `expo-constants`, `expo-status-bar`
  - Install state management: `zustand`
  - Install database: `expo-sqlite`, `expo-file-system`, `expo-asset`
  - Install i18n: `i18next`, `react-i18next`
  - Install Firebase: `firebase`, `@react-native-firebase/app` (or Firebase JS SDK v9+)
  - Install auth helpers: `expo-auth-session`, `expo-crypto`, `expo-web-browser`
  - Install notifications: `expo-notifications`
  - Install fonts: `expo-font`, `@expo-google-fonts/amiri` (or local Amiri/Scheherazade font files)
  - Install testing: `jest`, `jest-expo`, `@testing-library/react-native`, `@testing-library/jest-native`, `fast-check`
  - Install Workbox CLI for PWA service worker generation
  - Pin all dependency versions (no open ranges)
  - **Requirement**: All requirements (dependency baseline)

- [ ] 3. Configure Expo Router file-based navigation structure
  - Create `app/_layout.tsx` — root stack layout with font loading gate
  - Create `app/(tabs)/_layout.tsx` — bottom tab navigator (Home, Favorites, Search, Todo, Profile)
  - Create stub screens: `app/(tabs)/index.tsx`, `app/(tabs)/favorites.tsx`, `app/(tabs)/search.tsx`, `app/(tabs)/todo.tsx`, `app/(tabs)/profile.tsx`
  - Create stub screens: `app/category/[id].tsx`, `app/dhikr/[id].tsx`, `app/session/[categoryId].tsx`, `app/settings.tsx`, `app/sign-in.tsx`, `app/source/[dhikrId].tsx`
  - Verify navigation between all stubs works on Android, iOS, and Web
  - **Requirement**: Requirements 2.2, 4.1, 11.1, 17.1

- [ ] 4. Set up design tokens and theme system
  - Create `src/theme/colors.ts` — semantic color tokens (primary, background, surface, text, border, success, warning, error)
  - Create `src/theme/typography.ts` — font families (Arabic: Amiri/Scheherazade, UI: system), size scale (small/medium/large for Arabic and UI text), line heights
  - Create `src/theme/spacing.ts` — spacing scale (4, 8, 12, 16, 24, 32, 48)
  - Create `src/theme/index.ts` — re-export all tokens
  - Load Arabic font via `expo-font` in `app/_layout.tsx`; block render until font is ready
  - **Requirement**: Requirements 3.1, 8.1, 8.2, 12.3


### Phase 2 — TypeScript Types & Database Layer

- [ ] 5. Define all TypeScript types
  - Create `src/types/content.ts` — `AuthenticityGrade`, `SourceType`, `TextSize`, `Locale`, `Category`, `Dhikr`, `PatchManifestEntry`, `VersionManifest`, `DhikrEntry`, `DeltaPatch`
  - Create `src/types/user.ts` — `TodoItem`, `StreakData`, `Badge`, `RewardStatus`, `RewardClaim`
  - Create `src/types/index.ts` — re-export all types
  - Ensure all types match the data models in design.md exactly
  - **Requirement**: All requirements (type safety baseline)

- [ ] 6. Implement SQLite database client
  - Create `src/db/client.ts` with `openContentDb()` and `openUserDb()` functions
  - `openContentDb()`: copy bundled `adhkar.db` from app assets to `FileSystem.documentDirectory/SQLite/adhkar.db` on first launch; open with `expo-sqlite`
  - `openUserDb()`: open `user.db` with `expo-sqlite`; run schema migrations on open
  - Implement user DB schema creation (settings, favorites, streak, badges, todos, checkin_history tables) with `CREATE TABLE IF NOT EXISTS`
  - Handle content DB open failure with a full-screen error state
  - **Requirement**: Requirements 9.1, 9.2, 14.8

- [ ] 7. Implement content database query functions
  - Create `src/db/queries.ts` with all typed query functions:
    - `getCategories(db, locale): Promise<Category[]>` — join categories + category_translations
    - `getCategoryById(db, id, locale): Promise<Category | null>`
    - `getDhikrByCategory(db, categoryId, locale): Promise<Dhikr[]>` — ordered by sort_order
    - `getDhikrById(db, id, locale): Promise<Dhikr | null>` — with translation fallback to 'en'
    - `searchDhikr(db, query, locale): Promise<Dhikr[]>` — FTS5 search on dhikr_fts
    - `getAllDhikrIds(db): Promise<number[]>` — for notification rotation
  - All queries must handle translation fallback: if locale row missing, fall back to 'en' and set `translationFallback: true`
  - No raw SQL outside this file
  - **Requirement**: Requirements 1.2, 2.3, 2.4, 3.2, 3.3, 7.2, 7.4, 11.2

- [ ] 8. Implement user database query functions
  - Add to `src/db/queries.ts`:
    - `getFavoriteIds(db): Promise<number[]>`
    - `addFavorite(db, dhikrId): Promise<void>`
    - `removeFavorite(db, dhikrId): Promise<void>`
    - `getStreak(db): Promise<StreakData>`
    - `upsertStreak(db, data: StreakData): Promise<void>`
    - `getBadges(db): Promise<Badge[]>`
    - `upsertBadge(db, badge: Badge): Promise<void>`
    - `getTodos(db): Promise<TodoItem[]>` — excludes soft-deleted (deleted_at IS NULL)
    - `upsertTodo(db, item: TodoItem): Promise<void>`
    - `softDeleteTodo(db, id): Promise<void>` — sets deleted_at
    - `getSetting(db, key): Promise<string | null>`
    - `setSetting(db, key, value): Promise<void>`
    - `getCheckinHistory(db): Promise<string[]>` — returns array of 'YYYY-MM-DD' strings
    - `recordCheckin(db, date, timestamp): Promise<void>`
  - **Requirement**: Requirements 10.4, 14.8, 17.6

- [ ] 9. Seed the bundled adhkar.db content database
  - Create `src/db/seed/` directory
  - Write seed script `src/db/seed/seed.ts` that populates categories, category_translations, dhikr, dhikr_translations, category_dhikr, and dhikr_fts tables
  - Seed at minimum the 9 required categories (Morning, Evening, After Prayer, Before Sleep, Waking Up, Entering Home, Leaving Home, Eating, General Remembrance) with Arabic names, English translations, **and Bahasa Indonesia translations** in `category_translations`
  - Seed at minimum 5 dhikr entries per category with Arabic text, transliteration, English translation, **Bahasa Indonesia translation**, source reference, authenticity grade, and repetition count where applicable
  - All seeded dhikr must be Sahih or Hasan grade only
  - Each dhikr entry in `dhikr_translations` must have rows for both `locale = 'en'` and `locale = 'id'`
  - Generate `adhkar.db` SQLite file and place at `src/db/seed/adhkar.db`
  - Register `adhkar.db` as an asset in `app.json` under `expo.assetBundlePatterns`
  - **Requirement**: Requirements 1.1–1.6, 2.1, 6.4, 7.2


### Phase 3 — i18n and Localization

- [ ] 10. Set up i18next localization
  - Create `src/i18n/index.ts` — initialize i18next with `react-i18next`, language detection, and fallback to 'en'
  - Create `src/i18n/locales/en.json` — all English UI strings (tab labels, button labels, empty states, error messages, settings labels, modal text)
  - Create `src/i18n/locales/id.json` — **complete Bahasa Indonesia translations** for all UI strings (tab labels, button labels, empty states, error messages, settings labels, modal text)
  - Configure `I18nManager.forceRTL(false)` for LTR languages; RTL toggle logic for Arabic UI (if Arabic UI locale is added later)
  - Export `useTranslation` re-export and `changeLanguage(locale)` helper
  - Initialize i18n in `app/_layout.tsx` before any screen renders
  - **Requirement**: Requirements 7.1, 7.2, 7.3, 7.5, 12.3

### Phase 4 — Shared UI Components

- [ ] 11. Implement ArabicText component
  - Create `src/components/ArabicText.tsx`
  - Props: `text: string`, `size: TextSize`, `style?: StyleProp<TextStyle>`
  - Renders text in Amiri/Scheherazade font with `writingDirection: 'rtl'` and `textAlign: 'right'`
  - Maps `TextSize` to font size values from `src/theme/typography.ts`
  - Accessible: `accessibilityLanguage="ar"`, `accessibilityRole="text"`
  - Write unit test: renders Arabic text, applies correct font size for each TextSize value
  - **Requirement**: Requirements 3.1, 8.2, 12.3

- [ ] 12. Implement SourceBadge component
  - Create `src/components/SourceBadge.tsx`
  - Props: `grade: AuthenticityGrade`
  - Renders a colored pill: green for 'sahih', amber for 'hasan'
  - Displays localized label via i18next
  - Write unit test: renders correct color and label for each grade
  - **Requirement**: Requirements 3.3, 6.1, 6.2

- [ ] 13. Implement Counter component
  - Create `src/components/Counter.tsx`
  - Props: `count: number`, `target?: number`, `onTap: () => void`, `onLongPress: () => void`
  - Displays `count` when no target; displays `count / target` when target defined
  - Shows a progress ring (SVG or Animated) that fills as count approaches target
  - Visual completion indicator when `count >= target`
  - Long-press triggers `onLongPress` (caller handles confirmation prompt)
  - Accessible: `accessibilityRole="button"`, `accessibilityLabel` describes current count
  - Counter must remain visible without scrolling (position: absolute or sticky layout)
  - Write unit tests: tap increments display, target display format, completion state, long-press callback
  - **Requirement**: Requirements 4.2, 4.3, 5.1, 5.2, 5.3, 5.4

- [ ] 14. Implement DhikrCard component
  - Create `src/components/DhikrCard.tsx`
  - Props: `dhikr: Dhikr`, `onPress: () => void`, `onFavorite: () => void`, `isFavorite: boolean`
  - Displays Arabic text snippet (first line), source badge, favorite toggle icon
  - Accessible: `accessibilityRole="button"`, favorite toggle has `accessibilityLabel`
  - Write unit test: renders Arabic text, source badge, favorite toggle; calls callbacks on press
  - **Requirement**: Requirements 2.3, 3.1, 10.1

- [ ] 15. Implement CategoryCard component
  - Create `src/components/CategoryCard.tsx`
  - Props: `category: Category`, `onPress: () => void`
  - Displays Arabic category name (`nameAr`) and translated name (`name`)
  - Grid card layout with appropriate padding and border radius
  - Accessible: `accessibilityRole="button"`
  - Write unit test: renders both Arabic and translated names, calls onPress
  - **Requirement**: Requirements 2.2, 2.4

- [ ] 16. Implement StreakWidget component
  - Create `src/components/StreakWidget.tsx`
  - Props: `streak: number`, `checkedInToday: boolean`
  - Displays flame icon + streak count; distinct visual state for checked-in vs not checked-in today
  - Accessible: `accessibilityLabel` describes streak count and check-in status
  - Write unit test: renders streak count, correct checked-in state styling
  - **Requirement**: Requirements 14.2, 14.5

- [ ] 17. Implement SessionProgress component
  - Create `src/components/SessionProgress.tsx`
  - Props: `current: number`, `total: number`
  - Renders a horizontal progress bar; `current / total` fill ratio
  - Accessible: `accessibilityRole="progressbar"`, `accessibilityValue`
  - Write unit test: progress bar width reflects current/total ratio
  - **Requirement**: Requirement 4.1

- [ ] 18. Implement TodoItem component
  - Create `src/components/TodoItem.tsx`
  - Props: `item: TodoItem`, `onToggle: () => void`, `onDelete: () => void`, `onEdit: () => void`
  - Checkbox + title; completed items show strikethrough
  - Swipe-to-delete gesture (or delete button) with confirmation prompt
  - Accessible: `accessibilityRole="checkbox"`, `accessibilityState.checked`
  - Write unit test: toggle changes visual state, delete calls onDelete, edit calls onEdit
  - **Requirement**: Requirements 17.3, 17.4, 17.5

- [ ] 19. Implement BadgeDisplay component
  - Create `src/components/BadgeDisplay.tsx`
  - Props: `badges: Badge[]`
  - Renders a grid of earned badge icons (flame/star icons for 7, 30, 100 milestones)
  - Unearned milestones shown as locked/greyed out
  - Accessible: each badge has `accessibilityLabel` describing milestone and earned date
  - Write unit test: renders earned badges, greyed-out unearned badges
  - **Requirement**: Requirements 14.6, 14.7


### Phase 5 — Zustand Stores

- [ ] 20. Implement settingsStore
  - Create `src/store/settingsStore.ts`
  - State: `language: Locale`, `textSize: TextSize`, `showTransliteration: boolean`, `notificationEnabled: boolean`, `notificationTime: string`
  - Actions: `setLanguage`, `setTextSize`, `toggleTransliteration`, `setNotificationEnabled`, `setNotificationTime`
  - Persist via `zustand/middleware/persist` → AsyncStorage (mobile) / localStorage (web)
  - `setLanguage` must call `i18next.changeLanguage(lang)` and update `I18nManager` RTL flag
  - Write unit tests: each action updates state correctly; persisted state is restored on re-hydration
  - **Requirement**: Requirements 7.2, 8.1, 8.3, 15.6, 15.7

- [ ] 21. Implement favoritesStore
  - Create `src/store/favoritesStore.ts`
  - State: `dhikrIds: Set<number>`
  - Actions: `addFavorite(dhikrId)`, `removeFavorite(dhikrId)`, `isFavorite(dhikrId)`, `hydrate(ids)`
  - `addFavorite` / `removeFavorite` write to local SQLite `favorites` table
  - `hydrate` is called on app start from DB
  - Write unit tests: add/remove/isFavorite state transitions; hydrate populates set
  - **Requirement**: Requirements 10.1, 10.3, 10.4

- [ ] 22. Implement sessionStore
  - Create `src/store/sessionStore.ts`
  - State: `categoryId`, `dhikrIds`, `currentIndex`, `count`, `isComplete`
  - Actions: `startSession`, `increment`, `resetCount`, `advance`, `exitSession`
  - `advance`: if `currentIndex + 1 < dhikrIds.length`, increment index and reset count; else set `isComplete = true`
  - `exitSession`: reset all state to initial values (not persisted)
  - Store is NOT persisted — session state is ephemeral
  - Write unit tests: increment, advance to next dhikr, advance past last dhikr sets isComplete, exitSession resets state
  - **Requirement**: Requirements 4.2, 4.4, 4.5, 4.6

- [ ] 23. Implement streakStore
  - Create `src/store/streakStore.ts`
  - State: `currentStreak`, `lastCheckin`, `longestStreak`, `checkedInToday`, `badges`, `source`
  - Actions: `checkIn()`, `hydrate(data, badges, source?)`, `subscribeToFirestore(uid)`
  - `checkIn()`: idempotent — if `lastCheckin === today`, no-op; else increment streak (or reset to 1 if missed day), update `longestStreak`, write to SQLite, check badge milestones
  - `subscribeToFirestore(uid)`: sets up `onSnapshot` on `/users/{uid}/streak/data`; updates store from snapshot; sets `source = 'firestore'`; returns unsubscribe function
  - Badge milestone check: after streak increment, if `currentStreak` is 7, 30, or 100 and badge not yet earned, write badge to SQLite and store
  - Write unit tests: checkIn increments streak, checkIn is idempotent same day, missed day resets streak, milestone badge awarded at 7/30/100
  - **Requirement**: Requirements 14.1, 14.3, 14.4, 14.6, 14.8, 14.9, 14.10

- [ ] 24. Implement authStore
  - Create `src/store/authStore.ts`
  - State: `user: FirebaseUser | null`, `isLoading: boolean`
  - Actions: `signInWithGoogle()`, `signOut()`, `setUser(user)`
  - `signInWithGoogle()`: use `expo-auth-session` on mobile, `signInWithPopup` on web; exchange for Firebase credential; call `firebase.auth().signInWithCredential()`
  - `signOut()`: call `firebase.auth().signOut()`; clear local session state; revert to Guest mode
  - Not persisted — Firebase SDK manages token persistence
  - Write unit tests: setUser updates state, signOut clears user, error during signIn leaves user as null
  - **Requirement**: Requirements 16.1, 16.2, 16.5, 16.7

- [ ] 25. Implement todoStore
  - Create `src/store/todoStore.ts`
  - State: `items: TodoItem[]`
  - Actions: `addItem(title, notes?)`, `toggleItem(id)`, `editItem(id, title, notes?)`, `deleteItem(id)`, `hydrate(items)`
  - `addItem`: generate UUID v4 id, set `createdAt` and `updatedAt` to `Date.now()`, write to SQLite
  - `toggleItem`: flip `completed`, update `updatedAt`, write to SQLite
  - `editItem`: update title/notes, update `updatedAt`, write to SQLite
  - `deleteItem`: soft-delete (set `deletedAt`), write to SQLite; remove from in-memory `items`
  - Title validation: reject empty/whitespace-only titles
  - Write unit tests: add/toggle/edit/delete state transitions; title validation rejects empty string
  - **Requirement**: Requirements 17.2, 17.3, 17.4, 17.5, 17.6


### Phase 6 — Custom Hooks

- [ ] 26. Implement useCategories and useDhikrByCategory hooks
  - Create `src/hooks/useCategories.ts` — calls `getCategories(db, locale)` on mount; returns `{ categories, isLoading, error }`
  - Create `src/hooks/useDhikrByCategory.ts` — takes `categoryId`; calls `getDhikrByCategory(db, categoryId, locale)` on mount; returns `{ dhikrList, isLoading, error }`
  - Both hooks read `locale` from `settingsStore`
  - Error state: `{ data: null, error: Error }` passed to screen for inline error rendering
  - Write unit tests: loading state, data returned on success, error state on DB failure
  - **Requirement**: Requirements 2.2, 2.3, 2.4

- [ ] 27. Implement useDhikr hook
  - Create `src/hooks/useDhikr.ts` — takes `dhikrId`; calls `getDhikrById(db, id, locale)`; returns `{ dhikr, isLoading, error }`
  - Handles translation fallback: if `translationFallback === true`, screen shows "(English)" notice
  - Write unit tests: returns dhikr data, handles missing dhikr (null), handles translation fallback flag
  - **Requirement**: Requirements 3.1–3.5, 7.4

- [ ] 28. Implement useDhikrView hook
  - Create `src/hooks/useDhikrView.ts`
  - On mount: read `streakStore.lastCheckin`; compare to today's date (`'YYYY-MM-DD'`)
  - If `lastCheckin !== today`:
    - Guest: write to SQLite `checkin_history` + call `streakStore.checkIn()`
    - Authenticated: write to Firestore `/users/{uid}/checkins/{date}` with `serverTimestamp()` + write to SQLite + call `streakStore.checkIn()`
  - If `lastCheckin === today`: no-op
  - Hook is idempotent — safe to call on every dhikr screen mount
  - Write unit tests: check-in recorded on first view, no-op on same-day second view, guest writes to SQLite only, authenticated writes to both
  - **Requirement**: Requirements 14.1, 20.1, 20.2

- [ ] 29. Implement useSearch hook
  - Create `src/hooks/useSearch.ts`
  - Takes `query: string`; debounces 300ms; calls `searchDhikr(db, query, locale)` when `query.trim().length >= 1`
  - Returns `{ results, isLoading, isEmpty }` — `isEmpty` is true when query is non-empty but results are empty
  - Empty/whitespace query returns empty results without hitting DB
  - Write unit tests: debounce behavior, empty query returns no results, non-empty query returns results, no-results state
  - **Requirement**: Requirements 11.1, 11.2, 11.3

- [ ] 30. Implement useStreakNudge hook
  - Create `src/hooks/useStreakNudge.ts`
  - Returns `{ shouldShow: boolean, dismiss: () => void, dismissPermanently: () => void }`
  - `shouldShow = true` iff: user is Guest AND `localStreak >= 3` AND `nudge_dismissed_permanently !== '1'` AND (never dismissed OR >3 days since last dismissal OR streak grew by 7+ since last dismissal)
  - `dismiss()`: writes `nudge_last_dismissed_at = today` and `nudge_streak_at_last_dismissal = currentStreak` to SQLite settings
  - `dismissPermanently()`: writes `nudge_dismissed_permanently = '1'` to SQLite settings
  - Errors in hook are caught silently; `shouldShow` defaults to `false` on error
  - Write unit tests: all trigger conditions (threshold, authenticated guard, permanent dismissal, 3-day cooldown, streak growth re-trigger)
  - **Requirement**: Requirements 21.1–21.8

- [ ] 31. Implement useRewardClaim hook
  - Create `src/hooks/useRewardClaim.ts`
  - Returns `{ submitClaim, isSubmitting, error, isSubmitted }`
  - `submitClaim(milestone, gopayNumber)`:
    1. Validate GoPay number against `/^(\+62|62|0)8[1-9][0-9]{6,10}$/`
    2. Read Firestore streak doc; verify `currentStreak >= milestone`; reject with error if not
    3. Write to `reward_claims` collection with all required fields
    4. Set `isSubmitted = true`
  - Handles Firestore read failure with error toast message
  - Write unit tests: valid GoPay number accepted, invalid rejected, streak below milestone rejected, successful submission sets isSubmitted
  - **Requirement**: Requirements 18.1–18.10, 20.6


### Phase 7 — Screens

- [ ] 32. Implement Home screen
  - Implement `app/(tabs)/index.tsx`
  - Display `StreakWidget` (streak count + checked-in state) prominently at top
  - Display category grid using `CategoryCard` components (from `useCategories` hook)
  - Display Favorites shortcut section (shows first 3 favorites or empty-state prompt)
  - Navigate to `category/[id]` on category card press
  - Navigate to `favorites` tab on favorites shortcut press
  - Mount `useStreakNudge` hook; render `StreakNudgeModal` when `shouldShow === true`
  - Write component test: renders streak widget, category grid, favorites shortcut; navigates on press
  - **Requirement**: Requirements 2.2, 10.2, 14.2, 14.5, 21.1

- [ ] 33. Implement Category Detail screen
  - Implement `app/category/[id].tsx`
  - Display category name (Arabic + translated) as header
  - Display ordered list of `DhikrCard` components (from `useDhikrByCategory` hook)
  - "Start Session" button navigates to `session/[categoryId]`
  - Navigate to `dhikr/[id]` on card press
  - Favorite toggle on each card calls `favoritesStore.addFavorite` / `removeFavorite`
  - Write component test: renders category name, dhikr list, start session button; favorite toggle works
  - **Requirement**: Requirements 2.3, 2.4, 4.1

- [ ] 34. Implement Dhikr Detail screen
  - Implement `app/dhikr/[id].tsx`
  - Display Arabic text (`ArabicText` component at readable size)
  - Display translation; show "(English)" notice if `translationFallback === true`
  - Display source reference and `SourceBadge`
  - Display transliteration if `settingsStore.showTransliteration === true`
  - Display prescribed repetition count if available
  - Favorite toggle button in header
  - "View Source" button navigates to `source/[dhikrId]` (modal)
  - Call `useDhikrView()` hook on mount (triggers check-in)
  - Write component test: renders all fields, transliteration conditional, translation fallback notice, useDhikrView called on mount
  - **Requirement**: Requirements 3.1–3.5, 6.1, 6.2, 7.4, 14.1

- [ ] 35. Implement Source Detail screen
  - Implement `app/source/[dhikrId].tsx` (modal presentation)
  - Display full Hadith text or Qur'anic verse context
  - Display scholar name(s) who graded it
  - Display grading rationale where available
  - Display source reference (collection, book, hadith number or Surah:Ayah)
  - Write component test: renders all source fields, handles null grading rationale gracefully
  - **Requirement**: Requirements 6.3

- [ ] 36. Implement Guided Session screen
  - Implement `app/session/[categoryId].tsx`
  - On mount: load dhikr IDs for category; call `sessionStore.startSession(categoryId, dhikrIds)`
  - Display current dhikr: Arabic text, translation, repetition count
  - Display `Counter` component; tap calls `sessionStore.increment()`
  - Display `SessionProgress` bar (currentIndex + 1 / total)
  - When `count >= target` (if target defined): show visual completion indicator; "Next" button calls `sessionStore.advance()`
  - When `target` is null: "Next" button always available
  - When `isComplete === true`: navigate to session completion screen (inline or separate route)
  - Back/exit button calls `sessionStore.exitSession()` with confirmation prompt; navigates back
  - Write component test: counter increments, advance navigates to next dhikr, completion screen shown, exit resets session
  - **Requirement**: Requirements 4.1–4.7, 5.1–5.4

- [ ] 37. Implement Favorites screen
  - Implement `app/(tabs)/favorites.tsx`
  - Load favorite dhikr entries using `favoritesStore.dhikrIds` + `getDhikrById` for each
  - Display list of `DhikrCard` components
  - Empty state: prompt to add favorites from any category
  - Navigate to `dhikr/[id]` on card press
  - Favorite toggle removes from favorites immediately
  - Write component test: renders favorites list, empty state, remove favorite updates list
  - **Requirement**: Requirements 10.1–10.5

- [ ] 38. Implement Search screen
  - Implement `app/(tabs)/search.tsx`
  - Search input at top; calls `useSearch` hook with debounced query
  - Display list of `DhikrCard` results
  - "No results found" message when `isEmpty === true`
  - Navigate to `dhikr/[id]` on result press
  - Write component test: renders search input, results list, no-results state, navigation on press
  - **Requirement**: Requirements 11.1–11.4

- [ ] 39. Implement To-Do List screen
  - Implement `app/(tabs)/todo.tsx`
  - Display list of `TodoItem` components from `todoStore.items`
  - "Add" button opens inline form or modal: title input (required) + notes input (optional)
  - Empty state: prompt to add first dhikr goal
  - Toggle, edit, delete wired to `todoStore` actions
  - Delete shows confirmation prompt before calling `todoStore.deleteItem`
  - Write component test: renders todo list, add form validation (empty title rejected), toggle/delete/edit work
  - **Requirement**: Requirements 17.1–17.10

- [ ] 40. Implement Profile screen
  - Implement `app/(tabs)/profile.tsx`
  - Guest state: "Sign in with Google" button navigates to `sign-in`
  - Authenticated state: display Google display name + profile picture
  - Links to `settings` screen
  - Display earned badges via `BadgeDisplay` component
  - "Sign out" button calls `authStore.signOut()`
  - Write component test: guest state shows sign-in button, authenticated state shows user info and sign-out
  - **Requirement**: Requirements 14.7, 16.4, 16.5

- [ ] 41. Implement Settings screen
  - Implement `app/settings.tsx`
  - Language selector: shows English and Bahasa Indonesia as available options; calls `settingsStore.setLanguage()`; re-renders all UI strings immediately
  - Text size selector (Small / Medium / Large): calls `settingsStore.setTextSize()`; applies immediately
  - Transliteration toggle: calls `settingsStore.toggleTransliteration()`
  - Notification toggle: calls `settingsStore.setNotificationEnabled()`; disabled with link to system settings if permission denied
  - Notification time picker: calls `settingsStore.setNotificationTime()`
  - Write component test: language change to 'id' updates all UI strings to Indonesian, text size change applies to Arabic text, notification toggle disabled when permission denied
  - **Requirement**: Requirements 7.2, 7.3, 8.1, 8.2, 8.3, 15.6, 15.7

- [ ] 42. Implement Sign-In screen
  - Implement `app/sign-in.tsx`
  - "Sign in with Google" button styled per Google branding guidelines
  - Calls `authStore.signInWithGoogle()`; shows loading state during sign-in
  - On success: navigate back to previous screen; trigger data sync + streak migration check
  - On error: display error toast (network failure, cancelled sign-in); remain on screen
  - Write component test: button triggers sign-in, loading state shown, error toast on failure, navigation on success
  - **Requirement**: Requirements 16.1, 16.2, 16.7, 16.8


### Phase 8 — Streak Nudge & Migration Modals

- [ ] 43. Implement StreakNudgeModal component
  - Create `src/components/StreakNudgeModal.tsx`
  - Props: `visible: boolean`, `streak: number`, `onSignIn: () => void`, `onLater: () => void`, `onDismissPermanently: () => void`
  - Bottom sheet modal (non-blocking)
  - Explains streak is device-only for Guest Users; will be lost on uninstall/device change
  - "Sign In" button calls `onSignIn` (navigates to sign-in screen)
  - "Maybe Later" button calls `onLater`
  - "Don't show again" option calls `onDismissPermanently`
  - Write component test: all three buttons call correct callbacks, streak count displayed
  - **Requirement**: Requirements 21.1–21.8

- [ ] 44. Implement StreakMigrationModal component
  - Create `src/components/StreakMigrationModal.tsx`
  - Props: `visible: boolean`, `localStreak: number`, `onMigrate: () => void`, `onSkip: () => void`, `isLoading: boolean`, `error: string | null`
  - Displays local streak count; explains migration offer
  - "Migrate" button calls `onMigrate`; shows loading state during migration
  - "Skip" button calls `onSkip`
  - Shows inline error with "Retry" button if `error` is set
  - Write component test: displays streak count, migrate/skip callbacks, loading state, error with retry
  - **Requirement**: Requirements 22.1–22.8

- [ ] 45. Implement streak migration flow
  - Create `src/hooks/useStreakMigration.ts`
  - After Google Sign-In: check `streak_migration_offered` setting; if not set AND `localStreak > 0`, show `StreakMigrationModal`
  - `onMigrate()`:
    1. Read `checkin_history` from SQLite → `localDates`
    2. Read Firestore `/users/{uid}/checkins` → `remoteDates`
    3. Compute union: `mergedDates = Array.from(new Set([...localDates, ...remoteDates]))`
    4. Batch-write merged dates to Firestore (split into batches of 500)
    5. Call `streakStore.subscribeToFirestore(uid)`
    6. Write `streak_migration_offered = '1'` to SQLite settings
  - `onSkip()`: write `streak_migration_offered = '1'`; call `streakStore.subscribeToFirestore(uid)`
  - On batch write failure: show error in modal with Retry; do NOT write `streak_migration_offered` flag
  - Write unit tests: union merge logic, one-time offer enforcement, skip path switches source to firestore, migrate path writes all dates
  - **Requirement**: Requirements 22.1–22.8

### Phase 9 — Firebase Integration & Sync

- [ ] 46. Configure Firebase project and initialize SDK
  - Create Firebase project in Firebase Console
  - Enable Firebase Authentication (Google Sign-In provider)
  - Enable Firestore (production mode with security rules from design.md)
  - Enable Firebase Storage
  - Enable Firebase Cloud Messaging
  - Add `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) to project
  - Create `src/services/firebase.ts` — initialize Firebase app, export `auth`, `firestore`, `storage` instances
  - Configure Firestore offline persistence: `enableIndexedDbPersistence()` (web) / default on mobile
  - Deploy Firestore security rules from design.md
  - **Requirement**: Requirements 16.1, 17.7, 20.1

- [ ] 47. Implement Firestore sync for favorites
  - In `favoritesStore.addFavorite` / `removeFavorite`: if user is authenticated, also write to/delete from Firestore `/users/{uid}/favorites/{dhikrId}`
  - On sign-in: fetch Firestore favorites; merge with local SQLite favorites (union merge — a favorite added on any device is kept); write merged set back to both
  - Set up `onSnapshot` listener on `/users/{uid}/favorites` for real-time sync across devices
  - Write unit tests: local write always happens first, Firestore write is fire-and-forget, merge on sign-in
  - **Requirement**: Requirements 10.4, 16.6

- [ ] 48. Implement Firestore sync for todos
  - In `todoStore` actions: if user is authenticated, mirror every write to Firestore `/users/{uid}/todos/{todoId}`
  - On sign-in: fetch Firestore todos; merge with local SQLite todos using `updatedAt` timestamp (most recent wins); preserve tombstones (soft-deleted items) for 30 days
  - Set up `onSnapshot` listener on `/users/{uid}/todos` for real-time sync
  - Offline: Firestore SDK queues writes; syncs when connectivity restored
  - Write unit tests: local write first, Firestore sync, conflict resolution (updatedAt wins), tombstone preservation
  - **Requirement**: Requirements 17.7, 17.8, 17.9, 16.6

- [ ] 49. Implement data restore on new device sign-in
  - After sign-in, if this is a new device (no local data or first sign-in): fetch all user data from Firestore (favorites, streak, badges, todos)
  - Merge with any existing local data using appropriate merge strategies
  - Hydrate all Zustand stores with merged data
  - Show banner "Could not sync — using local data" if Firestore read fails
  - Write unit tests: data restored from Firestore on new device, fallback to local on Firestore failure
  - **Requirement**: Requirement 16.6


### Phase 10 — Notification System

- [ ] 50. Implement notification permission request and scheduling (mobile)
  - Create `src/services/notifications.ts`
  - On first app launch: call `expo-notifications` permission request with explanation text
  - `scheduleDaily(time: string, dhikrId: number, arabicText: string, translation: string)`: schedule a daily local notification at the configured time
  - `cancelTodayNotification()`: cancel today's pending notification (called on app open)
  - `getDhikrOfDayId(allDhikrIds, history, today)`: implement deterministic rotation algorithm from design.md (in `src/utils/dhikrOfDay.ts`)
  - Notification tap handler: navigate to `dhikr/[id]` for the featured dhikr
  - On app open: if `streak.lastCheckin === today`, cancel today's pending notification
  - Write unit tests for `getDhikrOfDayId`: rotation avoids 30-day history, falls back to full pool when all recently shown, deterministic for same date
  - **Requirement**: Requirements 15.1–15.9

- [ ] 51. Implement Web Push notifications (PWA)
  - In `web/service-worker.ts`: handle `push` event; display notification with payload
  - On permission grant (web): call `PushManager.subscribe()` with VAPID public key
  - Store push subscription in Firestore `/users/{uid}/pushSubscriptions/{subscriptionId}` (authenticated) or localStorage (guest)
  - Handle `notificationclick` event in service worker: navigate to dhikr detail
  - Hide notification settings on web if `PushManager` not supported
  - **Requirement**: Requirements 15.10, 13.1

### Phase 11 — Content Update System

- [ ] 52. Implement ContentUpdateService
  - Create `src/services/contentUpdate.ts` with `ContentUpdateService` class as specified in design.md
  - Implement `checkForUpdates()`, `fetchManifest()`, `downloadPatch()`, `applyPatch()`, `rollbackPatch()`, `getLocalVersion()`
  - `applyPatch()`: single SQLite transaction — deletions, additions (INSERT OR REPLACE), updates (INSERT OR REPLACE), version persistence
  - All failures in `checkForUpdates()` are caught silently — no error surfaced to user
  - Call `ContentUpdateService.checkForUpdates()` in `app/_layout.tsx` as fire-and-forget after DB open (non-blocking)
  - Write unit tests: version comparison no-op, patch application correctness, rollback on failure, version persistence, non-blocking launch
  - **Requirement**: Requirements 19.1–19.10

- [ ] 53. Implement utility functions
  - Create `src/utils/dhikrOfDay.ts` — `getDhikrOfDayId(allDhikrIds, history, today)` as specified in design.md
  - Create `src/utils/streak.ts` — `computeStreak(dates: string[]): { currentStreak, longestStreak }` pure function (extracted from recomputeStreak logic for testability)
  - Create `src/utils/validation.ts` — `validateGopayNumber(input: string): boolean`, `validateTodoTitle(input: string): boolean`
  - Create `src/utils/date.ts` — `getTodayString(): string` (returns 'YYYY-MM-DD' in local time), `daysBetween(a: string, b: string): number`
  - Write unit tests for all utility functions
  - **Requirement**: Requirements 15.4, 18.4, 20.3

### Phase 12 — Firebase Cloud Functions

- [ ] 54. Implement recomputeStreak Cloud Function
  - Create `functions/src/recomputeStreak.ts` as specified in design.md
  - Trigger: `onWrite` on `/users/{uid}/checkins/{date}`
  - Duplicate check-in guard: exit if `change.before.exists`
  - Read all check-in docs, sort dates, compute `currentStreak` and `longestStreak`
  - Write results to `/users/{uid}/streak/data` with `merge: true`
  - Deploy to Firebase Functions
  - Write unit tests: consecutive day counting, gap detection, single date, duplicate no-op, longestStreak tracking
  - **Requirement**: Requirements 20.3, 20.4, 20.7

- [ ] 55. Implement generateContentPatch Cloud Function
  - Create `functions/src/generateContentPatch.ts` as specified in design.md
  - Trigger: `onWrite` on `/adhkar_content/{dhikrId}`
  - Read current manifest from Storage; compute new version number
  - Fetch all current content from Firestore; fetch previous snapshot from Storage
  - Compute delta (additions, updates, deletions) using `version` field comparison
  - Upload patch file to `content/patches/v{N}.json`
  - Save current snapshot to `content/snapshots/v{N}.json`
  - Update `content/manifest.json`
  - Deploy to Firebase Functions
  - Write unit tests: delta computation correctness (additions/updates/deletions), manifest update
  - **Requirement**: Requirements 19.11, 19.12

- [ ] 56. Implement sendDailyPushNotifications Cloud Function (web push)
  - Create `functions/src/sendDailyPush.ts`
  - Scheduled function (Cloud Scheduler): runs daily at configurable time
  - For each push subscription in Firestore: check if user has checked in today; if not, send push notification with Dhikr of the Day payload
  - Use Web Push protocol with VAPID keys
  - Handle expired/invalid subscriptions gracefully (remove from Firestore)
  - **Requirement**: Requirement 15.10


### Phase 13 — PWA / Web Support

- [ ] 57. Configure PWA manifest and service worker
  - Create `web/manifest.json` — app name, icons (192x192, 512x512), theme color, background color, `display: "standalone"`, `start_url`
  - Create `web/service-worker.ts` using Workbox as specified in design.md
  - Pre-cache: app shell (HTML, JS, CSS), `adhkar.db`, Arabic fonts, icons
  - Cache strategies: Cache First for static assets and `adhkar.db`; Stale-While-Revalidate for app shell
  - Handle `SKIP_WAITING` message for update flow
  - Register service worker in `app/_layout.tsx` (web platform only)
  - **Requirement**: Requirements 13.1, 13.2, 13.3

- [ ] 58. Implement PWA update notification banner
  - Create `src/components/UpdateBanner.tsx` — shown when a new service worker is waiting
  - "Reload" button sends `SKIP_WAITING` message to service worker and reloads page
  - Render in `app/_layout.tsx` (web only)
  - Write component test: banner appears when update available, reload button triggers skip waiting
  - **Requirement**: Requirement 13.4

- [ ] 59. Implement responsive layout for web
  - Add responsive breakpoints to all screens: mobile-width (<768px), tablet-width (768–1024px), desktop-width (>1024px)
  - Category grid: 2 columns on mobile, 3 on tablet, 4 on desktop
  - Dhikr detail: max-width container centered on desktop
  - Navigation: bottom tabs on mobile/tablet; sidebar or top nav on desktop
  - Test layouts at all three breakpoints
  - **Requirement**: Requirements 12.2, 12.7

### Phase 14 — Property-Based Tests (fast-check)

- [ ] 60. Write PBT: Property 1 — Version comparison drives update decision
  - File: `__tests__/pbt/contentUpdate.pbt.test.ts`
  - Use `fast-check` with `fc.assert(fc.property(...), { numRuns: 100 })`
  - Generator: arbitrary `localVersion: number` (non-negative integer) and arbitrary `VersionManifest` with `latestVersion: number`
  - Property: `checkForUpdates()` attempts download iff `manifest.latestVersion > localVersion`; when `localVersion >= manifest.latestVersion`, no fetch is called and DB is unchanged
  - Tag: `// Feature: muslim-dhikr-app, Property 1: Version comparison drives update decision`
  - **Validates: Requirements 19.1, 19.2**

- [ ] 61. Write PBT: Property 2 — Patch application correctness and version persistence
  - File: `__tests__/pbt/contentUpdate.pbt.test.ts`
  - Generator: arbitrary initial DB state (array of DhikrEntry) and arbitrary DeltaPatch (additions, updates, deletions with non-overlapping IDs)
  - Property: after `applyPatch(patch)` — (a) all additions present, (b) all updates reflect new values, (c) all deletions absent, (d) `content_version = patch.version`
  - Tag: `// Feature: muslim-dhikr-app, Property 2: Patch application correctness and version persistence`
  - **Validates: Requirements 19.4, 19.5**

- [ ] 62. Write PBT: Property 3 — Silent failure on network errors
  - File: `__tests__/pbt/contentUpdate.pbt.test.ts`
  - Generator: arbitrary network error type (connection refused, timeout, HTTP 4xx/5xx, malformed JSON) at manifest fetch or patch download stage
  - Property: `checkForUpdates()` completes without throwing; DB state unchanged; `content_version` unchanged
  - Tag: `// Feature: muslim-dhikr-app, Property 3: Silent failure on network errors`
  - **Validates: Requirements 19.7, 19.8**

- [ ] 63. Write PBT: Property 4 — Rollback preserves original DB state
  - File: `__tests__/pbt/contentUpdate.pbt.test.ts`
  - Generator: arbitrary initial DB state and arbitrary DeltaPatch; arbitrary failure point N (inject error after N SQL statements)
  - Property: DB state after failed `applyPatch()` is identical to DB state before the call
  - Tag: `// Feature: muslim-dhikr-app, Property 4: Rollback preserves original DB state`
  - **Validates: Requirement 19.9**

- [ ] 64. Write PBT: Property 5 — Cloud Function generates correct delta
  - File: `__tests__/pbt/generateContentPatch.pbt.test.ts`
  - Generator: arbitrary `previousEntries: DhikrEntry[]` and `currentEntries: DhikrEntry[]` (with version fields)
  - Property: computed delta satisfies — (a) additions = entries in current but not previous, (b) updates = entries in both where `current.version > previous.version`, (c) deletions = IDs in previous but not current
  - Tag: `// Feature: muslim-dhikr-app, Property 5: Cloud Function generates correct delta`
  - **Validates: Requirement 19.12**

- [ ] 65. Write PBT: Property 6 — Streak counting correctness
  - File: `__tests__/pbt/recomputeStreak.pbt.test.ts`
  - Generator: arbitrary non-empty array of calendar date strings (ISO format, sorted ascending, may have gaps)
  - Property: `computeStreak(dates).currentStreak` equals the length of the longest consecutive-day run ending on the most recent date
  - Tag: `// Feature: muslim-dhikr-app, Property 6: Streak counting correctness`
  - **Validates: Requirements 20.3, 20.7**

- [ ] 66. Write PBT: Property 7 — Duplicate check-in idempotence
  - File: `__tests__/pbt/recomputeStreak.pbt.test.ts`
  - Generator: arbitrary set of check-in dates; arbitrary subset of those dates to duplicate
  - Property: `computeStreak(datesWithDuplicates)` equals `computeStreak(deduplicatedDates)`
  - Tag: `// Feature: muslim-dhikr-app, Property 7: Duplicate check-in idempotence`
  - **Validates: Requirement 20.7**

- [ ] 67. Write PBT: Property 8 — Reward claim threshold validation
  - File: `__tests__/pbt/rewardClaim.pbt.test.ts`
  - Generator: arbitrary `milestone: number` (positive integer) and arbitrary `currentStreak: number` (non-negative integer)
  - Property: claim accepted iff `currentStreak >= milestone`; for all `currentStreak < milestone`, claim rejected and no Firestore write occurs
  - Tag: `// Feature: muslim-dhikr-app, Property 8: Reward claim threshold validation`
  - **Validates: Requirement 20.6**

- [ ] 68. Write PBT: Property 9 — Streak nudge trigger conditions
  - File: `__tests__/pbt/streakNudge.pbt.test.ts`
  - Generator: arbitrary combination of (localStreak, nudge_dismissed_permanently, nudge_last_dismissed_at, nudge_streak_at_last_dismissal, currentDate, isAuthenticated)
  - Property: `shouldShow === true` iff all four conditions from design.md are met simultaneously
  - Tag: `// Feature: muslim-dhikr-app, Property 9: Streak nudge trigger conditions`
  - **Validates: Requirements 21.1, 21.4, 21.5, 21.6, 21.7**

- [ ] 69. Write PBT: Property 10 — Migration union merge correctness
  - File: `__tests__/pbt/streakMigration.pbt.test.ts`
  - Generator: arbitrary `localDates: string[]` and `remoteDates: string[]` (ISO date strings)
  - Property: merged result equals `Array.from(new Set([...localDates, ...remoteDates]))` — every date in either set appears exactly once; no extra dates
  - Tag: `// Feature: muslim-dhikr-app, Property 10: Migration union merge correctness`
  - **Validates: Requirement 22.5**

- [ ] 70. Write PBT: Property 11 — Migration offer shown iff local streak > 0
  - File: `__tests__/pbt/streakMigration.pbt.test.ts`
  - Generator: arbitrary `localStreak: number` (non-negative integer) and arbitrary `streak_migration_offered` value
  - Property: `StreakMigrationModal` shown iff `localStreak > 0` AND `streak_migration_offered` is not set; for `localStreak = 0`, modal never shown
  - Tag: `// Feature: muslim-dhikr-app, Property 11: Migration offer shown iff local streak > 0`
  - **Validates: Requirement 22.2**


### Phase 15 — End-to-End Tests

- [ ] 71. Write Detox E2E tests (Android + iOS)
  - Create `e2e/detox/` directory with Detox configuration
  - Test: full guided session flow — open app → select category → start session → tap counter to target → advance through all dhikr → see completion screen
  - Test: check-in and streak — open app → navigate to dhikr detail → verify streak widget increments on home screen
  - Test: favorites — add dhikr to favorites → navigate to favorites tab → verify dhikr appears → remove → verify removed
  - Test: Google Sign-In flow (mocked) — tap sign in → complete OAuth → verify profile shown in Profile tab
  - Test: offline mode — disable network → open app → verify categories and dhikr load from local DB
  - **Requirement**: Requirements 4.1–4.7, 10.1–10.5, 14.1, 16.1–16.2

- [ ] 72. Write Playwright E2E tests (Web)
  - Create `e2e/playwright/` directory with Playwright configuration
  - Test: PWA install prompt appears on supported browsers
  - Test: offline mode — load app → go offline → navigate categories and dhikr → verify fully functional
  - Test: search flow — enter query → verify results → click result → verify dhikr detail
  - Test: full session flow on web — same as Detox test but via Playwright
  - Test: responsive layout — verify correct column count at mobile/tablet/desktop widths
  - **Requirement**: Requirements 11.1–11.4, 12.2, 12.7, 13.1, 13.2

### Phase 16 — App Configuration & Release Prep

- [ ] 73. Configure app.json for all platforms
  - Set `name`, `slug`, `version`, `orientation: "portrait"`, `icon`, `splash` screen
  - Configure Android: `package`, `versionCode`, `adaptiveIcon`, `permissions` (NOTIFICATIONS, INTERNET, VIBRATE)
  - Configure iOS: `bundleIdentifier`, `buildNumber`, `infoPlist` (notification usage description)
  - Configure web: `favicon`, `output: "static"`, `bundler: "metro"`
  - Set `assetBundlePatterns` to include `src/db/seed/adhkar.db` and `assets/fonts/**`
  - **Requirement**: Requirements 12.1, 12.2

- [ ] 74. Configure EAS Build and Submit
  - Configure `eas.json` with `development` (internal distribution), `preview` (TestFlight/internal track), and `production` profiles
  - Set up EAS environment variables for Firebase config (API keys, project IDs)
  - Verify `eas build --platform android --profile preview` succeeds
  - Verify `eas build --platform ios --profile preview` succeeds
  - **Requirement**: Requirements 12.1

- [ ] 75. Performance audit and optimization
  - Verify app reaches home screen within 3 seconds on mid-range device (Requirement 12.5)
  - Verify web app reaches home screen within 3 seconds on standard broadband (Requirement 12.6)
  - Profile SQLite query performance; add indexes if needed
  - Lazy-load non-critical screens (source detail, settings) to reduce initial bundle size
  - Verify Arabic font loading does not block home screen render beyond acceptable threshold
  - **Requirement**: Requirements 12.5, 12.6

---

## Task Summary

| Phase | Tasks | Key Deliverables |
|---|---|---|
| 1 — Foundation | 1–4 | Expo project, dependencies, navigation scaffold, design tokens |
| 2 — Content Layer | 5–9 | TypeScript types, SQLite client, query functions, seeded adhkar.db |
| 3 — i18n | 10 | i18next setup, English + Bahasa Indonesia locale files (complete UI string translations) |
| 4 — Shared Components | 11–19 | ArabicText, SourceBadge, Counter, DhikrCard, CategoryCard, StreakWidget, SessionProgress, TodoItem, BadgeDisplay |
| 5 — Zustand Stores | 20–25 | settingsStore, favoritesStore, sessionStore, streakStore, authStore, todoStore |
| 6 — Custom Hooks | 26–31 | useCategories, useDhikrByCategory, useDhikr, useDhikrView, useSearch, useStreakNudge, useRewardClaim |
| 7 — Screens | 32–42 | All 11 screens fully implemented |
| 8 — Modals | 43–45 | StreakNudgeModal, StreakMigrationModal, migration flow |
| 9 — Firebase | 46–49 | Firebase init, favorites sync, todos sync, data restore |
| 10 — Notifications | 50–51 | Mobile local notifications, Web Push |
| 11 — Content Update | 52–53 | ContentUpdateService, utility functions |
| 12 — Cloud Functions | 54–56 | recomputeStreak, generateContentPatch, sendDailyPush |
| 13 — PWA | 57–59 | Service worker, update banner, responsive layout |
| 14 — PBT | 60–70 | 11 property-based tests (Properties 1–11) |
| 15 — E2E | 71–72 | Detox (mobile) + Playwright (web) E2E suites |
| 16 — Release | 73–75 | app.json, EAS Build, performance audit |

**Total tasks: 75**

