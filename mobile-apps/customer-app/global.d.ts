// Global type declarations for React Native
declare const __DEV__: boolean;

// Extend the window interface if needed
declare interface Window {
  // Add any window-specific declarations here if needed
}

// Add any other global type declarations here
declare module '*.json' {
  const value: any;
  export default value;
}

// Small, explicit ambient declarations for packages commonly referenced by
// the templates. We prefer explicit shapes over `any` so TS tooling is
// more helpful. If you install the real packages in this app, these
// can be removed to let the package-provided types take precedence.

declare namespace ExpoLocation {
  export type LocationObjectCoords = {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
  };
  export type LocationObject = { coords: LocationObjectCoords; timestamp: number };
  export type LocationSubscription = { remove: () => void };
  export enum Accuracy { Lowest = 0, Low = 1, Balanced = 2, High = 3, Highest = 4 }
  export function requestForegroundPermissionsAsync(): Promise<{ status: 'granted' | 'denied' | string }>;
  export function getCurrentPositionAsync(options?: { accuracy?: Accuracy }): Promise<LocationObject>;
  export function watchPositionAsync(opts: { accuracy?: Accuracy; timeInterval?: number }, cb: (loc: LocationObject) => void): Promise<LocationSubscription>;
}

declare module 'expo-location' {
  export import Accuracy = ExpoLocation.Accuracy;
  export import LocationObject = ExpoLocation.LocationObject;
  export import LocationSubscription = ExpoLocation.LocationSubscription;
  export const requestForegroundPermissionsAsync: typeof ExpoLocation.requestForegroundPermissionsAsync;
  export const getCurrentPositionAsync: typeof ExpoLocation.getCurrentPositionAsync;
  export const watchPositionAsync: typeof ExpoLocation.watchPositionAsync;
}

declare module 'expo-notifications' {
  export type NotificationContent = { [key: string]: any };
  export type NotificationResponse = { notification: { request: { content: NotificationContent } } };
  export function addNotificationReceivedListener(cb: (n: { request: { content: NotificationContent } }) => void): { remove: () => void };
  export function addNotificationResponseReceivedListener(cb: (r: NotificationResponse) => void): { remove: () => void };
  export function scheduleNotificationAsync(details: { content: NotificationContent; trigger?: any }): Promise<string>;
  export function setNotificationHandler(handler: any): void;
  export function setNotificationChannelAsync(channelId: string, channel: any): Promise<void>;
  export function getPermissionsAsync(): Promise<{ status: 'granted' | 'denied' | string }>;
  export function requestPermissionsAsync(): Promise<{ status: 'granted' | 'denied' | string }>;
  export function getExpoPushTokenAsync(options?: any): Promise<{ data: string }>;
  export enum AndroidImportance { MIN = 0, LOW = 1, DEFAULT = 2, HIGH = 3, MAX = 4 }
  export enum AndroidNotificationPriority { LOW = 0, DEFAULT = 1, HIGH = 2 }
}

declare module 'expo-device' {
  export const brand: string;
  export const modelName: string;
  export const isDevice: boolean;
}

declare module 'expo-router' {
  export function useRouter(): { push: (p: string) => void; back: () => void };
}

// If you have @types/react-native-maps installed, TypeScript will pick it up.
// We do not declare `react-native-maps` here so the installed types win.

// However, if the installed types don't include the exact minimal surface used
// by templates, it's helpful to provide a tiny supplemental declaration.
declare module 'react-native-maps' {
  import { ComponentType, Ref } from 'react';
  import { ViewProps } from 'react-native';

  export type LatLng = { latitude: number; longitude: number };
  export type MapViewProps = ViewProps & {
    ref?: Ref<any>;
    provider?: any;
    initialRegion?: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
    region?: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
    showsUserLocation?: boolean;
    showsMyLocationButton?: boolean;
    showsCompass?: boolean;
    showsBuildings?: boolean;
    showsTraffic?: boolean;
    mapType?: string;
  };

  export const PROVIDER_GOOGLE: any;
  export const MapView: ComponentType<MapViewProps>;
  export const Marker: ComponentType<{ coordinate: LatLng; title?: string; description?: string; pinColor?: string; anchor?: { x: number; y: number } } & ViewProps>;
  export const Polyline: ComponentType<{ coordinates: LatLng[]; strokeColor?: string; strokeWidth?: number; strokeColors?: string[]; lineDashPattern?: number[] } & ViewProps>;
  export default MapView;
}

declare module '@react-navigation/native' {
  export function useNavigation(): any;
}

declare module '@react-navigation/bottom-tabs' {
  export function createBottomTabNavigator(): any;
}