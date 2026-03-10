import React from 'react';
import { View, ViewStyle } from 'react-native';
import { spacing } from '../../theme';

type Spacing = keyof typeof spacing;

export interface StackProps {
  children?: React.ReactNode;
  direction?: 'vertical' | 'horizontal';
  gap?: Spacing;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  style?: ViewStyle;
  flex?: number;
  testID?: string;
}

const alignMap = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' as const };
const justifyMap = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

export const Stack: React.FC<StackProps> = ({
  children,
  direction = 'vertical',
  gap,
  align,
  justify,
  style,
  flex,
  testID,
}) => (
  <View
    style={[
      {
        flexDirection: direction === 'vertical' ? 'column' : 'row',
        gap: gap != null ? spacing[gap] : undefined,
        alignItems: align != null ? alignMap[align] : undefined,
        justifyContent: justify != null ? justifyMap[justify] : undefined,
        flex,
      },
      style,
    ]}
    testID={testID}
  >
    {children}
  </View>
);
