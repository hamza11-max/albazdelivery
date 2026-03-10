import React from 'react';
import { TextInput, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';

export interface InputProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  testID?: string;
}

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  placeholderTextColor = colors.text.tertiary,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  editable = true,
  style,
  containerStyle,
  leftIcon,
  testID,
}) => {
  const input = (
    <TextInput
      style={[styles.input, leftIcon ? styles.inputWithLeft : null]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      editable={editable}
      testID={testID}
    />
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
      {input}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  inputWithLeft: {
    paddingLeft: spacing.sm,
  },
  leftIcon: {
    marginRight: spacing.xs,
  },
});
