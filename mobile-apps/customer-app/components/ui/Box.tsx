import React from 'react';
import { View, ViewStyle } from 'react-native';
import { spacing } from '../../theme';

type Spacing = keyof typeof spacing;

export interface BoxProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  /** Flexbox */
  flex?: number;
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  /** Spacing (token keys) */
  p?: Spacing;
  px?: Spacing;
  py?: Spacing;
  pt?: Spacing;
  pb?: Spacing;
  pl?: Spacing;
  pr?: Spacing;
  m?: Spacing;
  mx?: Spacing;
  my?: Spacing;
  mt?: Spacing;
  mb?: Spacing;
  ml?: Spacing;
  mr?: Spacing;
  /** Gap (token key) */
  gap?: Spacing;
  /** Layout */
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  height?: number | string;
  minHeight?: number;
  backgroundColor?: string;
  borderRadius?: number;
  /** Other */
  testID?: string;
}

export const Box: React.FC<BoxProps> = ({
  children,
  style,
  flex,
  flexDirection,
  flexWrap,
  alignItems,
  justifyContent,
  alignSelf,
  p,
  px,
  py,
  pt,
  pb,
  pl,
  pr,
  m,
  mx,
  my,
  mt,
  mb,
  ml,
  mr,
  gap,
  width,
  minWidth,
  maxWidth,
  height,
  minHeight,
  backgroundColor,
  borderRadius,
  testID,
}) => {
  const viewStyle: ViewStyle = {
    ...(flex != null && { flex }),
    ...(flexDirection && { flexDirection }),
    ...(flexWrap && { flexWrap }),
    ...(alignItems && { alignItems }),
    ...(justifyContent && { justifyContent }),
    ...(alignSelf && { alignSelf }),
    ...(p != null && { padding: spacing[p] }),
    ...(px != null && { paddingHorizontal: spacing[px] }),
    ...(py != null && { paddingVertical: spacing[py] }),
    ...(pt != null && { paddingTop: spacing[pt] }),
    ...(pb != null && { paddingBottom: spacing[pb] }),
    ...(pl != null && { paddingLeft: spacing[pl] }),
    ...(pr != null && { paddingRight: spacing[pr] }),
    ...(m != null && { margin: spacing[m] }),
    ...(mx != null && { marginHorizontal: spacing[mx] }),
    ...(my != null && { marginVertical: spacing[my] }),
    ...(mt != null && { marginTop: spacing[mt] }),
    ...(mb != null && { marginBottom: spacing[mb] }),
    ...(ml != null && { marginLeft: spacing[ml] }),
    ...(mr != null && { marginRight: spacing[mr] }),
    ...(gap != null && { gap: spacing[gap] }),
    ...(width != null && { width }),
    ...(minWidth != null && { minWidth }),
    ...(maxWidth != null && { maxWidth }),
    ...(height != null && { height }),
    ...(minHeight != null && { minHeight }),
    ...(backgroundColor && { backgroundColor }),
    ...(borderRadius != null && { borderRadius }),
  };
  return (
    <View style={[viewStyle, style]} testID={testID}>
      {children}
    </View>
  );
};
