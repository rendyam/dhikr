import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { colors } from '@/theme';

/**
 * Bottom tab navigator for the five main sections of the app.
 * Follows platform conventions: Material-style on Android, UITabBar on iOS.
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: true,
        // Use bottom safe area inset on iOS; Android handles it natively
        tabBarStyle: Platform.select({
          ios: { paddingBottom: 0 },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          // Icon placeholder — will be replaced with vector icons in later tasks
          tabBarAccessibilityLabel: 'Home tab',
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarLabel: 'Favorites',
          tabBarAccessibilityLabel: 'Favorites tab',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarLabel: 'Search',
          tabBarAccessibilityLabel: 'Search tab',
        }}
      />
      <Tabs.Screen
        name="todo"
        options={{
          title: 'To-Do',
          tabBarLabel: 'To-Do',
          tabBarAccessibilityLabel: 'To-Do tab',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarAccessibilityLabel: 'Profile tab',
        }}
      />
    </Tabs>
  );
}
