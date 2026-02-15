import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuthStore();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Welcome{user?.displayName ? `, ${user.displayName}` : ''}
        </Text>
        <Text style={styles.subtitle}>@{user?.username || 'user'}</Text>
      </View>

      <TouchableOpacity 
        style={styles.timerCard}
        onPress={() => navigation.navigate('Timer')}
      >
        <Text style={styles.timerCardTitle}>Start Studying</Text>
        <Text style={styles.timerCardSubtitle}>
          Tap to open timer with FOCUS or CLASSIC mode
        </Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0h</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0h</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Leaderboard Preview</Text>
        <Text style={styles.comingSoon}>Leaderboards coming soon...</Text>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => useAuthStore.getState().signOut()}
      >
        <Text style={styles.logoutText}>Log Out</Text>
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
    padding: 24,
    paddingTop: 48,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  timerCard: {
    margin: 24,
    marginTop: 0,
    padding: 24,
    backgroundColor: '#111',
    borderRadius: 16,
  },
  timerCardTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  timerCardSubtitle: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    padding: 24,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  comingSoon: {
    color: '#999',
    fontSize: 14,
  },
  logoutButton: {
    margin: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
