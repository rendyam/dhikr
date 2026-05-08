import { StyleSheet, Text, View } from 'react-native';

/**
 * Profile screen — sign-in / account info, badges, and settings entry point.
 * Full implementation in Phase 7 (task 40).
 * Requirements: 14.7, 16.4, 16.5
 */
export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Sign in to sync your streak and favorites.</Text>
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
