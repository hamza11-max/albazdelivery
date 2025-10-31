// Minimal ambient declarations for template-only dependencies.
// These provide a small, useful surface area so template code can be
// type-checked without installing the real packages. When you convert
// a template into a real app, remove these and install the real SDKs
// (expo-location, expo-notifications, react-native-maps, etc.).

declare namespace ExpoLocation {
	export type LocationObjectCoords = {
		latitude: number;
		longitude: number;
		altitude?: number | null;
		accuracy?: number | null;
		heading?: number | null;
		speed?: number | null;
	};

	export type LocationObject = {
		coords: LocationObjectCoords;
		timestamp: number;
	};

	export type LocationSubscription = {
		remove: () => void;
	};

	export enum Accuracy {
		Lowest = 0,
		Low = 1,
		Balanced = 2,
		High = 3,
		Highest = 4,
		BestForNavigation = 5,
	}

	export function requestForegroundPermissionsAsync(): Promise<{ status: 'granted' | 'denied' | string }>;
	export function requestBackgroundPermissionsAsync(): Promise<{ status: 'granted' | 'denied' | string }>;
	export function getCurrentPositionAsync(options?: { accuracy?: Accuracy }): Promise<LocationObject>;
	export function watchPositionAsync(options: { accuracy?: Accuracy; timeInterval?: number; distanceInterval?: number }, callback: (loc: LocationObject) => void): Promise<LocationSubscription>;
}

declare module 'expo-location' {
	export import Accuracy = ExpoLocation.Accuracy;
	export import LocationObject = ExpoLocation.LocationObject;
	export import LocationObjectCoords = ExpoLocation.LocationObjectCoords;
	export import LocationSubscription = ExpoLocation.LocationSubscription;
	export const requestForegroundPermissionsAsync: typeof ExpoLocation.requestForegroundPermissionsAsync;
	export const requestBackgroundPermissionsAsync: typeof ExpoLocation.requestBackgroundPermissionsAsync;
	export const getCurrentPositionAsync: typeof ExpoLocation.getCurrentPositionAsync;
	export const watchPositionAsync: typeof ExpoLocation.watchPositionAsync;
}

// Minimal notifications surface used by templates
declare namespace ExpoNotifications {
	export type NotificationContent = { [key: string]: any };
	export type NotificationResponse = { notification: { request: { content: NotificationContent } } };
	export function addNotificationResponseReceivedListener(cb: (response: NotificationResponse) => void): { remove: () => void };
	export function addNotificationReceivedListener(cb: (notification: { request: { content: NotificationContent } }) => void): { remove: () => void };
	export function scheduleNotificationAsync(details: { content: NotificationContent; trigger?: any }): Promise<string>;

	// Additional runtime helpers used in template code
	export function setNotificationHandler(handler: any): void;
	export function setNotificationChannelAsync(channelId: string, channel: any): Promise<void>;
	export function getPermissionsAsync(): Promise<{ status: 'granted' | 'denied' | string }>;
	export function requestPermissionsAsync(): Promise<{ status: 'granted' | 'denied' | string }>;
	export function getExpoPushTokenAsync(options?: any): Promise<{ data: string }>;

	export enum AndroidImportance { MIN = 0, LOW = 1, DEFAULT = 2, HIGH = 3, MAX = 4 }
	export enum AndroidNotificationPriority { LOW = 0, DEFAULT = 1, HIGH = 2 }
}

declare module 'expo-notifications' {
	export import NotificationContent = ExpoNotifications.NotificationContent;
	export import NotificationResponse = ExpoNotifications.NotificationResponse;
	export const addNotificationResponseReceivedListener: typeof ExpoNotifications.addNotificationResponseReceivedListener;
	export const addNotificationReceivedListener: typeof ExpoNotifications.addNotificationReceivedListener;
	export const scheduleNotificationAsync: typeof ExpoNotifications.scheduleNotificationAsync;
	export const setNotificationHandler: typeof ExpoNotifications.setNotificationHandler;
	export const setNotificationChannelAsync: typeof ExpoNotifications.setNotificationChannelAsync;
	export const getPermissionsAsync: typeof ExpoNotifications.getPermissionsAsync;
	export const requestPermissionsAsync: typeof ExpoNotifications.requestPermissionsAsync;
	export const getExpoPushTokenAsync: typeof ExpoNotifications.getExpoPushTokenAsync;
	export import AndroidImportance = ExpoNotifications.AndroidImportance;
	export import AndroidNotificationPriority = ExpoNotifications.AndroidNotificationPriority;
}

// Very small device surface
declare module 'expo-device' {
	export const brand: string;
	export const modelName: string;
	// In many apps Device.isDevice is used as a boolean value
	export const isDevice: boolean;
}

// Router surface (very small subset) used by templates
declare module 'expo-router' {
	export function useRouter(): { push: (path: string) => void; back: () => void; replace: (path: string) => void };
}

// react-native-maps minimal surface (component types are intentionally generic)
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
		followsUserLocation?: boolean;
		showsMyLocationButton?: boolean;
		showsCompass?: boolean;
		showsBuildings?: boolean;
		showsTraffic?: boolean;
		mapType?: string;
		mapPadding?: { top?: number; right?: number; bottom?: number; left?: number };
	};

	export const PROVIDER_GOOGLE: any;
	export const MapView: ComponentType<MapViewProps>;
	export const Marker: ComponentType<{ coordinate: LatLng; title?: string; description?: string; pinColor?: string; anchor?: { x: number; y: number } } & ViewProps>;
	export const Polyline: ComponentType<{ coordinates: LatLng[]; strokeColor?: string; strokeWidth?: number; strokeColors?: string[]; lineDashPattern?: number[] } & ViewProps>;
	export default MapView;
}

// Navigation placeholders
declare module '@react-navigation/native' {
	export function useNavigation(): any;
}

declare module '@react-navigation/bottom-tabs' {
	export function createBottomTabNavigator(): any;
}