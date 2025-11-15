import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ConnectionStatus } from './components/ConnectionStatus';
import { HomeScreen } from './screens/HomeScreen';
import { colors } from './theme/colors';

export default function App() {
  return (
    <View style={styles.container}>
      <ConnectionStatus />
      <HomeScreen />
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