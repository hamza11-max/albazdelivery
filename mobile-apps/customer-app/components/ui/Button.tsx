import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Text } from './Text';

export interface ButtonProps {
  children?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

const paddingBySize = { sm: spacing.sm, md: spacing.md, lg: spacing.lg };
const heightBySize = { sm: 36, md: 44, lg: 52 };

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  fullWidth,
  style,
  textStyle,
  testID,
}) => {
  const isDisabled = disabled || loading;
  const padding = paddingBySize[size];
  const height = heightBySize[size];

  const buttonStyle: ViewStyle[] = [
    styles.base,
    { paddingHorizontal: padding * 1.5, minHeight: height },
    fullWidth && styles.fullWidth,
    variant === 'primary' && { backgroundColor: colors.olive },
    variant === 'secondary' && { backgroundColor: colors.surfaceElevated },
    variant === 'outline' && {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.olive,
    },
    variant === 'ghost' && { backgroundColor: 'transparent' },
    variant === 'destructive' && { backgroundColor: colors.error },
    isDisabled && styles.disabled,
    style,
  ];

  const textColor =
    variant === 'primary' || variant === 'destructive'
      ? colors.text.inverse
      : variant === 'outline' || variant === 'ghost'
        ? colors.olive
        : colors.text.primary;

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text
          style={[
            { color: textColor, fontWeight: typography.fontWeight.semibold },
            textStyle,
          ]}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.6 },
});
