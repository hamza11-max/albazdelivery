import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { Text } from './Text';

export interface CardProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  /** Card has padding by default; set to false for custom inner padding */
  padded?: boolean;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padded = true,
  testID,
}) => (
  <View
    style={[
      styles.card,
      padded && styles.padded,
      style,
    ]}
    testID={testID}
  >
    {children}
  </View>
);

export interface CardHeaderProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, style }) => (
  <View style={[styles.header, style]}>{children}</View>
);

export interface CardTitleProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, style }) => (
  <Text variant="h3" style={style}>
    {children}
  </Text>
);

export interface CardContentProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const CardContent: React.FC<CardContentProps> = ({ children, style }) => (
  <View style={[styles.content, style]}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  padded: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.sm,
  },
  content: {},
});
