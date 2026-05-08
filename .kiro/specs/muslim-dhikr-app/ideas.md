# Ideas Backlog

A running list of ideas for the Muslim Dhikr App. These are not committed to the current spec — they're candidates for future specs or requirements updates once the app has traction.

---

## Monetary Streak Rewards (GoPay / E-Wallet Credits)

**Idea:** Reward users with GoPay credits (e.g., up to Rp100.000) for maintaining daily check-in streaks.

**Status:** ✅ Added to requirements (Requirement 18) — implemented as a voluntary reward claim form. Users submit their GoPay number after earning a qualifying badge; the app team processes disbursements manually via the `reward_claims` Firestore collection.

---

## Google Sign-In and Cross-Device Sync

**Idea:** Allow users to sign in with Google and sync their favorites, streak, and to-do list across devices via Firebase.

**Status:** ✅ Added to requirements (Requirements 16 and 17).

---

## To-Do / Personal Dhikr List

**Idea:** A personal to-do list where users can add custom dhikr goals or reminders, synced across devices when signed in.

**Status:** ✅ Added to requirements (Requirement 17).

---

## Bahasa Indonesia Translation

**Idea:** Provide full Bahasa Indonesia translations for all UI strings, category names, and dhikr content so that Indonesian-speaking users can use the app entirely in their native language.

**Status:** ✅ Added to requirements (Requirement 7.2) — Bahasa Indonesia is a built-in display language at launch. UI strings are in `src/i18n/locales/id.json`; dhikr translations in Indonesian are seeded in the `dhikr_translations` table with `locale = 'id'`.

---

## Audio Recitation

**Idea:** Play an audio recitation of each dhikr so users can learn the correct pronunciation.

---

## Prayer Times Integration

**Idea:** Show the next prayer time on the home screen and suggest relevant adhkar (e.g., After Prayer adhkar) when a prayer time passes.

---

## Dark Mode

**Idea:** A dark color theme for comfortable use in low-light environments, especially for night-time adhkar.
