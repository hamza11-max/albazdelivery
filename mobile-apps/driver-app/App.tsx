import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { ActiveDeliveryScreen } from './screens/ActiveDeliveryScreen';
import { colors } from '../shared/theme/colors';

export default function App() {
  return (
    <View style={styles.container}>
      <ActiveDeliveryScreen />
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

