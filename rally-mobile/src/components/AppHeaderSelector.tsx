import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { Text } from './Text';
import { colors, spacing, borderRadius } from '../theme/colors';

export function AppHeaderSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'class' | 'location'>('class');
  const [isInitialized, setIsInitialized] = useState(false);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  const {
    selectedClassId,
    selectedLocation,
    joinedClasses,
    availableLocations,
    isLoadingClasses,
    isLoadingLocations,
    locationError,
    loadJoinedClasses,
    loadLocations,
    setSelectedClassId,
    setSelectedLocation,
    initializeFromStorage,
  } = useAppStore();

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    await initializeFromStorage();
    await Promise.all([
      loadJoinedClasses(),
      loadLocations(),
    ]);
    setIsInitialized(true);
  }, [isAuthenticated, initializeFromStorage, loadJoinedClasses, loadLocations]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedClass = joinedClasses.find(c => c.id === selectedClassId);

  const getDisplayText = () => {
    const parts = [];
    if (selectedClass) {
      parts.push(selectedClass.code);
    }
    if (selectedLocation) {
      parts.push(selectedLocation.name);
    }
    if (parts.length === 0) {
      return 'Select class & location';
    }
    return parts.join(' at ');
  };

  const renderLocationItem = ({ item }: { item: any }) => {
    const isSelected = selectedLocation?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.optionItem, isSelected && styles.optionItemSelected]}
        onPress={() => {
          setSelectedLocation(item);
          setIsOpen(false);
        }}
      >
        <Text variant="body" style={isSelected ? { color: colors.primary, fontWeight: '600' } : {}}>
          {item.name}
        </Text>
        {item.parent && (
          <Text variant="caption">{item.parent.name}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderClassItem = ({ item }: { item: any }) => {
    const isSelected = selectedClassId === item.id;
    return (
      <TouchableOpacity
        style={[styles.optionItem, isSelected && styles.optionItemSelected]}
        onPress={() => {
          setSelectedClassId(item.id);
          setIsOpen(false);
        }}
      >
        <Text variant="body" style={isSelected ? { color: colors.primary, fontWeight: '600' } : {}}>
          {item.code}
        </Text>
        <Text variant="caption">{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.selectorButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <Text variant="bodySmall" style={styles.selectorText} numberOfLines={1}>
          {getDisplayText()}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'class' && styles.tabActive]}
                onPress={() => setActiveTab('class')}
              >
                <Text variant="body" style={activeTab === 'class' ? styles.tabTextActive : styles.tabText}>
                  Class
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'location' && styles.tabActive]}
                onPress={() => setActiveTab('location')}
              >
                <Text variant="body" style={activeTab === 'location' ? styles.tabTextActive : styles.tabText}>
                  Location
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'class' && (
              <>
                <TouchableOpacity
                  style={[styles.optionItem, !selectedClassId && styles.optionItemSelected]}
                  onPress={() => {
                    setSelectedClassId(null);
                    setIsOpen(false);
                  }}
                >
                  <Text variant="body" style={!selectedClassId ? { color: colors.primary, fontWeight: '600' } : {}}>
                    General Study
                  </Text>
                  <Text variant="caption">No specific class</Text>
                </TouchableOpacity>
                {isLoadingClasses ? (
                  <ActivityIndicator style={{ margin: spacing.lg }} color={colors.primary} />
                ) : (
                  <FlatList
                    data={joinedClasses}
                    renderItem={renderClassItem}
                    keyExtractor={item => item.id}
                    style={styles.list}
                  />
                )}
              </>
            )}

            {activeTab === 'location' && (
              <>
                <TouchableOpacity
                  style={[styles.optionItem, !selectedLocation && styles.optionItemSelected]}
                  onPress={() => {
                    setSelectedLocation(null);
                    setIsOpen(false);
                  }}
                >
                  <Text variant="body" style={!selectedLocation ? { color: colors.primary, fontWeight: '600' } : {}}>
                    No Location
                  </Text>
                  <Text variant="caption">Don't show on leaderboard</Text>
                </TouchableOpacity>
                {isLoadingLocations ? (
                  <ActivityIndicator style={{ margin: spacing.lg }} color={colors.primary} />
                ) : locationError ? (
                  <View style={{ padding: spacing.lg, alignItems: 'center' }}>
                    <Text variant="bodySmall" style={{ color: '#ff6b6b', textAlign: 'center' }}>
                      {locationError}
                    </Text>
                    <TouchableOpacity 
                      style={{ marginTop: spacing.sm }}
                      onPress={() => loadLocations()}
                    >
                      <Text variant="bodySmall" style={{ color: colors.primary }}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : availableLocations.length === 0 ? (
                  <View style={{ padding: spacing.lg, alignItems: 'center' }}>
                    <Text variant="bodySmall" style={{ color: colors.textSecondary, textAlign: 'center' }}>
                      No locations available
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={availableLocations}
                    renderItem={renderLocationItem}
                    keyExtractor={item => item.id}
                    style={styles.list}
                  />
                )}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const theme = {
  surface: 'rgba(255, 255, 255, 0.4)',
  surfaceStrong: 'rgba(255, 255, 255, 0.65)',
  ink: '#10261A',
  muted: '#5A7065',
  accent: '#2A4C3D',
  line: 'rgba(20, 50, 40, 0.08)',
};

const styles = StyleSheet.create({
  selectorButton: {
    alignSelf: 'center',
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginBottom: 0,
    maxWidth: 220,
  },
  selectorText: {
    color: theme.ink,
    fontWeight: '600',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxHeight: '70%',
    backgroundColor: theme.surfaceStrong,
    borderRadius: 24,
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: 'rgba(28, 56, 44, 0.12)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.accent,
  },
  tabText: {
    color: theme.muted,
  },
  tabTextActive: {
    color: theme.accent,
    fontWeight: '600',
  },
  list: {
    maxHeight: 300,
  },
  optionItem: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.line,
  },
  optionItemSelected: {
    backgroundColor: 'rgba(42, 76, 61, 0.1)',
  },
});
