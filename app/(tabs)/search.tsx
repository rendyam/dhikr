/**
 * Search screen — full-text search across Arabic text, transliteration, and translation.
 *
 * Displays:
 *   - A TextInput at the top for entering a search query
 *   - A FlatList of DhikrCard results when the query returns matches
 *   - A "No results found" message when the query is non-empty but returns nothing
 *   - An idle hint when the query is empty
 *
 * Navigation:
 *   - DhikrCard press → dhikr/[id]
 *
 * Requirements: 11.1–11.4
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DhikrCard } from '@/components/DhikrCard';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useSearch } from '@/hooks/useSearch';
import { colors, spacing } from '@/theme';
import type { Dhikr } from '@/types/content';

// ── Component ────────────────────────────────────────────────────────────────

export default function SearchScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation();

  // ── Store state ───────────────────────────────────────────────────────────
  const addFavorite = useFavoritesStore((state) => state.addFavorite);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
  const isFavorite = useFavoritesStore((state) => state.isFavorite);

  // ── Local state ───────────────────────────────────────────────────────────
  const [query, setQuery] = useState('');

  // ── Search hook ───────────────────────────────────────────────────────────
  const { results, isLoading, isEmpty } = useSearch(query);

  // ── Navigation handlers ───────────────────────────────────────────────────

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

  // ── Derived state ─────────────────────────────────────────────────────────
  const trimmedQuery = query.trim();
  const isQueryEmpty = trimmedQuery.length === 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container} testID="search-screen">
      {/* ── Search input ── */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={t('search.placeholder')}
          placeholderTextColor={colors.textDisabled}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          testID="search-input"
          accessibilityLabel={t('search.placeholder')}
        />
      </View>

      {/* ── Loading indicator ── */}
      {isLoading && (
        <View style={styles.centered} testID="search-loading">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* ── No results state ── */}
      {!isLoading && isEmpty && (
        <View style={styles.centered} testID="search-no-results">
          <Text style={styles.noResultsTitle} testID="search-no-results-title">
            {t('search.noResultsTitle')}
          </Text>
          <Text style={styles.noResultsMessage} testID="search-no-results-message">
            {t('search.noResultsMessage', { query: trimmedQuery })}
          </Text>
        </View>
      )}

      {/* ── Idle hint (empty query) ── */}
      {!isLoading && isQueryEmpty && (
        <View style={styles.centered} testID="search-idle">
          <Text style={styles.hintText} testID="search-idle-hint">
            {t('search.emptyQueryHint')}
          </Text>
        </View>
      )}

      {/* ── Results list ── */}
      {!isLoading && !isEmpty && !isQueryEmpty && (
        <FlatList<Dhikr>
          data={results}
          keyExtractor={keyExtractor}
          renderItem={renderDhikrCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          testID="search-results-list"
        />
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  inputContainer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
    backgroundColor: colors.background,
  },

  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: 16,
    color: colors.textPrimary,
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },

  listContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[8],
  },

  noResultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },

  noResultsMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  hintText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
