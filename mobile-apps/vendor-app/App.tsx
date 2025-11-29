import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../shared/theme/colors';
import { useAuthStore } from './stores/authStore';
import { LoginScreen } from './screens/LoginScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { InventoryScreen } from './screens/InventoryScreen';
import { POSScreen } from './screens/POSScreen';
import { SalesScreen } from './screens/SalesScreen';
import { CustomersScreen } from './screens/CustomersScreen';
import { SuppliersScreen } from './screens/SuppliersScreen';
import { SettingsScreen } from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <LoginScreen />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.text.secondary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({ color }) => <Text style={{ color }}>📊</Text>,
          }}
        />
        <Tab.Screen
          name="Inventory"
          component={InventoryScreen}
          options={{
            tabBarLabel: 'Inventory',
            tabBarIcon: ({ color }) => <Text style={{ color }}>📦</Text>,
          }}
        />
        <Tab.Screen
          name="POS"
          component={POSScreen}
          options={{
            tabBarLabel: 'POS',
            tabBarIcon: ({ color }) => <Text style={{ color }}>🛒</Text>,
          }}
        />
        <Tab.Screen
          name="Sales"
          component={SalesScreen}
          options={{
            tabBarLabel: 'Sales',
            tabBarIcon: ({ color }) => <Text style={{ color }}>💰</Text>,
          }}
        />
        <Tab.Screen
          name="Customers"
          component={CustomersScreen}
          options={{
            tabBarLabel: 'Customers',
            tabBarIcon: ({ color }) => <Text style={{ color }}>👥</Text>,
          }}
        />
        <Tab.Screen
          name="Suppliers"
          component={SuppliersScreen}
          options={{
            tabBarLabel: 'Suppliers',
            tabBarIcon: ({ color }) => <Text style={{ color }}>🏭</Text>,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color }) => <Text style={{ color }}>⚙️</Text>,
          }}
        />
      </Tab.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

