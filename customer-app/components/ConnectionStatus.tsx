import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, StyleProp, ViewStyle, TextStyle } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useOfflineStore } from '../stores/offline-store';

interface ConnectionStatusStyles {
  container: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
  subText: StyleProp<TextStyle>;
}

export const ConnectionStatus: React.FC = () => {
  const isOnline = useOfflineStore((state) => state.isOnline);
  const [slideAnim] = useState(new Animated.Value(-50));
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
  type Unsubscribe = (() => void) | { remove: () => void };
  const unsubscribe: Unsubscribe = NetInfo.addEventListener((state: NetInfo.NetInfoState) => {
      const online = (state.isConnected && state.isInternetReachable) ?? false;
      useOfflineStore.getState().setOnlineStatus(online);
      
      if (!online) {
        showBanner();
      } else {
        hideBanner();
      }
    });

    return () => {
      try {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        } else if (unsubscribe && typeof unsubscribe.remove === 'function') {
          unsubscribe.remove();
        }
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const showBanner = (): void => {
    setIsVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const hideBanner = (): void => {
    Animated.timing(slideAnim, {
      toValue: -50,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsVisible(false));
  };

  if (!isVisible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
        { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }
      ]}
    >
      <Text style={styles.text}>
        {isOnline ? 'Back Online' : 'You are offline'}
      </Text>
      {!isOnline && (
        <Text style={styles.subText}>
          Changes will be saved and synced when connection is restored
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 10,
    zIndex: 1000,
  },
  text: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 2,
  },
});