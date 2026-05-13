/**
 * Category Detail screen — shows the ordered list of dhikr for a given category.
 *
 * Displays:
 *   - Category name (Arabic + translated) as the screen header
 *   - Ordered list of DhikrCard components (from useDhikrByCategory hook)
 *   - "Start Session" button that navigates to session/[categoryId]
 *
 * Navigation:
 *   - DhikrCard press → dhikr/[id]
 *   - "Start Session" button → session/[categoryId]
 *
 * Favorites:
 *   - Favorite toggle on each card calls favoritesStore.addFavorite / removeFavorite
 *
 * Requirements: 2.3, 2.4, 4.1
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ListRenderItemInfo,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DhikrCard } from '@/components/DhikrCard';
import { ArabicText } from '@/components/ArabicText';
import { useDhikrByCategory } from '@/hooks/useDhikrByCategory';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useSettingsStore } from '@/store/settingsStore';
import { openContentDb } from '@/db/client';
import { getCategoryById } from '@/db/queries';
import { colors, spacing, radii } from '@/theme';
import type { Dhikr, Category } from '@/types/content';

// ── Component ────────────────────────────────────────────────────────────────

export default function CategoryScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const categoryId = Number(id);

  // ── Category metadata ─────────────────────────────────────────────────────
  const locale = useSettingsStore((state) => state.language);
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCategory() {
      try {
        const db = await openContentDb();
        const result = await getCategoryById(db, categoryId, locale);
        if (!cancelled) {
          setCategory(result);
        }
      } catch {
        // Category name is non-critical — screen still works without it
      }
    }

    void fetchCategory();

    return () => {
      cancelled = true;
    };
  }, [categoryId, locale]);

  // ── Dhikr list ────────────────────────────────────────────────────────────
  const { dhikrList, isLoading, error } = useDhikrByCategory(categoryId);

  // ── Favorites ─────────────────────────────────────────────────────────────
  const addFavorite = useFavoritesStore((state) => state.addFavorite);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
  const isFavorite = useFavoritesStore((state) => state.isFavorite);

  // ── Navigation handlers ───────────────────────────────────────────────────

  const handleStartSession = useCallback(() => {
    router.push(`/session/${categoryId}`);
  }, [router, categoryId]);

  const handleDhikrPress = useCallback(
    (dhikrId: number) => {
      router.push(`/dhikr/${dhikrId}`);
    },
    [router],
  );

  const handleFavoriteToggle = useCallback(
    (dhikrId: number) => {
      if (isFavorite(dhikrId)) {
        removeFavorite(dhikrId);
      } else {
        addFavorite(dhikrId);
      }
    },
    [isFavorite, addFavorite, removeFavorite],
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

  // ── Header component ──────────────────────────────────────────────────────

  const ListHeader = (
    <View style={styles.header} testID="category-header">
      {category ? (
        <>
          <View testID="category-arabic-name">
            <ArabicText
              text={category.nameAr}
              size="large"
              style={styles.arabicName}
            />
          </View>
          <Text style={styles.translatedName} testID="category-translated-name">
            {category.name}
          </Text>
        </>
      ) : (
        // Placeholder while category loads — avoids layout shift
        <Text style={styles.translatedName} testID="category-translated-name">
          {' '}
        </Text>
      )}
    </View>
  );

  // ── Footer component (Start Session button) ───────────────────────────────

  const ListFooter = (
    <View style={styles.footer}>
      <TouchableOpacity
        style={styles.startSessionButton}
        onPress={handleStartSession}
        accessibilityRole="button"
        accessibilityLabel="Start Session"
        testID="category-start-session"
      >
        <Text style={styles.startSessionText}>Start Session</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Loading state ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.centered} testID="category-loading">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (error) {
    return (
      <View style={styles.centered} testID="category-error">
        <Text style={styles.errorText}>
          Failed to load dhikr. Please try again.
        </Text>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <View style={styles.container} testID="category-screen">
      <FlatList<Dhikr>
        data={dhikrList}
        keyExtractor={keyExtractor}
        renderItem={renderDhikrCard}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={dhikrList.length > 0 ? ListFooter : null}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        testID="category-dhikr-list"
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

  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
  },

  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
    alignItems: 'center',
  },

  arabicName: {
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },

  translatedName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // ── Footer ─────────────────────────────────────────────────────────────────
  footer: {
    paddingTop: spacing[6],
  },

  startSessionButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing[4],
    alignItems: 'center',
  },

  startSessionText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
