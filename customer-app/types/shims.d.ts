// Minimal module shims to silence "Cannot find module" TypeScript errors
declare module 'expo-status-bar' {
  import React from 'react';
  export const StatusBar: React.FC<any>;
  const ExpoStatusBar: React.FC<any>;
  export default ExpoStatusBar;
}

declare module 'expo-secure-store' {
  const SecureStore: {
    getItemAsync(key: string): Promise<string | null>;
    setItemAsync(key: string, value: string): Promise<void>;
    deleteItemAsync(key: string): Promise<void>;
  };
  export default SecureStore;
}

declare module '@react-native-community/netinfo' {
  const NetInfo: any;
  export default NetInfo;
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  };
  export default AsyncStorage;
}

declare module '@react-navigation/native' {
  export * from 'react';
  const ReactNavigation: any;
  export default ReactNavigation;
}

declare module '@react-navigation/bottom-tabs' {
  const Tabs: any;
  export default Tabs;
}

// Allow any other untyped imports in this folder to pass type checking
declare module '*';
