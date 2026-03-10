import React from 'react';
import { FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, borderRadius } from '../theme';
import { Box, Text, Card } from '../components/ui';
import { ordersAPI } from '../services/api-client';
import { BottomNav, TabType } from '../components/BottomNav';
import copy from '../copy';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  ACCEPTED: 'Acceptée',
  PREPARING: 'En préparation',
  READY: 'Prête',
  IN_DELIVERY: 'En livraison',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

interface OrdersScreenProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onSelectOrder: (orderId: string) => void;
}

export const OrdersScreen: React.FC<OrdersScreenProps> = ({
  activeTab,
  onTabChange,
  onSelectOrder,
}) => {
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await ordersAPI.list();
      return (res.data as { orders: Array<{ id: string; status: string; total: number; createdAt: string; store?: { name: string } }> }).orders;
    },
  });

  const orders = ordersData ?? [];

  return (
    <Box flex={1} backgroundColor={colors.background}>
      <Box
        px="md"
        py="md"
        backgroundColor={colors.surface}
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <Text variant="h2">{copy.titles.dats}</Text>
      </Box>
      {isLoading ? (
        <Box mt="xl" alignItems="center">
          <ActivityIndicator size="large" color={colors.olive} />
        </Box>
      ) : orders.length === 0 ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>📋</Text>
          <Text variant="body" color="secondary">{copy.empty.noOrders}</Text>
        </Box>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => onSelectOrder(item.id)}
              activeOpacity={0.7}
              style={{ marginBottom: spacing.md }}
            >
              <Card>
                <Text variant="caption" color="tertiary">#{item.id.slice(-8)}</Text>
                <Text variant="h3" style={{ marginTop: 4 }}>{item.store?.name ?? 'Magasin'}</Text>
                <Text variant="bodySmall" style={{ color: colors.olive, marginTop: 2 }}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </Text>
                <Text variant="label" style={{ marginTop: 4 }}>{item.total} DZD</Text>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </Box>
  );
};
