import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { OfflineWrapper } from './components/OfflineWrapper';
import { HomeScreen } from './screens/HomeScreen';
import { colors } from '../shared/theme/colors';

export default function App() {
  return (
    <OfflineWrapper>
      <View style={styles.container}>
        <HomeScreen />
        <StatusBar style="auto" />
      </View>
    </OfflineWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
