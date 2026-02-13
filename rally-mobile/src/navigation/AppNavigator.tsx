import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { enableScreens } from 'react-native-screens';
import { useAuthStore } from '../store/authStore';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import DashboardScreen from '../screens/Main/DashboardScreen';
import TimerScreen from '../screens/Main/TimerScreen';
import FriendsScreen from '../screens/Main/FriendsScreen';
import LeaderboardsScreen from '../screens/Main/LeaderboardsScreen';
import ClassesScreen from '../screens/Main/ClassesScreen';
import ChatListScreen from '../screens/Main/ChatListScreen';
import ProfileScreen from '../screens/Main/ProfileScreen';

enableScreens(true);

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#111',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Timer" component={TimerScreen} options={{ title: 'Timer' }} />
      <Tab.Screen name="Friends" component={FriendsScreen} options={{ title: 'Friends' }} />
      <Tab.Screen name="Leaderboards" component={LeaderboardsScreen} options={{ title: 'Rankings' }} />
      <Tab.Screen name="Classes" component={ClassesScreen} options={{ title: 'Classes' }} />
      <Tab.Screen name="Chat" component={ChatListScreen} options={{ title: 'Messages' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      {Boolean(isAuthenticated) ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
