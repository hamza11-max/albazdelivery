import React, { useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OfflineWrapper } from './components/OfflineWrapper';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HomeScreen } from './screens/HomeScreen';
import { CategoryScreen } from './screens/CategoryScreen';
import { StoreScreen } from './screens/StoreScreen';
import { CartScreen } from './screens/CartScreen';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { TrackingScreen } from './screens/TrackingScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { LoginScreen } from './screens/LoginScreen';
import type { TabType } from './components/BottomNav';

const queryClient = new QueryClient();

const CITIES = ['Alger', 'Ouargla', 'Ghardaïa', 'Tamanrasset'];

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [screen, setScreen] = useState<
    'home' | 'category' | 'store' | 'cart' | 'checkout' | 'orders' | 'tracking' | 'profile' | 'login'
  >('home');
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedStoreName, setSelectedStoreName] = useState<string>('');
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [selectedCity] = useState(CITIES[CITIES.length - 1] ?? 'Tamanrasset');

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'home') setScreen('home');
    else if (tab === 'search') setScreen('home');
    else if (tab === 'cart') setScreen('cart');
    else if (tab === 'orders') setScreen('orders');
    else if (tab === 'profile') setScreen('profile');
  }, []);

  const handleCategorySelect = useCallback((id: number) => {
    setSelectedCategoryId(id);
    setScreen('category');
  }, []);

  const handleStoreSelect = useCallback((id: string, name?: string) => {
    setSelectedStoreId(id);
    setSelectedStoreName(name ?? '');
    setScreen('store');
  }, []);

  const handleOrderPlaced = useCallback((orderId: string) => {
    setTrackingOrderId(orderId);
    setScreen('tracking');
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    setScreen('login');
  }, [logout]);

  if (loading) return null;
  if (!user) {
    return <LoginScreen onSuccess={() => setScreen('home')} />;
  }

  if (screen === 'login') {
    return <LoginScreen onSuccess={() => setScreen('home')} />;
  }

  if (screen === 'category' && selectedCategoryId !== null) {
    return (
      <CategoryScreen
        categoryId={selectedCategoryId}
        city={selectedCity}
        onSelectStore={(id) => handleStoreSelect(id)}
        onBack={() => setScreen('home')}
      />
    );
  }

  if (screen === 'store' && selectedStoreId) {
    return (
      <StoreScreen
        storeId={selectedStoreId}
        storeName={selectedStoreName}
        onBack={() => setScreen('category')}
        onOpenCart={() => {
          setActiveTab('cart');
          setScreen('cart');
        }}
      />
    );
  }

  if (screen === 'checkout' && selectedStoreId) {
    return (
      <CheckoutScreen
        storeId={selectedStoreId}
        storeName={selectedStoreName}
        onBack={() => setScreen('cart')}
        onOrderPlaced={handleOrderPlaced}
      />
    );
  }

  if (screen === 'tracking' && trackingOrderId) {
    return (
      <TrackingScreen
        orderId={trackingOrderId}
        onBack={() => {
          setTrackingOrderId(null);
          setScreen('orders');
        }}
      />
    );
  }

  if (screen === 'cart') {
    return (
      <CartScreen
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onCheckout={(storeId, storeName) => {
          setSelectedStoreId(storeId);
          setSelectedStoreName(storeName);
          setScreen('checkout');
        }}
        onContinueShopping={() => setScreen('home')}
      />
    );
  }

  if (screen === 'orders') {
    return (
      <OrdersScreen
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSelectOrder={(id) => {
          setTrackingOrderId(id);
          setScreen('tracking');
        }}
      />
    );
  }

  if (screen === 'profile') {
    return (
      <ProfileScreen
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <HomeScreen
      onTabChange={handleTabChange}
      onCategorySelect={handleCategorySelect}
      onNavigateToStore={handleStoreSelect}
    />
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <OfflineWrapper>
            <AppContent />
            <StatusBar style="auto" />
          </OfflineWrapper>
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
