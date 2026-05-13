/**
 * Home screen — entry point of the app.
 *
 * Displays:
 *   - StreakWidget (streak count + checked-in state) at the top
 *   - Category grid (2 columns) using CategoryCard components
 *   - Favorites shortcut section (first 3 favorites, or empty-state prompt)
 *   - StreakNudgeModal when useStreakNudge().shouldShow === true
 *
 * Navigation:
 *   - Category card press → category/[id]
 *   - Favorites shortcut press → favorites tab
 *
 * Requirements: 2.2, 10.2, 14.2, 14.5, 21.1
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CategoryCard } from '@/components/CategoryCard';
import { StreakWidget } from '@/components/StreakWidget';
import { StreakNudgeModal } from '@/components/StreakNudgeModal';
import { useCategories } from '@/hooks/useCategories';
import { useStreakNudge } from '@/hooks/useStreakNudge';
import { useStreakStore } from '@/store/streakStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { colors, spacing, radii } from '@/theme';
import type { Category } from '@/types/content';

// ── Component ────────────────────────────────────────────────────────────────

export default function HomeScreen(): React.JSX.Element {
  const router = useRouter();

  // ── Streak state ──────────────────────────────────────────────────────────
  const currentStreak = useStreakStore((state) => state.currentStreak);
  const checkedInToday = useStreakStore((state) => state.checkedInToday);

  // ── Categories ────────────────────────────────────────────────────────────
  const { categories, isLoading: categoriesLoading, error: categoriesError } = useCategories();

  // ── Favorites shortcut (first 3 IDs) ─────────────────────────────────────
  const dhikrIds = useFavoritesStore((state) => state.dhikrIds);
  const firstThreeFavoriteIds = Array.from(dhikrIds).slice(0, 3);
  const hasFavorites = firstThreeFavoriteIds.length > 0;

  // ── Streak nudge ──────────────────────────────────────────────────────────
  const { shouldShow: nudgeShouldShow, dismiss: nudgeDismiss, dismissPermanently: nudgeDismissPermanently } =
    useStreakNudge();

  // ── Navigation handlers ───────────────────────────────────────────────────

  const handleCategoryPress = useCallback(
    (categoryId: number) => {
      router.push(`/category/${categoryId}`);
    },
    [router],
  );

  const handleFavoritesPress = useCallback(() => {
    router.push('/(tabs)/favorites');
  }, [router]);

  const handleNudgeSignIn = useCallback(() => {
    nudgeDismiss();
    router.push('/sign-in');
  }, [nudgeDismiss, router]);

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderCategoryCard = useCallback(
    ({ item }: ListRenderItemInfo<Category>) => (
      <View style={styles.gridItem}>
        <CategoryCard
          category={item}
          onPress={() => handleCategoryPress(item.id)}
        />
      </View>
    ),
    [handleCategoryPress],
  );

  const keyExtractor = useCallback((item: Category) => String(item.id), []);

  // ── Header component (rendered above the grid) ────────────────────────────

  const ListHeader = (
    <>
      {/* ── Streak widget ── */}
      <View style={styles.streakRow} testID="home-streak-row">
        <StreakWidget streak={currentStreak} checkedInToday={checkedInToday} />
      </View>

      {/* ── Favorites shortcut ── */}
      <View style={styles.section} testID="home-favorites-section">
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Favorites</Text>
          <TouchableOpacity
            onPress={handleFavoritesPress}
            accessibilityRole="button"
            accessibilityLabel="View all favorites"
            testID="home-favorites-see-all"
          >
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {hasFavorites ? (
          <View style={styles.favoritesShortcut} testID="home-favorites-shortcut">
            {firstThreeFavoriteIds.map((id) => (
              <TouchableOpacity
                key={id}
                style={styles.favoriteChip}
                onPress={handleFavoritesPress}
                accessibilityRole="button"
                accessibilityLabel={`Favorite dhikr ${id}`}
                testID={`home-favorite-chip-${id}`}
              >
                <Text style={styles.favoriteChipText}>#{id}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.favoritesEmpty}
            onPress={handleFavoritesPress}
            accessibilityRole="button"
            accessibilityLabel="Add favorites from any category"
            testID="home-favorites-empty"
          >
            <Text style={styles.favoritesEmptyText}>
              Tap ♡ on any dhikr to save it here
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Categories heading ── */}
      <Text style={styles.sectionTitle} testID="home-categories-heading">
        Categories
      </Text>
    </>
  );

  // ── Loading / error states ────────────────────────────────────────────────

  if (categoriesLoading) {
    return (
      <View style={styles.centered} testID="home-loading">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (categoriesError) {
    return (
      <View style={styles.centered} testID="home-error">
        <Text style={styles.errorText}>
          Failed to load categories. Please restart the app.
        </Text>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <View style={styles.container} testID="home-screen">
      <FlatList<Category>
        data={categories}
        keyExtractor={keyExtractor}
        renderItem={renderCategoryCard}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        testID="home-category-grid"
      />

      {/* ── Streak nudge modal ── */}
      <StreakNudgeModal
        visible={nudgeShouldShow}
        streak={currentStreak}
        onSignIn={handleNudgeSignIn}
        onLater={nudgeDismiss}
        onDismissPermanently={nudgeDismissPermanently}
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

  // ── Streak row ─────────────────────────────────────────────────────────────
  streakRow: {
    alignItems: 'flex-start',
    marginTop: spacing[4],
    marginBottom: spacing[4],
  },

  // ── Section ────────────────────────────────────────────────────────────────
  section: {
    marginBottom: spacing[6],
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },

  seeAll: {
    fontSize: 14,
    color: colors.primary,
  },

  // ── Favorites shortcut ─────────────────────────────────────────────────────
  favoritesShortcut: {
    flexDirection: 'row',
    gap: spacing[2],
  },

  favoriteChip: {
    backgroundColor: colors.primarySubtle,
    borderRadius: radii.pill,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderWidth: 1,
    borderColor: colors.primary,
  },

  favoriteChipText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },

  favoritesEmpty: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing[4],
    alignItems: 'center',
  },

  favoritesEmptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },

  // ── Category grid ──────────────────────────────────────────────────────────
  columnWrapper: {
    gap: spacing[3],
    marginBottom: spacing[3],
  },

  gridItem: {
    flex: 1,
  },
});
