import React from 'react';
import { View, StyleSheet } from 'react-native';

interface OfflineWrapperProps {
  children: React.ReactNode;
}

export const OfflineWrapper: React.FC<OfflineWrapperProps> = ({ children }) => {
  return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});