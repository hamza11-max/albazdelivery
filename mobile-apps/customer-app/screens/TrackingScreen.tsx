import React from 'react';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, spacing } from '../theme';
import { Box, Text } from '../components/ui';
import { useQuery } from '@tanstack/react-query';
import { ordersAPI } from '../services/api-client';
import copy from '../copy';

const STATUS_STEPS = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'IN_DELIVERY', 'DELIVERED'];

interface TrackingScreenProps {
  orderId: string;
  onBack: () => void;
}

export const TrackingScreen: React.FC<TrackingScreenProps> = ({ orderId, onBack }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const res = await ordersAPI.getById(orderId);
      return res.data as { order: { id: string; status: string; total: number; store?: { name: string } } };
    },
    refetchInterval: 5000,
  });

  const order = data?.order;

  return (
    <Box flex={1} backgroundColor={colors.background}>
      <Box
        flexDirection="row"
        alignItems="center"
        px="md"
        py="md"
        backgroundColor={colors.surface}
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <TouchableOpacity onPress={onBack} style={{ padding: spacing.sm }}>
          <Text size="md" weight="semibold" color={colors.olive}>← {copy.actions.back}</Text>
        </TouchableOpacity>
        <Text variant="h3" style={{ flex: 1, textAlign: 'center' }}>Suivi</Text>
      </Box>
      {isLoading ? (
        <Box mt="xl" alignItems="center">
          <ActivityIndicator size="large" color={colors.olive} />
        </Box>
      ) : order ? (
        <Box p="md">
          <Text variant="caption" color="tertiary">Commande #{order.id.slice(-8)}</Text>
          <Text variant="h3" style={{ marginTop: 4 }}>{order.store?.name ?? 'Magasin'}</Text>
          <Text variant="body" style={{ color: colors.olive, marginTop: 2 }}>{order.total} DZD</Text>
          <Box style={{ marginTop: spacing.xl }}>
            {STATUS_STEPS.map((step, i) => {
              const idx = STATUS_STEPS.indexOf(order.status);
              const done = i <= idx;
              return (
                <Box key={step} flexDirection="row" alignItems="center" mb="md">
                  <Box
                    width={12}
                    height={12}
                    borderRadius={6}
                    style={{ backgroundColor: done ? colors.olive : colors.border, marginRight: spacing.md }}
                  />
                  <Text variant="bodySmall" color={done ? 'primary' : 'tertiary'} weight={done ? 'semibold' : 'regular'}>
                    {step.replace('_', ' ')}
                  </Text>
                </Box>
              );
            })}
          </Box>
        </Box>
      ) : (
        <Box p="md">
          <Text variant="body" style={{ color: colors.error }}>Commande introuvable</Text>
        </Box>
      )}
    </Box>
  );
};
