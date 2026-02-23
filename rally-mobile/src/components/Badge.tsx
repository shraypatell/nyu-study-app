import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../theme/colors';

interface BadgeProps {
  count?: number;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'primary';
  style?: ViewStyle;
}

export function Badge({ count, variant = 'default', style }: BadgeProps) {
  if (!count || count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <View style={[styles.badge, styles[variant], style]}>
      <Text style={[styles.text, variant === 'success' && styles.textLight]}>
        {displayCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  default: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  success: {
    backgroundColor: colors.accent,
  },
  warning: {
    backgroundColor: colors.warning,
  },
  error: {
    backgroundColor: colors.error,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  text: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: colors.foreground,
  },
  textLight: {
    color: '#FFFFFF',
  },
});
