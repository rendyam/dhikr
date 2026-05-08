import { StyleSheet, Text, View } from 'react-native';

/**
 * To-Do List screen — personal dhikr goals and reminders.
 * Full implementation in Phase 7 (task 39).
 * Requirements: 17.1–17.10
 */
export default function TodoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>To-Do</Text>
      <Text style={styles.subtitle}>Your personal dhikr goals will appear here.</Text>
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
