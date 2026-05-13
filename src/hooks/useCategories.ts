/**
 * useCategories hook — fetches all categories from the content database.
 *
 * Calls `getCategories(db, locale)` on mount using the locale from
 * `settingsStore`. Returns loading, data, and error states for the caller
 * to render inline.
 *
 * Requirements: 2.2, 2.4
 */

import { useState, useEffect } from 'react';
import { openContentDb } from '../db/client';
import { getCategories } from '../db/queries';
import { useSettingsStore } from '../store/settingsStore';
import type { Category } from '../types/content';

export interface UseCategoriesResult {
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetches all categories with translated names for the current locale.
 *
 * - `isLoading` is `true` while the DB query is in flight.
 * - `categories` is populated on success; empty array while loading or on error.
 * - `error` is non-null when the DB open or query fails; `categories` is empty.
 */
export function useCategories(): UseCategoriesResult {
  const locale = useSettingsStore((state) => state.language);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      setIsLoading(true);
      setError(null);

      try {
        const db = await openContentDb();
        const result = await getCategories(db, locale);
        if (!cancelled) {
          setCategories(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setCategories([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchCategories();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  return { categories, isLoading, error };
}
