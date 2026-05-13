/**
 * useSearch hook — debounced full-text search over the adhkar content database.
 *
 * Accepts a raw query string, debounces it by 300 ms, then calls
 * `searchDhikr(db, query, locale)` when the trimmed query is at least 1
 * character long.  Empty or whitespace-only queries short-circuit immediately
 * and return an empty results array without touching the database.
 *
 * Returns:
 *   - `results`   — array of matching `Dhikr` entries (empty while loading or
 *                   when the query is blank)
 *   - `isLoading` — true while the debounce timer is pending OR while the DB
 *                   query is in flight (only when query is non-empty)
 *   - `isEmpty`   — true when the query is non-empty AND the search returned
 *                   zero results (used to render a "No results found" message)
 *
 * Requirements: 11.1, 11.2, 11.3
 */

import { useState, useEffect, useRef } from 'react';
import { openContentDb } from '../db/client';
import { searchDhikr } from '../db/queries';
import { useSettingsStore } from '../store/settingsStore';
import type { Dhikr } from '../types/content';

export interface UseSearchResult {
  results: Dhikr[];
  isLoading: boolean;
  isEmpty: boolean;
}

const DEBOUNCE_MS = 300;

/**
 * Debounced search hook.
 *
 * - `isLoading` is `true` immediately when a non-empty query is received
 *   (before the debounce fires) so the UI can show a spinner right away.
 * - After the 300 ms debounce, the DB is queried and `isLoading` is set to
 *   `false` once the query resolves.
 * - `isEmpty` is only `true` when the debounced query is non-empty AND the
 *   DB returned zero results.  It is `false` while loading and `false` when
 *   the query is blank.
 */
export function useSearch(query: string): UseSearchResult {
  const locale = useSettingsStore((state) => state.language);

  const [results, setResults] = useState<Dhikr[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

  // Keep a ref to the latest in-flight cancellation flag so stale async
  // callbacks don't update state after the component unmounts or the query
  // changes again before the previous one resolves.
  const cancelledRef = useRef(false);

  useEffect(() => {
    const trimmed = query.trim();

    // ── Empty / whitespace query — short-circuit ──────────────────────────
    if (trimmed.length === 0) {
      setResults([]);
      setIsLoading(false);
      setIsEmpty(false);
      return;
    }

    // ── Non-empty query — show loading immediately, then debounce ─────────
    setIsLoading(true);
    setIsEmpty(false);
    cancelledRef.current = false;

    const timerId = setTimeout(async () => {
      if (cancelledRef.current) return;

      try {
        const db = await openContentDb();
        if (cancelledRef.current) return;

        const found = await searchDhikr(db, trimmed, locale);
        if (cancelledRef.current) return;

        setResults(found);
        setIsEmpty(found.length === 0);
      } catch {
        if (cancelledRef.current) return;
        // On error, surface an empty results state rather than crashing.
        setResults([]);
        setIsEmpty(false);
      } finally {
        if (!cancelledRef.current) {
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelledRef.current = true;
      clearTimeout(timerId);
    };
  }, [query, locale]);

  return { results, isLoading, isEmpty };
}
