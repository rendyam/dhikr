/**
 * Favorites screen — lists all dhikr entries the user has bookmarked.
 *
 * Displays:
 *   - A scrollable list of DhikrCard components for each favorited dhikr
 *   - An empty-state prompt when no favorites exist
 *
 * Navigation:
 *   - DhikrCard press → dhikr/[id]
 *
 * Favorites:
 *   - Favorite toggle on each card calls favoritesStore.removeFavorite immediately
 *
 * Requirements: 10.1–10.5
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { DhikrCard } from '@/components/DhikrCard';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useSettingsStore } from '@/store/settingsStore';
import { openContentDb } from '@/db/client';
import { getDhikrById } from '@/db/queries';
import { colors, spacing } from '@/theme';
import type { Dhikr } from '@/types/content';

// ── Component ────────────────────────────────────────────────────────────────

export default function FavoritesScreen(): React.JSX.Element {
  const router = useRouter();

  // ── Store state ───────────────────────────────────────────────────────────
  const dhikrIds = useFavoritesStore((state) => state.dhikrIds);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
  const isFavorite = useFavoritesStore((state) => state.isFavorite);
  const locale = useSettingsStore((state) => state.language);

  // ── Local state ───────────────────────────────────────────────────────────
  const [favorites, setFavorites] = useState<Dhikr[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Load favorite dhikr entries ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadFavorites() {
      setIsLoading(true);
      try {
        const ids = Array.from(dhikrIds);
        if (ids.length === 0) {
          if (!cancelled) {
            setFavorites([]);
            setIsLoading(false);
          }
          return;
        }

        const db = await openContentDb();
        const results = await Promise.all(
          ids.map((id) => getDhikrById(db, id, locale)),
        );

        if (!cancelled) {
          // Filter out any null results (dhikr that no longer exist in DB)
          setFavorites(results.filter((d): d is Dhikr => d !== null));
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setFavorites([]);
          setIsLoading(false);
        }
      }
    }

    void loadFavorites();

    return () => {
      cancelled = true;
    };
  }, [dhikrIds, locale]);

  // ── Navigation handlers ───────────────────────────────────────────────────

  const handleDhikrPress = useCallback(
    (dhikrId: number) => {
      router.push(`/dhikr/${dhikrId}`);
    },
    [router],
  );

  const handleFavoriteToggle = useCallback(
    (dhikrId: number) => {
      // On the Favorites screen, toggling always removes from favorites
      removeFavorite(dhikrId);
    },
    [removeFavorite],
  );

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderDhikrCard = useCallback(
    ({ item }: ListRenderItemInfo<Dhikr>) => (
      <DhikrCard
        dhikr={item}
        onPress={() => handleDhikrPress(item.id)}
        onFavorite={() => handleFavoriteToggle(item.id)}
        isFavorite={isFavorite(item.id)}
      />
    ),
    [handleDhikrPress, handleFavoriteToggle, isFavorite],
  );

  const keyExtractor = useCallback((item: Dhikr) => String(item.id), []);

  // ── Loading state ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.centered} testID="favorites-loading">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  if (favorites.length === 0) {
    return (
      <View style={styles.centered} testID="favorites-empty">
        <Text style={styles.emptyTitle} testID="favorites-empty-title">
          No Favorites Yet
        </Text>
        <Text style={styles.emptyMessage} testID="favorites-empty-message">
          Tap the heart icon on any dhikr to save it here for quick access.
        </Text>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <View style={styles.container} testID="favorites-screen">
      <FlatList<Dhikr>
        data={favorites}
        keyExtractor={keyExtractor}
        renderItem={renderDhikrCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        testID="favorites-list"
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },

  listContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[8],
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },

  emptyMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
