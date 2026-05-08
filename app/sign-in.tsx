import { StyleSheet, Text, View } from 'react-native';

/**
 * Sign-in screen — Google Sign-In via Firebase Authentication.
 * Full implementation in Phase 7 (task 42).
 * Requirements: 16.1, 16.2, 16.7, 16.8
 */
export default function SignInScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      <Text style={styles.subtitle}>Google Sign-In coming soon.</Text>
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
