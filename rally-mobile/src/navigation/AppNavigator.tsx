import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import TimerScreen from '../screens/Main/TimerScreen';
import FriendsScreen from '../screens/Main/FriendsScreen';
import LeaderboardsScreen from '../screens/Main/LeaderboardsScreen';
import ClassesScreen from '../screens/Main/ClassesScreen';
import ChatListScreen from '../screens/Main/ChatListScreen';
import ChatScreen from '../screens/Main/ChatScreen';
import ProfileScreen from '../screens/Main/ProfileScreen';
import { ThemeProvider, useAppTheme } from '../theme/ThemeContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function ChatStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="ChatRoom" component={ChatScreen} />
    </Stack.Navigator>
  );
}

function MainNavigator() {
  const { t } = useAppTheme();

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;
            switch (route.name) {
              case 'Timer': iconName = focused ? 'timer' : 'timer-outline'; break;
              case 'Friends': iconName = focused ? 'people' : 'people-outline'; break;
              case 'Leaderboards': iconName = focused ? 'trophy' : 'trophy-outline'; break;
              case 'Classes': iconName = focused ? 'book' : 'book-outline'; break;
              case 'Chat': iconName = focused ? 'chatbubbles' : 'chatbubbles-outline'; break;
              case 'Profile': iconName = focused ? 'person' : 'person-outline'; break;
              default: iconName = 'ellipse';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: t.tabBarActive,
          tabBarInactiveTintColor: t.tabBarInactive,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: t.tabBar,
            borderTopColor: t.tabBarBorder,
            borderTopWidth: 1,
            height: 85,
            paddingBottom: 30,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
          },
        })}
      >
        <Tab.Screen name="Timer" component={TimerScreen} />
        <Tab.Screen name="Friends" component={FriendsScreen} />
        <Tab.Screen name="Leaderboards" component={LeaderboardsScreen} />
        <Tab.Screen name="Classes" component={ClassesScreen} />
        <Tab.Screen name="Chat" component={ChatStack} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </View>
  );
}

function MainNavigatorWithTheme() {
  return (
    <ThemeProvider>
      <MainNavigator />
    </ThemeProvider>
  );
}

export default function AppNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <MainNavigatorWithTheme /> : <AuthNavigator />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
