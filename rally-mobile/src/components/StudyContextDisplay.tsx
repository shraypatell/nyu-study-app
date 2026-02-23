import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from './Text';
import { useAppTheme } from '../theme/ThemeContext';

interface StudyContextDisplayProps {
  selectedClassName: string | null;
  selectedLocationName: string | null;
  onPress: () => void;
}

export function StudyContextDisplay({
  selectedClassName,
  selectedLocationName,
  onPress,
}: StudyContextDisplayProps) {
  const { t } = useAppTheme();

  const classDisplay = selectedClassName || 'General Study';
  const locationDisplay = selectedLocationName || 'Select Location';

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: t.surface, borderColor: t.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.pillsContainer}>
        <View style={[styles.pill, { backgroundColor: t.indigo }]}>
          <Text variant="bodySmall" style={[styles.pillText, { color: '#fff' }]} numberOfLines={1}>
            {classDisplay}
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: t.surface, borderColor: t.muted, borderWidth: 1 }]}>
          <Text
            variant="bodySmall"
            style={[styles.pillText, { color: t.text }]}
            numberOfLines={1}
          >
            {locationDisplay}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  pillsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
