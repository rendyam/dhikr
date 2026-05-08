import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/theme';

/**
 * Root layout — loads Arabic fonts before rendering any screen.
 * The font loading gate ensures ArabicText components always have
 * Amiri available; no flash of unstyled text.
 *
 * Full i18n initialization and auth listener will be added in tasks 10 and 24.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Amiri_400Regular,
    Amiri_700Bold,
  });

  // Block rendering until fonts are ready (or failed to load)
  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack>
      {/* The (tabs) group renders the bottom tab navigator */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Category and dhikr detail screens */}
      <Stack.Screen
        name="category/[id]"
        options={{ title: 'Category', headerBackTitle: 'Home' }}
      />
      <Stack.Screen
        name="dhikr/[id]"
        options={{ title: 'Dhikr', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="session/[categoryId]"
        options={{ title: 'Session', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="settings"
        options={{ title: 'Settings', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="sign-in"
        options={{ title: 'Sign In', headerBackTitle: 'Back' }}
      />
      {/* Source detail is presented as a modal */}
      <Stack.Screen
        name="source/[dhikrId]"
        options={{
          title: 'Source',
          presentation: 'modal',
          headerBackTitle: 'Close',
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
