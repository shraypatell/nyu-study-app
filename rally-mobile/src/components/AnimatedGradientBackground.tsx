import React from 'react';
import { StyleSheet, View } from 'react-native';

export function AnimatedGradientBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.container}>
      <View style={styles.base} />
      <View style={styles.gradient1} />
      <View style={styles.gradient2} />
      <View style={styles.gradient3} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F0F5E9',
  },
  gradient1: {
    position: 'absolute',
    top: '15%',
    right: '5%',
    width: 280,
    height: 280,
    borderRadius: 280,
    backgroundColor: 'rgba(220, 240, 180, 0.5)',
  },
  gradient2: {
    position: 'absolute',
    bottom: '25%',
    left: '5%',
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: 'rgba(74, 138, 110, 0.2)',
  },
  gradient3: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
});
