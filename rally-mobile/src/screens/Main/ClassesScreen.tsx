import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  StatusBar,
  Modal,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { classesApi, ClassItem } from '../../api/classes';
import { useAppTheme } from '../../theme/ThemeContext';

const CARD_COLORS: Array<{ from: string; shadow: string }> = [
  { from: '#6366F1', shadow: '#6366F133' },
  { from: '#E85A4F', shadow: '#E85A4F33' },
  { from: '#32D583', shadow: '#32D58333' },
  { from: '#F59E0B', shadow: '#F59E0B33' },
  { from: '#8B5CF6', shadow: '#8B5CF633' },
];

export default function ClassesScreen() {
  const { t, animBg, statusBarStyle } = useAppTheme();
  const [myClasses, setMyClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [showBrowse, setShowBrowse] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ClassItem[]>([]);
  const [searching, setSearching] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => { fetchMyClasses(); }, []);

  const fetchMyClasses = async () => {
    try {
      setLoading(true);
      const data = await classesApi.getClasses(true);
      setMyClasses(data.classes || []);
    } catch (e) {
      console.error('Failed to fetch classes:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    try {
      setSearching(true);
      const data = await classesApi.getClasses(false, query || undefined);
      setSearchResults((data.classes || []).filter((c: ClassItem) => !c.isJoined));
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleJoin = async (classId: string) => {
    try {
      setJoiningId(classId);
      await classesApi.joinClass(classId);
      fetchMyClasses();
      handleSearch(searchQuery);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to join class');
    } finally {
      setJoiningId(null);
    }
  };

  const handleLeave = async (classId: string) => {
    try {
      setJoiningId(classId);
      await classesApi.leaveClass(classId);
      fetchMyClasses();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to leave class');
    } finally {
      setJoiningId(null);
    }
  };

  const totalStudents = myClasses.reduce((sum, c) => sum + (c.memberCount || 0), 0);

  return (
    <Animated.View style={[styles.container, { backgroundColor: animBg, paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: t.text }]}>Classes</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: t.indigo }]}
            onPress={() => { setShowBrowse(true); handleSearch(''); }}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { color: t.muted }]}>MY CLASSES</Text>

        {loading ? (
          <ActivityIndicator size="large" color={t.indigo} style={{ marginTop: 40 }} />
        ) : myClasses.length > 0 ? (
          <>
            {myClasses.map((cls, idx) => {
              const { from } = CARD_COLORS[idx % CARD_COLORS.length];
              return (
                <TouchableOpacity
                  key={cls.id}
                  style={[styles.classCard, { backgroundColor: from }]}
                  onLongPress={() =>
                    Alert.alert('Leave Class?', `Leave ${cls.name}?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Leave', style: 'destructive', onPress: () => handleLeave(cls.id) },
                    ])
                  }
                  activeOpacity={0.9}
                >
                  <View style={styles.classCardTop}>
                    <Text style={styles.classCardName}>{cls.name}</Text>
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  </View>
                  <Text style={styles.classCardSub}>
                    {cls.memberCount} students · {cls.section ? `${cls.section} · ` : ''}{cls.code}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: t.surface }]}>
                <Text style={[styles.statValue, { color: t.text }]}>{myClasses.length}</Text>
                <Text style={[styles.statLabel, { color: t.muted }]}>Active Classes</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: t.surface }]}>
                <Text style={[styles.statValue, { color: t.text }]}>{totalStudents}</Text>
                <Text style={[styles.statLabel, { color: t.muted }]}>Total Students</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: t.surface }]}>
            <Text style={[styles.emptyText, { color: t.text }]}>No classes yet</Text>
            <Text style={[styles.emptySubText, { color: t.muted }]}>Tap + to browse and join classes</Text>
          </View>
        )}
      </ScrollView>

      {/* Browse Modal */}
      <Modal
        visible={showBrowse}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBrowse(false)}
      >
        <View style={[styles.modal, { backgroundColor: t.bg }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: t.text }]}>Browse Classes</Text>
            <TouchableOpacity onPress={() => setShowBrowse(false)} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={t.text} />
            </TouchableOpacity>
          </View>

          <View style={[styles.searchBar, { backgroundColor: t.surface }]}>
            <Ionicons name="search-outline" size={18} color={t.muted} />
            <TextInput
              style={[styles.searchInput, { color: t.text }]}
              placeholder="Search classes..."
              placeholderTextColor={t.dimmed}
              value={searchQuery}
              onChangeText={handleSearch}
              autoCorrect={false}
              autoCapitalize="none"
              autoFocus
            />
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {searching ? (
              <ActivityIndicator size="large" color={t.indigo} style={{ marginTop: 40 }} />
            ) : (
              searchResults.map(cls => (
                <View key={cls.id} style={[styles.browseRow, { backgroundColor: t.surface }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.browseClassName, { color: t.text }]}>{cls.name}</Text>
                    <Text style={[styles.browseClassSub, { color: t.muted }]}>
                      {cls.memberCount} students · {cls.code}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.joinBtn, { backgroundColor: t.indigo }]}
                    onPress={() => handleJoin(cls.id)}
                    disabled={joiningId === cls.id}
                    activeOpacity={0.8}
                  >
                    {joiningId === cls.id
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.joinBtnText}>Join</Text>}
                  </TouchableOpacity>
                </View>
              ))
            )}
            {!searching && searchResults.length === 0 && searchQuery.length > 0 && (
              <Text style={[styles.noResults, { color: t.muted }]}>No classes found</Text>
            )}
            {!searching && searchResults.length === 0 && searchQuery.length === 0 && (
              <Text style={[styles.noResults, { color: t.muted }]}>Search for a class to get started</Text>
            )}
          </ScrollView>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52, marginBottom: 20 },
  title: { fontFamily: 'Fraunces', fontSize: 28, fontWeight: '500', letterSpacing: -0.8 },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1.5, marginBottom: 12 },
  classCard: { borderRadius: 20, padding: 20, marginBottom: 12 },
  classCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  classCardName: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1, marginRight: 8 },
  activeBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  activeBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  classCardSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 16, padding: 16 },
  statValue: { fontSize: 28, fontWeight: '700', letterSpacing: -0.8, marginBottom: 4 },
  statLabel: { fontSize: 12 },
  emptyCard: { borderRadius: 20, padding: 32, alignItems: 'center', marginTop: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  emptySubText: { fontSize: 13 },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  modalTitle: { fontFamily: 'Fraunces', fontSize: 22, fontWeight: '500' },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, height: 48, paddingHorizontal: 16, gap: 10, marginHorizontal: 24, marginBottom: 16 },
  searchInput: { flex: 1, fontSize: 15 },
  modalScroll: { paddingHorizontal: 24, paddingBottom: 40 },
  browseRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 10 },
  browseClassName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  browseClassSub: { fontSize: 13 },
  joinBtn: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  joinBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  noResults: { fontSize: 13, textAlign: 'center', marginTop: 40 },
});
