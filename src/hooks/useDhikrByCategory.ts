/**
 * useDhikrByCategory hook — fetches all dhikr entries for a given category.
 *
 * Calls `getDhikrByCategory(db, categoryId, locale)` on mount (and whenever
 * `categoryId` or `locale` changes) using the locale from `settingsStore`.
 * Returns loading, data, and error states for the caller to render inline.
 *
 * Requirements: 2.3, 2.4
 */

import { useState, useEffect } from 'react';
import { openContentDb } from '../db/client';
import { getDhikrByCategory } from '../db/queries';
import { useSettingsStore } from '../store/settingsStore';
import type { Dhikr } from '../types/content';

export interface UseDhikrByCategoryResult {
  dhikrList: Dhikr[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetches all dhikr entries for the given `categoryId`, ordered by sort_order.
 *
 * - `isLoading` is `true` while the DB query is in flight.
 * - `dhikrList` is populated on success; empty array while loading or on error.
 * - `error` is non-null when the DB open or query fails; `dhikrList` is empty.
 *
 * Re-fetches automatically when `categoryId` or the active locale changes.
 */
export function useDhikrByCategory(categoryId: number): UseDhikrByCategoryResult {
  const locale = useSettingsStore((state) => state.language);

  const [dhikrList, setDhikrList] = useState<Dhikr[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDhikr() {
      setIsLoading(true);
      setError(null);

      try {
        const db = await openContentDb();
        const result = await getDhikrByCategory(db, categoryId, locale);
        if (!cancelled) {
          setDhikrList(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setDhikrList([]);
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
  }, [categoryId, locale]);

  return { dhikrList, isLoading, error };
}
