import { StyleSheet, Text, View } from 'react-native';

/**
 * Home screen — displays the category grid and favorites shortcut.
 * Full implementation in Phase 7 (task 32).
 * Requirements: 2.2, 10.2, 14.2, 14.5, 21.1
 */
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>Category grid and streak widget coming soon.</Text>
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
