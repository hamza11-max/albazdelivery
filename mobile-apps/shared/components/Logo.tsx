import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../theme/colors';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const sizeMap = {
    sm: { icon: 24, text: typography.fontSize.lg },
    md: { icon: 32, text: typography.fontSize.xl },
    lg: { icon: 48, text: typography.fontSize.xxxl },
  };

  const { icon, text } = sizeMap[size];

  return (
    <View style={styles.container}>
      {/* Bird Icon - Stylized bird in flight */}
      <View style={[styles.birdContainer, { width: icon, height: icon }]}>
        <Text style={[styles.birdEmoji, { fontSize: icon }]}>🐦</Text>
      </View>
      {showText && (
        <Text style={[styles.text, { fontSize: text }]}>ALBAZ</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  birdContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  birdEmoji: {
    textAlign: 'center',
  },
  text: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: 1,
  },
});

