import React, { useEffect } from 'react';
import { View, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { useOfflineStore } from '../stores/offline-store';
import { enhancedApi } from '../services/api';

interface OfflineWrapperProps {
  children: React.ReactNode;
}

export const OfflineWrapper: React.FC<OfflineWrapperProps> = ({ children }) => {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    syncData();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      await syncData();
    }
  };

  const syncData = async () => {
    try {
      await enhancedApi.sync();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ConnectionStatus />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});