import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const MOCK_CHATS = [
  { id: '1', name: 'Introduction to Economics', type: 'class', lastMessage: 'Anyone studying tonight?', time: '2h ago', unread: 3 },
  { id: '2', name: 'Alice', type: 'dm', lastMessage: 'Want to study together?', time: '5h ago', unread: 0 },
  { id: '3', name: 'Computer Science Principles', type: 'class', lastMessage: 'Exam on Friday', time: '1d ago', unread: 1 },
];

export default function ChatListScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      {MOCK_CHATS.map((chat) => (
        <TouchableOpacity key={chat.id} style={styles.chatItem}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {chat.type === 'class' ? '#' : chat.name[0]}
            </Text>
          </View>
          <View style={styles.chatInfo}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatName}>{chat.name}</Text>
              <Text style={styles.time}>{chat.time}</Text>
            </View>
            <View style={styles.chatFooter}>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {chat.lastMessage}
              </Text>
              {chat.unread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{chat.unread}</Text>
                </View>
              )}
            </View>
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
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  chatInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#111',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
