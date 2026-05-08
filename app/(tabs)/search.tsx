import { StyleSheet, Text, View } from 'react-native';

/**
 * Search screen — full-text search across Arabic text, transliteration, and translation.
 * Full implementation in Phase 7 (task 38).
 * Requirements: 11.1–11.4
 */
export default function SearchScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search</Text>
      <Text style={styles.subtitle}>Search for adhkar by keyword.</Text>
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
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
