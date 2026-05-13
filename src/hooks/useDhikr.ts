/**
 * useDhikr hook — fetches a single dhikr entry by ID from the content database.
 *
 * Calls `getDhikrById(db, id, locale)` on mount (and whenever `dhikrId` or
 * `locale` changes) using the locale from `settingsStore`. Returns loading,
 * data, and error states for the caller to render inline.
 *
 * Translation fallback: when `dhikr.translationFallback === true`, the screen
 * should display an "(English)" notice to inform the user that no translation
 * exists for the selected locale and English is being shown instead.
 *
 * Requirements: 3.1–3.5, 7.4
 */

import { useState, useEffect } from 'react';
import { openContentDb } from '../db/client';
import { getDhikrById } from '../db/queries';
import { useSettingsStore } from '../store/settingsStore';
import type { Dhikr } from '../types/content';

export interface UseDhikrResult {
  dhikr: Dhikr | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetches a single dhikr entry by `dhikrId` with translation for the current locale.
 *
 * - `isLoading` is `true` while the DB query is in flight.
 * - `dhikr` is the fetched entry on success, or `null` if not found / while loading / on error.
 * - `error` is non-null when the DB open or query fails; `dhikr` is `null`.
 * - When `dhikr.translationFallback === true`, the caller should render an
 *   "(English)" notice next to the translation.
 *
 * Re-fetches automatically when `dhikrId` or the active locale changes.
 */
export function useDhikr(dhikrId: number): UseDhikrResult {
  const locale = useSettingsStore((state) => state.language);

  const [dhikr, setDhikr] = useState<Dhikr | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDhikr() {
      setIsLoading(true);
      setError(null);

      try {
        const db = await openContentDb();
        const result = await getDhikrById(db, dhikrId, locale);
        if (!cancelled) {
          setDhikr(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setDhikr(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchDhikr();

    return () => {
      cancelled = true;
    };
  }, [dhikrId, locale]);

  return { dhikr, isLoading, error };
}
