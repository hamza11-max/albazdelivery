import React, { useEffect } from 'react';
import { View, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { ConnectionStatus } from './ConnectionStatus';
import { useOfflineStore } from '../stores/offline-store';
import { enhancedApi } from '../services/enhanced-api-service';

interface OfflineWrapperProps {
  children: React.ReactNode;
}

export const OfflineWrapper: React.FC<OfflineWrapperProps> = ({ children }) => {
  useEffect(() => {
    // Handle app state changes for background/foreground syncing
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Initial sync
    syncData();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // App came to foreground - sync data
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