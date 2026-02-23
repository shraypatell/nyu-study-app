import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';
import { supabase } from './src/api/supabase';
import { useAuthStore } from './src/store/authStore';

const TransparentTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
    card: 'transparent',
    text: colors.foreground,
    border: colors.glassBorder,
    primary: colors.primary,
  },
};

export default function App() {
  useEffect(() => {
    // Initialize auth on app startup - restore session from device storage
    useAuthStore.getState().checkSession();

    // Listen for auth state changes (handles session restoration and updates)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          // Session exists - restore user data
          useAuthStore.getState().checkSession();
        } else {
          // No session - user is logged out
          useAuthStore.setState({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider style={styles.container}>
        <NavigationContainer theme={TransparentTheme}>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0E',
  },
});
