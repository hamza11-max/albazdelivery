import React from 'react';
import { TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { Box, Text, Button } from '../components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersAPI } from '../services/api-client';
import copy from '../copy';

const STATUS_STEPS = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'IN_DELIVERY', 'DELIVERED'];

interface TrackingScreenProps {
  orderId: string;
  onBack: () => void;
  onLeaveReview?: () => void;
}

export const TrackingScreen: React.FC<TrackingScreenProps> = ({ orderId, onBack, onLeaveReview }) => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const res = await ordersAPI.getById(orderId);
      return res.data as {
        order: {
          id: string;
          status: string;
          total: number;
          store?: { name: string };
          driver?: { id: string; name: string; phone?: string; vehicleType?: string };
        };
      };
    },
    refetchInterval: 5000,
  });

  const order = data?.order;
  const driver = order?.driver;

  const cancelMutation = useMutation({
    mutationFn: () => ordersAPI.updateStatus(orderId, 'CANCELLED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      Alert.alert('Annulée', 'La commande a été annulée.');
      onBack();
    },
    onError: (e: Error) => Alert.alert('Erreur', e.message),
  });

  const canCancel = order?.status === 'PENDING';
  const canReview = order?.status === 'DELIVERED';

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
          {driver && (
            <Box
              p="md"
              backgroundColor={colors.surface}
              borderRadius={borderRadius.card}
              style={{ marginTop: spacing.lg, borderWidth: 1, borderColor: colors.border }}
            >
              <Text variant="label" style={{ marginBottom: 4 }}>Chauffeur</Text>
              <Text variant="body">{driver.name}</Text>
              {driver.vehicleType && <Text variant="caption" color="secondary">{driver.vehicleType}</Text>}
              {driver.phone && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${driver.phone}`)}
                  style={{ marginTop: spacing.sm }}
                >
                  <Text variant="bodySmall" color={colors.olive} weight="semibold">📞 Appeler le chauffeur</Text>
                </TouchableOpacity>
              )}
            </Box>
          )}
          <Box flexDirection="row" style={{ marginTop: spacing.xl, gap: spacing.sm }}>
            {canCancel && (
              <Button variant="destructive" onPress={() => Alert.alert('Annuler la commande', 'Confirmer l\'annulation ?', [{ text: 'Non', style: 'cancel' }, { text: 'Oui', onPress: () => cancelMutation.mutate() }])} loading={cancelMutation.isPending} style={{ flex: 1 }}>Annuler la commande</Button>
            )}
            {canReview && onLeaveReview && (
              <Button variant="outline" onPress={onLeaveReview} style={{ flex: 1 }}>Laisser un avis</Button>
            )}
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
