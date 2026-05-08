import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

/**
 * Source detail screen — modal showing full Hadith text, scholar grading, and rationale.
 * Presented as a modal from the Dhikr detail screen.
 * Full implementation in Phase 7 (task 35).
 * Requirements: 6.3
 */
export default function SourceScreen() {
  const { dhikrId } = useLocalSearchParams<{ dhikrId: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Source</Text>
      <Text style={styles.subtitle}>Dhikr ID: {dhikrId}</Text>
      <Text style={styles.hint}>Full Hadith text and scholar grading coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  hint: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
