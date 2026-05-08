import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

/**
 * Category detail screen — shows the ordered list of dhikr for a given category.
 * Full implementation in Phase 7 (task 33).
 * Requirements: 2.3, 2.4, 4.1
 */
export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Category</Text>
      <Text style={styles.subtitle}>Category ID: {id}</Text>
      <Text style={styles.hint}>Dhikr list coming soon.</Text>
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
