import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Alice', hours: 12, isActive: true },
  { rank: 2, name: 'Bob', hours: 10, isActive: false },
  { rank: 3, name: 'Charlie', hours: 8, isActive: true },
  { rank: 4, name: 'David', hours: 7, isActive: false },
  { rank: 5, name: 'Eve', hours: 6, isActive: true },
];

export default function LeaderboardsScreen() {
  const [activeTab, setActiveTab] = useState<'school' | 'location'>('school');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'school' && styles.tabActive]}
          onPress={() => setActiveTab('school')}
        >
          <Text style={[styles.tabText, activeTab === 'school' && styles.tabTextActive]}>
            School
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'location' && styles.tabActive]}
          onPress={() => setActiveTab('location')}
        >
          <Text style={[styles.tabText, activeTab === 'location' && styles.tabTextActive]}>
            Location
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.leaderboard}>
        {MOCK_LEADERBOARD.map((entry) => (
          <View key={entry.rank} style={styles.entry}>
            <Text style={styles.rank}>#{entry.rank}</Text>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{entry.name[0]}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{entry.name}</Text>
              <View style={[styles.status, entry.isActive && styles.statusActive]} />
            </View>
            <Text style={styles.hours}>{entry.hours}h</Text>
          </View>
        ))}
      </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#eee',
  },
  tabActive: {
    borderBottomColor: '#111',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  tabTextActive: {
    color: '#111',
    fontWeight: '600',
  },
  leaderboard: {
    paddingHorizontal: 24,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rank: {
    width: 40,
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  status: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  statusActive: {
    backgroundColor: '#22c55e',
  },
  hours: {
    fontSize: 16,
    fontWeight: '600',
  },
});
