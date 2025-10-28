import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useOfflineStore } from '../stores/offline-store';

export const ConnectionStatus = () => {
  const isOnline = useOfflineStore((state) => state.isOnline);
  const [slideAnim] = useState(new Animated.Value(-50));
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable;
      useOfflineStore.getState().setOnlineStatus(online);
      
      if (!online) {
        showBanner();
      } else {
        hideBanner();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const showBanner = () => {
    setIsVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const hideBanner = () => {
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