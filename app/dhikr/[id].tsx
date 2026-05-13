/**
 * Dhikr Detail screen — displays full Arabic text, translation, source, and
 * authenticity grade for a single dhikr entry.
 *
 * Displays:
 *   - Arabic text via ArabicText component at 'large' size
 *   - Translation with "(English)" notice when translationFallback === true
 *   - Source reference (collection/book/hadith or Surah:Ayah)
 *   - SourceBadge for the authenticity grade
 *   - Transliteration when settingsStore.showTransliteration === true
 *   - Prescribed repetition count when available
 *   - Favorite toggle button in the header
 *   - "View Source" button that navigates to source/[dhikrId] (modal)
 *
 * Triggers the daily check-in via useDhikrView() on mount.
 *
 * Requirements: 3.1–3.5, 6.1, 6.2, 7.4, 14.1
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArabicText } from '@/components/ArabicText';
import { SourceBadge } from '@/components/SourceBadge';
import { useDhikr } from '@/hooks/useDhikr';
import { useDhikrView } from '@/hooks/useDhikrView';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, spacing, radii } from '@/theme';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Formats the source reference string from a dhikr entry.
 * Returns a Surah:Ayah string for Qur'an sources, or a collection/book/hadith
 * string for Hadith sources.
 */
function formatSourceReference(dhikr: {
  sourceType: string;
  surahName: string | null;
  ayahNumber: number | null;
  collectionName: string | null;
  bookNumber: string | null;
  hadithNumber: string | null;
}): string {
  if (dhikr.sourceType === 'quran') {
    const parts: string[] = [];
    if (dhikr.surahName) parts.push(dhikr.surahName);
    if (dhikr.ayahNumber !== null) parts.push(`Ayah ${dhikr.ayahNumber}`);
    return parts.join(', ') || 'Qur\'an';
  }

  const parts: string[] = [];
  if (dhikr.collectionName) parts.push(dhikr.collectionName);
  if (dhikr.bookNumber) parts.push(`Book ${dhikr.bookNumber}`);
  if (dhikr.hadithNumber) parts.push(`Hadith ${dhikr.hadithNumber}`);
  return parts.join(', ') || 'Hadith';
}

// ── Component ────────────────────────────────────────────────────────────────

export default function DhikrDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const dhikrId = Number(id);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { dhikr, isLoading, error } = useDhikr(dhikrId);

  // ── Check-in on mount ─────────────────────────────────────────────────────
  useDhikrView();

  // ── Settings ──────────────────────────────────────────────────────────────
  const showTransliteration = useSettingsStore((state) => state.showTransliteration);

  // ── Favorites ─────────────────────────────────────────────────────────────
  const addFavorite = useFavoritesStore((state) => state.addFavorite);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
  const isFavorite = useFavoritesStore((state) => state.isFavorite);

  const favorited = dhikr ? isFavorite(dhikrId) : false;

  const handleFavoriteToggle = useCallback(() => {
    if (favorited) {
      removeFavorite(dhikrId);
    } else {
      addFavorite(dhikrId);
    }
  }, [favorited, dhikrId, addFavorite, removeFavorite]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleViewSource = useCallback(() => {
    router.push(`/source/${dhikrId}`);
  }, [router, dhikrId]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.centered} testID="dhikr-detail-loading">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !dhikr) {
    return (
      <View style={styles.centered} testID="dhikr-detail-error">
        <Text style={styles.errorText}>
          Failed to load dhikr. Please try again.
        </Text>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  const sourceRef = formatSourceReference(dhikr);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="dhikr-detail-screen"
    >
      {/* ── Header row: favorite toggle ─────────────────────────────────── */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={handleFavoriteToggle}
          accessibilityRole="button"
          accessibilityLabel={favorited ? 'Remove from favorites' : 'Add to favorites'}
          testID="dhikr-detail-favorite"
          style={styles.favoriteButton}
        >
          <Text style={styles.favoriteIcon}>{favorited ? '★' : '☆'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Arabic text ─────────────────────────────────────────────────── */}
      <View style={styles.arabicContainer} testID="dhikr-detail-arabic">
        <ArabicText text={dhikr.arabicText} size="large" />
      </View>

      {/* ── Transliteration (conditional) ───────────────────────────────── */}
      {showTransliteration && dhikr.transliteration ? (
        <Text style={styles.transliteration} testID="dhikr-detail-transliteration">
          {dhikr.transliteration}
        </Text>
      ) : null}

      {/* ── Translation ─────────────────────────────────────────────────── */}
      <View style={styles.translationContainer} testID="dhikr-detail-translation">
        <Text style={styles.translation}>{dhikr.translation}</Text>
        {dhikr.translationFallback ? (
          <Text style={styles.translationFallback} testID="dhikr-detail-translation-fallback">
            (English)
          </Text>
        ) : null}
      </View>

      {/* ── Repetition count ────────────────────────────────────────────── */}
      {dhikr.repetitionCount !== null ? (
        <View style={styles.repetitionContainer} testID="dhikr-detail-repetition">
          <Text style={styles.repetitionLabel}>Repeat</Text>
          <Text style={styles.repetitionCount}>{dhikr.repetitionCount}×</Text>
        </View>
      ) : null}

      {/* ── Source reference + badge ─────────────────────────────────────── */}
      <View style={styles.sourceContainer} testID="dhikr-detail-source">
        <Text style={styles.sourceRef} testID="dhikr-detail-source-ref">
          {sourceRef}
        </Text>
        <View testID="dhikr-detail-source-badge">
          <SourceBadge grade={dhikr.authenticityGrade} />
        </View>
      </View>

      {/* ── View Source button ───────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.viewSourceButton}
        onPress={handleViewSource}
        accessibilityRole="button"
        accessibilityLabel="View Source"
        testID="dhikr-detail-view-source"
      >
        <Text style={styles.viewSourceText}>View Source</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
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

  // ── Header row ─────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },

  favoriteButton: {
    padding: spacing[2],
  },

  favoriteIcon: {
    fontSize: 28,
    color: colors.primary,
  },

  // ── Arabic text ────────────────────────────────────────────────────────────
  arabicContainer: {
    paddingVertical: spacing[6],
    alignItems: 'stretch',
  },

  // ── Transliteration ────────────────────────────────────────────────────────
  transliteration: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: spacing[4],
    lineHeight: 24,
  },

  // ── Translation ────────────────────────────────────────────────────────────
  translationContainer: {
    marginBottom: spacing[4],
  },

  translation: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
  },

  translationFallback: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing[1],
  },

  // ── Repetition count ───────────────────────────────────────────────────────
  repetitionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },

  repetitionLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  repetitionCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },

  // ── Source ─────────────────────────────────────────────────────────────────
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[6],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  sourceRef: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },

  // ── View Source button ─────────────────────────────────────────────────────
  viewSourceButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing[3],
    alignItems: 'center',
  },

  viewSourceText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
});
