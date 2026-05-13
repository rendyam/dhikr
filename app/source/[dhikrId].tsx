/**
 * Source Detail screen — modal showing the full Hadith text or Qur'anic verse
 * context, the scholar(s) who graded it, the grading rationale (where available),
 * and the source reference for a single dhikr entry.
 *
 * Presented as a modal from the Dhikr Detail screen via router.push('/source/[dhikrId]').
 * A close button in the header calls router.back() to dismiss the modal.
 *
 * Requirements: 6.3
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
import { useTranslation } from 'react-i18next';
import { SourceBadge } from '@/components/SourceBadge';
import { useDhikr } from '@/hooks/useDhikr';
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
    return parts.join(', ') || "Qur'an";
  }

  const parts: string[] = [];
  if (dhikr.collectionName) parts.push(dhikr.collectionName);
  if (dhikr.bookNumber) parts.push(`Book ${dhikr.bookNumber}`);
  if (dhikr.hadithNumber) parts.push(`Hadith ${dhikr.hadithNumber}`);
  return parts.join(', ') || 'Hadith';
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SourceDetailScreen(): React.JSX.Element {
  const { dhikrId } = useLocalSearchParams<{ dhikrId: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const parsedId = Number(dhikrId);
  const { dhikr, isLoading, error } = useDhikr(parsedId);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.centered} testID="source-detail-loading">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ── Error / not found state ───────────────────────────────────────────────
  if (error || !dhikr) {
    return (
      <View style={styles.centered} testID="source-detail-error">
        <Text style={styles.errorText}>{t('errors.contentLoadFailed')}</Text>
        <TouchableOpacity
          style={styles.closeButtonError}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          testID="source-detail-close-error"
        >
          <Text style={styles.closeButtonText}>{t('common.close')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  const sourceRef = formatSourceReference(dhikr);
  const scholarList = dhikr.scholarNames.join(', ');

  return (
    <View style={styles.container} testID="source-detail-screen">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('source.title')}</Text>
        <TouchableOpacity
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          testID="source-detail-close"
          style={styles.closeButton}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        testID="source-detail-scroll"
      >
        {/* ── Source reference ─────────────────────────────────────────── */}
        <View style={styles.section} testID="source-detail-reference">
          <Text style={styles.sectionLabel}>{t('source.title')}</Text>
          <Text style={styles.referenceText} testID="source-detail-reference-text">
            {sourceRef}
          </Text>
          <View style={styles.badgeRow} testID="source-detail-badge">
            <SourceBadge grade={dhikr.authenticityGrade} />
          </View>
        </View>

        {/* ── Full Hadith / Qur'anic text ──────────────────────────────── */}
        {dhikr.fullHadithText ? (
          <View style={styles.section} testID="source-detail-full-text">
            <Text style={styles.sectionLabel}>{t('source.fullText')}</Text>
            <Text style={styles.bodyText} testID="source-detail-full-text-content">
              {dhikr.fullHadithText}
            </Text>
          </View>
        ) : null}

        {/* ── Scholars ─────────────────────────────────────────────────── */}
        <View style={styles.section} testID="source-detail-scholars">
          <Text style={styles.sectionLabel}>{t('source.scholars')}</Text>
          <Text style={styles.bodyText} testID="source-detail-scholars-text">
            {scholarList}
          </Text>
        </View>

        {/* ── Grading rationale ────────────────────────────────────────── */}
        <View style={styles.section} testID="source-detail-rationale">
          <Text style={styles.sectionLabel}>{t('source.gradingRationale')}</Text>
          {dhikr.gradingRationale ? (
            <Text style={styles.bodyText} testID="source-detail-rationale-text">
              {dhikr.gradingRationale}
            </Text>
          ) : (
            <Text
              style={styles.rationaleAbsent}
              testID="source-detail-rationale-absent"
            >
              {t('source.noRationale')}
            </Text>
          )}
        </View>
      </ScrollView>
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
    backgroundColor: colors.background,
  },

  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing[4],
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  closeButton: {
    padding: spacing[2],
    borderRadius: radii.full,
  },

  closeButtonError: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    alignItems: 'center',
  },

  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },

  closeIcon: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  // ── Scroll content ─────────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    paddingBottom: spacing[8],
  },

  // ── Section ────────────────────────────────────────────────────────────────
  section: {
    marginBottom: spacing[6],
    paddingBottom: spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing[2],
  },

  referenceText: {
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },

  badgeRow: {
    flexDirection: 'row',
    marginTop: spacing[1],
  },

  bodyText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },

  rationaleAbsent: {
    fontSize: 14,
    color: colors.textDisabled,
    fontStyle: 'italic',
  },
});
