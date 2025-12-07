// Notifications Service Template
// Copy to: mobile-apps/[app-name]/services/notifications.ts

import React from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from './services/api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'your-expo-project-id', // Get from app.json
    })).data;
    
    console.log('Push token:', token);
    
    // Send token to server
    try {
      await api.post('/notifications/register', { token });
    } catch (error) {
      console.error('Failed to register token:', error);
    }
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}

// Listen for notifications while app is foregrounded
export function useNotificationObserver(
  onNotification: (notification: { request: { content: Notifications.NotificationContent } }) => void
) {
  React.useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      onNotification
    );

    return () => subscription.remove();
  }, [onNotification]);
}

// Listen for notification taps
export function useNotificationResponseObserver(
  onResponse: (response: Notifications.NotificationResponse) => void
) {
  React.useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      onResponse
    );

    return () => subscription.remove();
  }, [onResponse]);
}

// Schedule local notification
export async function scheduleNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  trigger?: any
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: trigger || null, // null = show immediately
  });
}

// Notification Templates
export const NotificationTemplates = {
  // Customer notifications
  orderAccepted: (orderNumber: string) => ({
    title: '✅ Order Accepted!',
    body: `Your order #${orderNumber} has been accepted and is being prepared.`,
  }),
  
  orderPreparing: (orderNumber: string) => ({
    title: '👨‍🍳 Preparing Your Order',
    body: `Order #${orderNumber} is being prepared by the restaurant.`,
  }),
  
  driverAssigned: (driverName: string) => ({
    title: '🚗 Driver Assigned',
    body: `${driverName} will deliver your order.`,
  }),
  
  orderOnTheWay: (driverName: string) => ({
    title: '🚚 Order On The Way!',
    body: `${driverName} is heading to your location.`,
  }),
  
  orderDelivered: (orderNumber: string) => ({
    title: '🎉 Order Delivered!',
    body: `Order #${orderNumber} has been delivered. Enjoy your meal!`,
  }),
  
  // Driver notifications
  newOrderAvailable: (restaurantName: string, amount: number) => ({
    title: '💰 New Order Available!',
    body: `${restaurantName} - ${amount} DZD delivery fee`,
  }),
  
  orderCancelled: (orderNumber: string) => ({
    title: '❌ Order Cancelled',
    body: `Order #${orderNumber} has been cancelled by the customer.`,
  }),
};

// Usage Example:
/*
import { registerForPushNotifications, NotificationTemplates, scheduleNotification } from './services/notifications';

// Register on app start
React.useEffect(() => {
  registerForPushNotifications();
}, []);

// Show notification
await scheduleNotification(
  NotificationTemplates.orderAccepted('12345').title,
  NotificationTemplates.orderAccepted('12345').body,
  { orderId: '12345', screen: 'OrderDetails' }
);
*/
