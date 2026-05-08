import { StyleSheet, Text, View } from 'react-native';

/**
 * Settings screen — language, text size, transliteration toggle, and notification settings.
 * Full implementation in Phase 7 (task 41).
 * Requirements: 7.2, 7.3, 8.1, 8.2, 8.3, 15.6, 15.7
 */
export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Language, text size, and notification settings coming soon.</Text>
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
