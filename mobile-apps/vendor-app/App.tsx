import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { DashboardScreen } from './screens/DashboardScreen';
import { colors } from '../shared/theme/colors';

export default function App() {
  return (
    <View style={styles.container}>
      <DashboardScreen />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

