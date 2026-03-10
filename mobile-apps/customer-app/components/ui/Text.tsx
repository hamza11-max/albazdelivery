import React from 'react';
import { Text as RNText, TextStyle, StyleSheet } from 'react-native';
import { colors, typography } from '../../theme';

type FontSize = keyof typeof typography.fontSize;
type FontWeight = keyof typeof typography.fontWeight;

export interface TextProps {
  children?: React.ReactNode;
  style?: TextStyle;
  /** Variants matching web (heading, body, caption, etc.) */
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption' | 'label' | 'button';
  /** Override size/weight */
  size?: FontSize;
  weight?: FontWeight;
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'disabled' | string;
  numberOfLines?: number;
  testID?: string;
}

const variantStyles: Record<string, TextStyle> = StyleSheet.create({
  h1: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  h2: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  h3: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  body: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.regular,
    color: colors.text.primary,
  },
  bodySmall: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    color: colors.text.secondary,
  },
  caption: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    color: colors.text.tertiary,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  button: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  },
});

const colorMap: Record<string, string> = {
  primary: colors.text.primary,
  secondary: colors.text.secondary,
  tertiary: colors.text.tertiary,
  inverse: colors.text.inverse,
  disabled: colors.text.disabled,
};

export const Text: React.FC<TextProps> = ({
  children,
  style,
  variant = 'body',
  size,
  weight,
  color,
  numberOfLines,
  testID,
}) => {
  const variantStyle = variantStyles[variant] ?? variantStyles.body;
  const textColor = color ? (colorMap[color] ?? color) : variantStyle.color;
  return (
    <RNText
      style={[
        variantStyle,
        size != null && { fontSize: typography.fontSize[size] },
        weight != null && { fontWeight: typography.fontWeight[weight] },
        textColor != null && { color: textColor },
        style,
      ]}
      numberOfLines={numberOfLines}
      testID={testID}
    >
      {children}
    </RNText>
  );
};
