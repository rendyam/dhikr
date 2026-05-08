import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

/**
 * Dhikr detail screen — displays Arabic text, translation, source, and counter.
 * Triggers the daily check-in via `useDhikrView` hook on mount (task 28).
 * Full implementation in Phase 7 (task 34).
 * Requirements: 3.1–3.5, 6.1, 6.2, 7.4, 14.1
 */
export default function DhikrScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dhikr Detail</Text>
      <Text style={styles.subtitle}>Dhikr ID: {id}</Text>
      <Text style={styles.hint}>Arabic text, translation, and source coming soon.</Text>
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
