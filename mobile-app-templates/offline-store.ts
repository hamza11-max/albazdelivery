import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import NetInfo from '@react-native-community/netinfo';

interface OfflineQueueItem {
  id: string;
  endpoint: string;
  method: string;
  data: any;
  timestamp: number;
}

interface OfflineState {
  isOnline: boolean;
  offlineQueue: OfflineQueueItem[];
  offlineData: Record<string, any>;
  lastSyncTimestamp: number | null;
  
  // Actions
  setOnlineStatus: (status: boolean) => void;
  addToOfflineQueue: (item: Omit<OfflineQueueItem, 'id' | 'timestamp'>) => void;
  removeFromOfflineQueue: (id: string) => void;
  setOfflineData: (key: string, data: any) => void;
  getOfflineData: (key: string) => any;
  setLastSyncTimestamp: (timestamp: number) => void;
  
  // Sync operations
  syncOfflineQueue: () => Promise<void>;
  syncOfflineData: () => Promise<void>;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      isOnline: true,
      offlineQueue: [],
      offlineData: {},
      lastSyncTimestamp: null,

      setOnlineStatus: (status) => set({ isOnline: status }),

      addToOfflineQueue: (item) => {
        const queueItem: OfflineQueueItem = {
          ...item,
          id: Math.random().toString(36).substring(7),
          timestamp: Date.now(),
        };
        set((state) => ({
          offlineQueue: [...state.offlineQueue, queueItem],
        }));
      },

      removeFromOfflineQueue: (id) => {
        set((state) => ({
          offlineQueue: state.offlineQueue.filter((item) => item.id !== id),
        }));
      },

      setOfflineData: (key, data) => {
        set((state) => ({
          offlineData: {
            ...state.offlineData,
            [key]: data,
          },
        }));
      },

      getOfflineData: (key) => {
        return get().offlineData[key];
      },

      setLastSyncTimestamp: (timestamp) => {
        set({ lastSyncTimestamp: timestamp });
      },

      syncOfflineQueue: async () => {
        const state = get();
        if (!state.isOnline || state.offlineQueue.length === 0) return;

        const queue = [...state.offlineQueue];
        for (const item of queue) {
          try {
            // Attempt to send the queued request
            await api.request({
              url: item.endpoint,
              method: item.method,
              data: item.data,
            });
            
            // Remove from queue if successful
            state.removeFromOfflineQueue(item.id);
          } catch (error) {
            console.error('Failed to sync queue item:', error);
            // Leave failed items in the queue for retry
          }
        }
      },

      syncOfflineData: async () => {
        const state = get();
        if (!state.isOnline) return;

        try {
          // Sync essential data when online
          const [orders, profile, settings] = await Promise.all([
            api.get('/orders/recent'),
            api.get('/profile'),
            api.get('/settings'),
          ]);

          // Update offline storage
          state.setOfflineData('orders', orders.data);
          state.setOfflineData('profile', profile.data);
          state.setOfflineData('settings', settings.data);
          state.setLastSyncTimestamp(Date.now());
        } catch (error) {
          console.error('Failed to sync offline data:', error);
        }
      },
    }),
    {
      name: 'offline-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);