import React from 'react';
import { Text as RNText, TextStyle, StyleSheet } from 'react-native';
import { colors, typography } from '../theme/colors';

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption' | 'label';

interface TextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  color?: string;
  style?: TextStyle;
  numberOfLines?: number;
}

export function Text({ children, variant = 'body', color, style, numberOfLines }: TextProps) {
  return (
    <RNText
      style={[styles[variant], color ? { color } : {}, style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontSize: typography.xxxl,
    fontWeight: '700',
    color: colors.foreground,
  },
  h2: {
    fontSize: typography.xxl,
    fontWeight: '600',
    color: colors.foreground,
  },
  h3: {
    fontSize: typography.xl,
    fontWeight: '600',
    color: colors.foreground,
  },
  body: {
    fontSize: typography.md,
    color: colors.foreground,
  },
  bodySmall: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  label: {
    fontSize: typography.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.1,
    color: colors.textSecondary,
  },
});
