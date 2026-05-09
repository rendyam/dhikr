import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { colors } from '@/theme';
import { initI18n, type SupportedLocale } from '@/i18n';

/**
 * Root layout — loads Arabic fonts and initializes i18n before rendering any screen.
 *
 * Boot sequence:
 *   1. Load Amiri font (expo-font)
 *   2. Initialize i18next with the persisted locale (or 'en' default)
 *   3. Render the navigator once both are ready
 *
 * The font loading gate ensures ArabicText components always have Amiri
 * available; no flash of unstyled text.
 *
 * The i18n gate ensures all screens receive translated strings on first render;
 * no flash of raw translation keys.
 *
 * Auth listener will be added in task 24.
 *
 * Requirements: 7.1, 7.2, 7.3, 12.3
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Amiri_400Regular,
    Amiri_700Bold,
  });

  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    // TODO (task 20): read persisted locale from settingsStore / AsyncStorage
    // and pass it here so the correct language is active on first render.
    // For now we default to 'en'.
    const persistedLocale: SupportedLocale = 'en';

    initI18n(persistedLocale)
      .then(() => setI18nReady(true))
      .catch((err) => {
        // i18n init failure is non-fatal — the app can still render with
        // raw keys as a last resort. Log the error and unblock rendering.
        console.error('[i18n] Initialization failed:', err);
        setI18nReady(true);
      });
  }, []);

  // Block rendering until both fonts and i18n are ready.
  if ((!fontsLoaded && !fontError) || !i18nReady) {
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
