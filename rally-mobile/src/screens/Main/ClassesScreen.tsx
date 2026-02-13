import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const MOCK_CLASSES = [
  { id: '1', code: 'ECON-UA-1', name: 'Introduction to Economics', memberCount: 45, isJoined: true },
  { id: '2', code: 'CS-UA-101', name: 'Computer Science Principles', memberCount: 120, isJoined: false },
  { id: '3', code: 'MATH-UA-121', name: 'Calculus I', memberCount: 200, isJoined: false },
];

export default function ClassesScreen() {
  const [activeTab, setActiveTab] = useState<'my' | 'browse'>('my');

  const filteredClasses = activeTab === 'my' 
    ? MOCK_CLASSES.filter(c => c.isJoined)
    : MOCK_CLASSES;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Classes</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'my' && styles.tabActive]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
            My Classes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'browse' && styles.tabActive]}
          onPress={() => setActiveTab('browse')}
        >
          <Text style={[styles.tabText, activeTab === 'browse' && styles.tabTextActive]}>
            Browse
          </Text>
        </TouchableOpacity>
      </View>

      {filteredClasses.map((cls) => (
        <View key={cls.id} style={styles.classCard}>
          <View style={styles.classHeader}>
            <Text style={styles.classCode}>{cls.code}</Text>
            <Text style={styles.memberCount}>{cls.memberCount} students</Text>
          </View>
          <Text style={styles.className}>{cls.name}</Text>
          <TouchableOpacity 
            style={[styles.joinButton, cls.isJoined && styles.joinedButton]}
          >
            <Text style={[styles.joinButtonText, cls.isJoined && styles.joinedButtonText]}>
              {cls.isJoined ? 'Joined' : 'Join'}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
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
  classCard: {
    margin: 24,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 12,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  classCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  memberCount: {
    fontSize: 12,
    color: '#666',
  },
  className: {
    fontSize: 16,
    marginBottom: 12,
  },
  joinButton: {
    backgroundColor: '#111',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  joinedButton: {
    backgroundColor: '#22c55e',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  joinedButtonText: {
    color: '#fff',
  },
});
