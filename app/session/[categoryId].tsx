import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

/**
 * Guided session screen — presents dhikr one at a time with a tap counter.
 * Full implementation in Phase 7 (task 36).
 * Requirements: 4.1–4.7, 5.1–5.4
 */
export default function SessionScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Guided Session</Text>
      <Text style={styles.subtitle}>Category ID: {categoryId}</Text>
      <Text style={styles.hint}>Session counter and dhikr flow coming soon.</Text>
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
