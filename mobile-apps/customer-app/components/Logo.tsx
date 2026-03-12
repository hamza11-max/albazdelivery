import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  /** Optional: use theme-aware color (e.g. in dark mode) */
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', color }) => {
  const sizeMap = {
    sm: typography.fontSize.lg,
    md: typography.fontSize.xl,
    lg: typography.fontSize.xxxl,
  };
  const fontSize = sizeMap[size];
  const textColor = color ?? colors.olive;

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { fontSize, color: textColor }]}>ALBAZ</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  text: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1.2,
  },
});
