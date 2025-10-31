// Minimal shims for React Native and common Expo/native modules used across apps

declare const __DEV__: boolean;

declare module 'react-native' {
  export const View: any;
  export const Text: any;
  export const Image: any;
  export const StyleSheet: {
    create<T>(styles: T): T;
  };
  export const Platform: any;
  export const Dimensions: any;
  export const TouchableOpacity: any;
  export const StatusBar: any;
  export const Animated: any;
  export type ViewStyle = any;
  export type TextStyle = any;
  export type ImageStyle = any;
  export type FlexStyle = any;
  export type RegisteredStyle<T> = any;
  export type StyleProp<T> = any;
  export default any;
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  };
  export default AsyncStorage;
}

declare module 'expo-secure-store' {
  export function getItemAsync(key: string): Promise<string | null>;
  export function setItemAsync(key: string, value: string): Promise<void>;
  export function deleteItemAsync(key: string): Promise<void>;
  const SecureStore: {
    getItemAsync(key: string): Promise<string | null>;
    setItemAsync(key: string, value: string): Promise<void>;
    deleteItemAsync(key: string): Promise<void>;
  };
  export default SecureStore;
}

declare module '@react-native-community/netinfo' {
  export namespace NetInfo {
    export type NetInfoState = { isConnected: boolean; isInternetReachable?: boolean };
  }
  export function addEventListener(cb: (state: NetInfo.NetInfoState) => void): (() => void) | { remove: () => void };
  export function fetch(): Promise<NetInfo.NetInfoState>;
  const NetInfoDefault: {
    addEventListener(cb: (state: NetInfo.NetInfoState) => void): (() => void) | { remove: () => void };
    fetch(): Promise<NetInfo.NetInfoState>;
  };
  export default NetInfoDefault;
}

// Also provide a global NetInfo namespace for code that references NetInfo.* types
declare namespace NetInfo {
  type NetInfoState = { isConnected: boolean; isInternetReachable?: boolean };
}

declare module 'expo-status-bar' {
  export const StatusBar: any;
  export default StatusBar;
}

declare module '@react-navigation/native' {
  export function useNavigation(): any;
  export function NavigationContainer(props: any): any;
}

declare module '@react-navigation/bottom-tabs' {
  export function createBottomTabNavigator(): any;
}
