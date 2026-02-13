import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const MOCK_FRIENDS = [
  { id: '1', username: 'alice', displayName: 'Alice', isActive: true, hours: 5 },
  { id: '2', username: 'bob', displayName: 'Bob', isActive: false, hours: 3 },
  { id: '3', username: 'charlie', displayName: 'Charlie', isActive: true, hours: 8 },
];

export default function FriendsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Friend</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.tabActive]}>
          <Text style={styles.tabTextActive}>Friends</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Requests</Text>
        </TouchableOpacity>
      </View>

      {MOCK_FRIENDS.map((friend) => (
        <TouchableOpacity key={friend.id} style={styles.friendCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {friend.displayName[0]}
            </Text>
          </View>
          <View style={styles.friendInfo}>
            <Text style={styles.friendName}>{friend.displayName}</Text>
            <Text style={styles.friendUsername}>@{friend.username}</Text>
          </View>
          <View style={styles.friendStats}>
            <View style={[styles.status, friend.isActive && styles.statusActive]} />
            <Text style={styles.hours}>{friend.hours}h today</Text>
          </View>
        </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  tab: {
    marginRight: 24,
    paddingBottom: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#111',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  tabTextActive: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
  },
  friendUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  friendStats: {
    alignItems: 'flex-end',
  },
  status: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginBottom: 4,
  },
  statusActive: {
    backgroundColor: '#22c55e',
  },
  hours: {
    fontSize: 12,
    color: '#666',
  },
});
