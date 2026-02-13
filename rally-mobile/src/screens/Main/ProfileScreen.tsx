import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
  const { signOut, user } = useAuthStore();
  const [isTimerPublic, setIsTimerPublic] = React.useState(true);
  const [isLocationPublic, setIsLocationPublic] = React.useState(true);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.displayName || user?.username || 'User'}</Text>
        <Text style={styles.username}>@{user?.username || 'username'}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>12h</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>48h</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>156h</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy Settings</Text>
        
        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Show Timer</Text>
            <Text style={styles.settingDescription}>Others can see when you're studying</Text>
          </View>
          <Switch
            value={isTimerPublic}
            onValueChange={setIsTimerPublic}
            trackColor={{ false: '#767577', true: '#111' }}
          />
        </View>

        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Show Location</Text>
            <Text style={styles.settingDescription}>Others can see your study location</Text>
          </View>
          <Switch
            value={isLocationPublic}
            onValueChange={setIsLocationPublic}
            trackColor={{ false: '#767577', true: '#111' }}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginHorizontal: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  signOutButton: {
    margin: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
});
