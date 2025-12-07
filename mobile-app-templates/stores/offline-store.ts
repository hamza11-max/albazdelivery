import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '../services/api';
import { OfflineQueueItem } from '../types';

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

      setOnlineStatus: (status: boolean) => set({ isOnline: status }),

      addToOfflineQueue: (item: Omit<OfflineQueueItem, 'id' | 'timestamp'>) => {
        const queueItem: OfflineQueueItem = {
          ...item,
          id: Math.random().toString(36).substring(7),
          timestamp: Date.now(),
        };
        set((state) => ({
          offlineQueue: [...state.offlineQueue, queueItem],
        }));
      },

      removeFromOfflineQueue: (id: string) => {
        set((state) => ({
          offlineQueue: state.offlineQueue.filter((item) => item.id !== id),
        }));
      },

      setOfflineData: <T>(key: string, data: T) => {
        set((state) => ({
          offlineData: {
            ...state.offlineData,
            [key]: data,
          },
        }));
      },

      getOfflineData: <T>(key: string): T | undefined => {
        const state = get();
        return state.offlineData[key] as T | undefined;
      },

      setLastSyncTimestamp: (timestamp: number) => set({ lastSyncTimestamp: timestamp }),

      syncOfflineQueue: async () => {
        const state = get();
        if (!state.isOnline) return;

        const promises = state.offlineQueue.map(async (item) => {
          try {
            switch (item.method.toLowerCase()) {
              case 'post':
                await api.post(item.endpoint, item.data);
                break;
              case 'put':
                await api.put(item.endpoint, item.data);
                break;
              case 'delete':
                await api.delete(item.endpoint);
                break;
            }
            get().removeFromOfflineQueue(item.id);
          } catch (error) {
            console.error(`Failed to sync item ${item.id}:`, error);
          }
        });

        await Promise.allSettled(promises);
      },

      syncOfflineData: async () => {
        const state = get();
        if (!state.isOnline) return;

        try {
          // Implement your sync logic here
          // Example:
          // const updates = await api.get(`/sync?since=${timestamp}`);
          // set({ offlineData: { ...state.offlineData, ...updates } });
          set({ lastSyncTimestamp: Date.now() });
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