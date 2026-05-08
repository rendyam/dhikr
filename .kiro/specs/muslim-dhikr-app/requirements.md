# Requirements Document

## Introduction

A cross-platform application (Android, iOS, and Web) that enables Muslims to access, read, and practice authentic adhkar (remembrances and supplications) sourced exclusively from the Qur'an and verified Hadiths, following the methodology of the Salaf us-Salih (pious predecessors). The app provides structured dhikr sessions, categorized supplications, and reference information (source, chain authenticity) so that users can perform their daily adhkar with confidence in the authenticity of each text — whether on a mobile device or a desktop/mobile web browser.

## Glossary

- **App**: The muslim-dhikr-app cross-platform application targeting Android, iOS, and Web browsers.
- **Web App**: The browser-accessible version of the App, served as a Progressive Web App (PWA) or responsive website.
- **Dhikr** (pl. **Adhkar**): An act of remembrance of Allah, consisting of a specific Arabic phrase or supplication prescribed in the Qur'an or authentic Sunnah.
- **Sunnah**: The recorded sayings, actions, and approvals of the Prophet Muhammad ﷺ as preserved in authenticated Hadith collections.
- **Hadith**: A narration attributed to the Prophet Muhammad ﷺ, classified by scholars according to its chain of transmission.
- **Salaf us-Salih**: The pious predecessors — the Companions of the Prophet, the Tabi'un, and the Taba' Tabi'in — whose understanding and practice of Islam serves as the reference methodology for this app.
- **Authenticity Grade**: A scholarly classification of a Hadith's reliability (e.g., Sahih — authentic, Hasan — good, Da'if — weak).
- **Category**: A thematic grouping of adhkar (e.g., Morning Adhkar, Evening Adhkar, After Prayer, Before Sleep, Entering/Leaving Home).
- **Session**: A guided sequence of adhkar belonging to a single Category, presented one dhikr at a time with repetition tracking.
- **Counter**: An in-app mechanism that tracks how many times the user has recited a given dhikr within a Session.
- **Arabic Text**: The original Arabic script of a dhikr.
- **Transliteration**: A Latin-script phonetic rendering of the Arabic text.
- **Translation**: A meaning-faithful rendering of the dhikr in the user's selected display language.
- **Source Reference**: The Qur'anic verse (Surah:Ayah) or Hadith collection and number from which a dhikr is drawn.
- **Content Database**: The local, bundled database of all adhkar content shipped with the App.
- **User**: A Muslim individual using the App on an Android or iOS device, or via a web browser on any platform.
- **Authenticated User**: A User who has signed in to the App using their Google account via Firebase Authentication.
- **Guest User**: A User who uses the App without signing in.
- **Check-in**: A daily action the User performs by opening the App and tapping a dedicated check-in button, recorded once per calendar day.
- **Streak**: A consecutive-day count of daily check-ins without a missed day.
- **Streak Milestone**: A predefined streak length (e.g., 7, 30, 100 days) at which the App awards the User a badge.
- **Badge**: A visual achievement awarded to the User upon reaching a Streak Milestone.
- **Dhikr of the Day**: A single dhikr entry selected by the App each calendar day to feature in the daily notification.
- **Daily Notification**: A push notification sent to the User's device on days when the User has not yet opened the App.
- **To-Do Item**: A user-created task or personal dhikr goal with a title, optional notes, and a completion state.
- **To-Do List**: The collection of all To-Do Items belonging to a User.
- **Reward Claim**: A voluntary submission by an Authenticated User of their GoPay phone number to receive a streak milestone reward.
- **Reward Status**: The state of a Reward Claim — one of: Pending (submitted, not yet processed), Sent (reward disbursed by the admin), or Claimed (acknowledged by the User).

---

## Requirements

### Requirement 1: Dhikr Content Library

**User Story:** As a Muslim user, I want to access a comprehensive library of authentic adhkar sourced from the Qur'an and verified Hadiths, so that I can be confident every dhikr I read is authentically established.

#### Acceptance Criteria

1. THE Content_Database SHALL contain adhkar sourced exclusively from the Qur'an or Hadiths graded Sahih or Hasan by recognized Hadith scholars.
2. THE Content_Database SHALL store, for each dhikr entry: the Arabic Text, Transliteration, Translation (in at least English), Source Reference, and Authenticity Grade.
3. WHEN a dhikr is derived from a Qur'anic verse, THE Content_Database SHALL record the Source Reference as the Surah name and Ayah number.
4. WHEN a dhikr is derived from a Hadith, THE Content_Database SHALL record the Source Reference as the Hadith collection name, book number, and Hadith number.
5. THE Content_Database SHALL assign each dhikr to one or more Categories.
6. THE Content_Database SHALL specify the prescribed repetition count for each dhikr where one is established in the Sunnah.

---

### Requirement 2: Dhikr Categories

**User Story:** As a Muslim user, I want adhkar organized into meaningful categories, so that I can quickly find the supplications appropriate for a given time or situation.

#### Acceptance Criteria

1. THE App SHALL provide at minimum the following Categories: Morning Adhkar, Evening Adhkar, After Prayer Adhkar, Before Sleep Adhkar, Waking Up Adhkar, Entering Home, Leaving Home, Eating, and General Remembrance.
2. WHEN the User opens the App, THE App SHALL display the full list of available Categories on the home screen.
3. WHEN the User selects a Category, THE App SHALL display all adhkar belonging to that Category in the order prescribed by the Sunnah or, where no order is established, in a consistent scholarly-reviewed order.
4. THE App SHALL display the name of each Category in both Arabic and the User's selected display language.

---

### Requirement 3: Dhikr Detail View

**User Story:** As a Muslim user, I want to read each dhikr with its Arabic text, transliteration, translation, and source, so that I can understand what I am reciting and verify its authenticity.

#### Acceptance Criteria

1. WHEN the User opens a dhikr entry, THE App SHALL display the Arabic Text in a legible Arabic font at a readable size.
2. WHEN the User opens a dhikr entry, THE App SHALL display the Translation of the dhikr.
3. WHEN the User opens a dhikr entry, THE App SHALL display the Source Reference and Authenticity Grade.
4. WHERE the User has enabled Transliteration in settings, THE App SHALL display the Transliteration alongside the Arabic Text.
5. WHEN the prescribed repetition count for a dhikr is stored in the Content_Database, THE App SHALL display that count to the User.

---

### Requirement 4: Guided Dhikr Session

**User Story:** As a Muslim user, I want to follow a guided session for a selected category, so that I can complete my adhkar in the correct order without losing track of my place or repetition count.

#### Acceptance Criteria

1. WHEN the User starts a Session for a Category, THE App SHALL present the first dhikr of that Category with its Arabic Text, Translation, and prescribed repetition count.
2. WHEN the User taps the Counter, THE App SHALL increment the Counter by one.
3. WHEN the Counter reaches the prescribed repetition count for the current dhikr, THE App SHALL provide a visual indication that the repetition is complete.
4. WHEN the repetition for the current dhikr is complete and the User advances, THE App SHALL navigate to the next dhikr in the Session.
5. WHEN the User completes the last dhikr in a Session, THE App SHALL display a Session completion screen.
6. WHEN the User exits a Session before completion, THE App SHALL discard the in-progress Counter state and return the User to the Category list.
7. IF the prescribed repetition count for a dhikr is not established in the Sunnah, THEN THE App SHALL allow the User to tap the Counter freely without enforcing a limit.

---

### Requirement 5: Repetition Counter

**User Story:** As a Muslim user, I want a simple counter to track my dhikr repetitions, so that I can focus on the remembrance without manually counting.

#### Acceptance Criteria

1. THE Counter SHALL display the current count and the target repetition count (e.g., "3 / 33") when a target is defined.
2. WHEN the User taps the Counter, THE App SHALL increment the count by exactly one.
3. WHEN the User long-presses the Counter, THE App SHALL reset the count to zero after displaying a confirmation prompt.
4. THE Counter SHALL remain visible and accessible throughout the active dhikr view without requiring scrolling.

---

### Requirement 6: Source and Authenticity Transparency

**User Story:** As a Muslim user, I want to see the scholarly source and authenticity grade for every dhikr, so that I can follow only what is established in the Qur'an and authentic Sunnah according to the way of the Salaf.

#### Acceptance Criteria

1. THE App SHALL display the Source Reference for every dhikr entry.
2. THE App SHALL display the Authenticity Grade for every Hadith-based dhikr entry.
3. WHEN the User taps the Source Reference, THE App SHALL display an expanded view showing the full Hadith text or Qur'anic verse context, the scholar(s) who graded it, and the grading rationale where available.
4. THE App SHALL include only adhkar with an Authenticity Grade of Sahih or Hasan; IF a dhikr's grade is Da'if or lower, THEN THE Content_Database SHALL exclude it.

---

### Requirement 7: Display Language and Localization

**User Story:** As a Muslim user, I want to use the app in my preferred language, so that I can understand the translations and navigate the interface comfortably.

#### Acceptance Criteria

1. THE App SHALL support English as the default display language at launch.
2. WHEN the User selects a display language in settings, THE App SHALL render all UI labels, Category names, and dhikr Translations in the selected language.
3. THE App SHALL always display Arabic Text in Arabic script regardless of the selected display language.
4. WHERE a Translation for a dhikr is not available in the selected display language, THE App SHALL fall back to the English Translation and display a notice to the User.

---

### Requirement 8: Text Size Accessibility

**User Story:** As a Muslim user, I want to adjust the text size, so that I can read the Arabic text and translations comfortably regardless of my vision needs.

#### Acceptance Criteria

1. THE App SHALL provide a text size setting with at minimum three levels: Small, Medium (default), and Large.
2. WHEN the User changes the text size setting, THE App SHALL apply the new size to all Arabic Text, Transliteration, and Translation text throughout the App without requiring a restart.
3. THE App SHALL persist the User's text size preference across sessions.

---

### Requirement 9: Offline Availability

**User Story:** As a Muslim user, I want to use the app without an internet connection, so that I can read my adhkar anywhere, including during prayer times when I may not have connectivity.

#### Acceptance Criteria

1. THE App SHALL bundle the complete Content_Database within the application package so that all adhkar content is available without a network connection.
2. WHEN the device has no network connection, THE App SHALL remain fully functional for browsing Categories, reading adhkar, and running Sessions.
3. THE App SHALL NOT require user account creation or login to access any dhikr content.

---

### Requirement 10: Favorites

**User Story:** As a Muslim user, I want to mark specific adhkar as favorites, so that I can quickly access the supplications I use most often.

#### Acceptance Criteria

1. WHEN the User marks a dhikr as a favorite, THE App SHALL add it to a dedicated Favorites list.
2. THE App SHALL display the Favorites list as an accessible section on the home screen.
3. WHEN the User removes a dhikr from favorites, THE App SHALL remove it from the Favorites list immediately.
4. THE App SHALL persist the User's Favorites list across sessions.
5. WHEN the Favorites list is empty, THE App SHALL display a prompt guiding the User to add adhkar from any Category.

---

### Requirement 11: Search

**User Story:** As a Muslim user, I want to search for a specific dhikr by keyword, so that I can find a particular supplication without browsing every category.

#### Acceptance Criteria

1. THE App SHALL provide a search interface accessible from the home screen.
2. WHEN the User enters a search query, THE App SHALL return all dhikr entries whose Arabic Text, Transliteration, or Translation contains the query string (case-insensitive for non-Arabic text).
3. WHEN no dhikr entries match the search query, THE App SHALL display a "No results found" message.
4. WHEN the User selects a search result, THE App SHALL navigate to the Dhikr Detail View for that entry.

---

### Requirement 12: Platform Compatibility

**User Story:** As a Muslim user on Android, iOS, or a web browser, I want the app to work reliably on my platform, so that I have a smooth experience regardless of how I access it.

#### Acceptance Criteria

1. THE App SHALL be deployable as a hybrid mobile application on Android (API level 26 and above) and iOS (version 14 and above).
2. THE App SHALL be accessible as a Web App via modern web browsers (Chrome, Firefox, Safari, Edge — latest two major versions) on both desktop and mobile.
3. THE App SHALL render Arabic Text correctly using right-to-left (RTL) layout on all platforms, including the Web App.
4. THE App SHALL follow platform-specific UI conventions for navigation (back gestures, tab bars) on Android and iOS respectively.
5. WHEN the App is launched on a mobile platform, THE App SHALL reach the home screen within 3 seconds on a mid-range device under normal operating conditions.
6. WHEN the Web App is loaded on a desktop browser with a standard broadband connection, THE App SHALL reach the home screen within 3 seconds.
7. THE Web App SHALL be responsive, adapting its layout appropriately for mobile-width, tablet-width, and desktop-width viewports.

---

### Requirement 13: Web Offline Support (PWA)

**User Story:** As a Muslim user accessing the app via a web browser, I want the app to work without an internet connection after my first visit, so that I can read my adhkar even when offline.

#### Acceptance Criteria

1. THE Web App SHALL be implemented as a Progressive Web App (PWA) with a service worker that caches all application assets and the Content Database on first load.
2. WHEN the User revisits the Web App without a network connection, THE Web App SHALL load and remain fully functional for browsing Categories, reading adhkar, and running Sessions.
3. THE Web App SHALL be installable to the home screen on supported mobile browsers (iOS Safari, Android Chrome) so that it can be launched like a native app.
4. WHEN a new version of the Web App is available, THE Web App SHALL notify the User and offer to reload with the updated content.

---

### Requirement 14: Daily Check-in and Streak Rewards

**User Story:** As a Muslim user, I want to check in daily and be rewarded for maintaining a consistent streak, so that I stay motivated to practice my adhkar every day.

#### Acceptance Criteria

1. THE App SHALL record a Check-in for the User the first time the User opens the App on a given calendar day.
2. THE App SHALL display a visible Check-in indicator on the home screen showing whether the User has checked in today.
3. THE App SHALL maintain a Streak counter that increments by one for each consecutive day the User checks in.
4. WHEN the User misses a calendar day without a Check-in, THE App SHALL reset the Streak counter to zero.
5. THE App SHALL display the User's current Streak count prominently on the home screen.
6. WHEN the User's Streak reaches a predefined Streak Milestone (at minimum: 7, 30, and 100 consecutive days), THE App SHALL award the User the corresponding Badge and display a congratulatory message.
7. THE App SHALL display all earned Badges in a dedicated section accessible from the home screen or profile.
8. THE App SHALL persist the User's Streak count and earned Badges across sessions.
9. WHEN the User is signed in, THE App SHALL sync the User's Streak count and Badges to their Firebase account so that progress is preserved across devices.
10. WHEN the User is not signed in, THE App SHALL store the Streak count and Badges locally on the device.

---

### Requirement 15: Daily Dhikr Notification

**User Story:** As a Muslim user, I want to receive a daily reminder with a dhikr when I haven't opened the app, so that I am gently encouraged to remember Allah throughout my day.

#### Acceptance Criteria

1. THE App SHALL request notification permission from the User on first launch, explaining that notifications will contain a daily dhikr reminder.
2. WHEN the User has not opened the App by a User-configured reminder time (default: 08:00 local time), THE App SHALL send a Daily Notification to the User's device.
3. THE Daily Notification SHALL include the Arabic Text and Translation of the Dhikr of the Day.
4. THE App SHALL select the Dhikr of the Day from the Content_Database, rotating through entries so that the same dhikr is not repeated within a 30-day window.
5. WHEN the User taps the Daily Notification, THE App SHALL open and navigate directly to the Dhikr Detail View for the featured Dhikr of the Day.
6. THE App SHALL allow the User to enable or disable Daily Notifications in settings.
7. THE App SHALL allow the User to configure the Daily Notification delivery time in settings.
8. WHEN the User has already opened the App on a given calendar day, THE App SHALL NOT send the Daily Notification for that day.
9. THE App SHALL deliver Daily Notifications on Android and iOS using the platform's native notification system.
10. THE Web App SHALL deliver Daily Notifications via the Web Push API on supported browsers, subject to the User granting browser notification permission.

---

### Requirement 16: Google Sign-In

**User Story:** As a Muslim user, I want to sign in with my Google account, so that my data is tied to my identity and I can access it from any device.

#### Acceptance Criteria

1. THE App SHALL provide a "Sign in with Google" option on a dedicated sign-in screen, powered by Firebase Authentication.
2. WHEN the User completes Google Sign-In, THE App SHALL create or retrieve their Firebase user account and return them to the screen they were on before signing in.
3. THE App SHALL allow the User to use all core features (browsing adhkar, sessions, counter) as a Guest User without requiring sign-in.
4. WHEN the User is signed in, THE App SHALL display their Google account display name and profile picture in the settings or profile section.
5. THE App SHALL provide a "Sign out" option in settings; WHEN the User signs out, THE App SHALL clear their local session and revert to Guest User mode.
6. WHEN the User signs in on a new device, THE App SHALL restore their synced data (Favorites, Streak, Badges, To-Do List) from Firebase.
7. THE App SHALL handle sign-in errors (network failure, cancelled sign-in) gracefully and display an appropriate message to the User without crashing.
8. THE App SHALL comply with Google Sign-In branding guidelines in the sign-in button presentation.

---

### Requirement 17: To-Do List

**User Story:** As a Muslim user, I want a personal to-do list where I can set dhikr goals and reminders for myself, so that I can track my own spiritual commitments beyond the built-in categories.

#### Acceptance Criteria

1. THE App SHALL provide a To-Do List screen accessible from the bottom tab navigation.
2. WHEN the User creates a To-Do Item, THE App SHALL require a title and optionally accept a notes field.
3. WHEN the User marks a To-Do Item as complete, THE App SHALL visually distinguish it from incomplete items (e.g., strikethrough or checkmark).
4. THE App SHALL allow the User to delete a To-Do Item; WHEN deleted, THE App SHALL remove it from the list immediately after a confirmation prompt.
5. THE App SHALL allow the User to edit the title and notes of an existing To-Do Item.
6. THE App SHALL persist the To-Do List locally for Guest Users using device storage.
7. WHEN the User is signed in as an Authenticated User, THE App SHALL sync the To-Do List to their Firebase Firestore account in real time.
8. WHEN the Authenticated User opens the App on a different device, THE App SHALL display the same To-Do List retrieved from Firestore.
9. WHEN the device has no network connection and the User is signed in, THE App SHALL allow full To-Do List read and write operations using a local cache, and SHALL sync changes to Firestore when connectivity is restored.
10. WHEN the To-Do List is empty, THE App SHALL display a prompt encouraging the User to add their first dhikr goal.

---

### Requirement 18: Streak Reward Claim

**User Story:** As a Muslim user who has earned a streak badge, I want to optionally submit my GoPay number so that I can receive a reward credit from the app team.

#### Acceptance Criteria

1. WHEN an Authenticated User earns a qualifying Streak Milestone badge (at minimum: 30 and 100 consecutive days), THE App SHALL display a reward claim prompt on the congratulations screen.
2. THE reward claim prompt SHALL clearly state that submitting a GoPay number is optional and that the number will only be used to disburse the streak reward.
3. THE reward claim prompt SHALL include a text input field for the User's GoPay phone number and a submit button.
4. WHEN the User submits a GoPay number, THE App SHALL validate that the input is a valid Indonesian mobile phone number format before accepting it.
5. WHEN the User submits a valid GoPay number, THE App SHALL store the Reward Claim in Firestore with the following fields: user ID, display name, email, GoPay number, badge milestone, submission timestamp, and Reward Status set to "Pending".
6. THE App SHALL display a confirmation message after successful submission, informing the User that the team will process the reward and contact them.
7. WHEN a Reward Claim for a given milestone has already been submitted by the User, THE App SHALL NOT show the claim prompt again for that same milestone.
8. THE App SHALL NOT require the User to submit a GoPay number to receive or keep their badge — the badge is awarded regardless.
9. THE App SHALL link to the privacy policy from the reward claim prompt, explaining how the GoPay number is stored and used.
10. THE App SHALL provide an admin-readable Firestore collection (`reward_claims`) containing all Pending Reward Claims, so that the app administrator can review and process disbursements manually.
