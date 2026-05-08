/**
 * Content type definitions for the Muslim Dhikr App.
 *
 * Requirements: All requirements (type safety baseline)
 */

export type AuthenticityGrade = 'sahih' | 'hasan';
export type SourceType = 'quran' | 'hadith';
export type TextSize = 'small' | 'medium' | 'large';
export type Locale = 'en' | 'id' | string;

export interface Category {
  id: number;
  slug: string;
  nameAr: string;
  name: string; // translated for current locale
  sortOrder: number;
}

export interface Dhikr {
  id: number;
  arabicText: string;
  transliteration: string | null;
  translation: string; // for current locale, falls back to 'en'
  translationFallback: boolean; // true if fell back to English
  repetitionCount: number | null;
  sourceType: SourceType;
  // Qur'an source fields
  surahName: string | null;
  ayahNumber: number | null;
  // Hadith source fields
  collectionName: string | null;
  bookNumber: string | null;
  hadithNumber: string | null;
  // Authenticity
  authenticityGrade: AuthenticityGrade;
  scholarNames: string[];
  gradingRationale: string | null;
  fullHadithText: string | null;
}

export interface PatchManifestEntry {
  version: number;
  baseVersion: number;
  url: string;
}

export interface VersionManifest {
  latestVersion: number;
  patches: PatchManifestEntry[];
}

/**
 * A single dhikr entry as represented in a delta patch file.
 * Translations are included inline for patch application.
 */
export interface DhikrEntry {
  id: number;
  arabicText: string;
  transliteration: string | null;
  repetitionCount: number | null;
  sourceType: SourceType;
  surahName: string | null;
  ayahNumber: number | null;
  collectionName: string | null;
  bookNumber: string | null;
  hadithNumber: string | null;
  authenticityGrade: AuthenticityGrade;
  scholarNames: string[];
  gradingRationale: string | null;
  fullHadithText: string | null;
  sortOrder: number;
  translations: Array<{ locale: string; translation: string }>;
}

/**
 * A delta patch file describing changes between two content versions.
 * Applied to the local SQLite database by ContentUpdateService.
 */
export interface DeltaPatch {
  version: number;
  baseVersion: number;
  additions: DhikrEntry[];
  updates: DhikrEntry[];
  deletions: number[]; // dhikr IDs to DELETE
}
