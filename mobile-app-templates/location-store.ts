// Location Store Template (For Driver App)
// Copy to: mobile-apps/driver-app/stores/locationStore.ts

import { create } from 'zustand';
import * as Location from 'expo-location';
import { driversAPI } from '../services/api';

interface LocationState {
  location: Location.LocationObject | null;
  isTracking: boolean;
  error: string | null;
  
  // Actions
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  getCurrentLocation: () => Promise<Location.LocationObject | null>;
}

let locationSubscription: Location.LocationSubscription | null = null;

export const useLocationStore = create<LocationState>((set, get) => ({
  location: null,
  isTracking: false,
  error: null,

  startTracking: async () => {
    try {
      // Request permissions
      const { status: foregroundStatus } = 
        await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        set({ error: 'Location permission denied' });
        return;
      }

      // Request background permission for continuous tracking
      const { status: backgroundStatus } = 
        await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        console.warn('Background location permission denied');
      }

      // Start watching position
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Or every 10 meters
        },
        async (location) => {
          set({ location, isTracking: true, error: null });
          
          // Send location to server
          try {
            await driversAPI.updateLocation(
              location.coords.latitude,
              location.coords.longitude
            );
          } catch (error) {
            console.error('Failed to update location:', error);
          }
        }
      );
    } catch (error: any) {
      set({
        error: error.message || 'Failed to start tracking',
        isTracking: false,
      });
    }
  },

  stopTracking: () => {
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }
    set({ isTracking: false });
  },

  getCurrentLocation: async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        set({ error: 'Location permission denied' });
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      set({ location, error: null });
      return location;
    } catch (error: any) {
      set({ error: error.message || 'Failed to get location' });
      return null;
    }
  },
}));

// Hook to auto-start tracking when component mounts
export const useAutoTracking = () => {
  const { startTracking, stopTracking } = useLocationStore();

  React.useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, []);
};
