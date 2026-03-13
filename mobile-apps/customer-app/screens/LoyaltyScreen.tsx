import React from 'react';
import { ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, borderRadius } from '../theme';
import { Box, Text, Button } from '../components/ui';
import { loyaltyAPI } from '../services/api-client';
import { useThemeMode } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import copy from '../copy';

interface LoyaltyScreenProps {
  onBack: () => void;
}

export const LoyaltyScreen: React.FC<LoyaltyScreenProps> = ({ onBack }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isDark } = useThemeMode();
  const palette = {
    background: isDark ? '#05090b' : colors.background,
    surface: isDark ? '#111317' : colors.surface,
    border: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
  };

  const { data: accountData, isLoading } = useQuery({
    queryKey: ['loyalty', 'account'],
    queryFn: () => loyaltyAPI.getAccount(user?.id),
  });
  const { data: rewardsData } = useQuery({
    queryKey: ['loyalty', 'rewards'],
    queryFn: () => loyaltyAPI.getRewards(),
  });

  const account = (accountData as { data?: { points?: number; tier?: string } })?.data;
  const points = account?.points ?? 0;
  const rewards = (rewardsData as { data?: { rewards?: Array<{ id: string; name: string; pointsCost: number; description?: string }> } })?.data?.rewards ?? (Array.isArray((rewardsData as { data?: unknown })?.data) ? (rewardsData as { data: Array<{ id: string; name: string; pointsCost: number }> }).data : []);

  const redeemMutation = useMutation({
    mutationFn: ({ rewardId, pointsCost }: { rewardId: string; pointsCost: number }) =>
      loyaltyAPI.redeemReward(user?.id ?? '', rewardId, pointsCost),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loyalty'] }),
    onError: (e: Error) => Alert.alert('Erreur', e.message),
  });

  return (
    <Box flex={1} backgroundColor={palette.background}>
      <Box flexDirection="row" alignItems="center" px="md" py="md" backgroundColor={palette.surface} style={{ borderBottomWidth: 1, borderBottomColor: palette.border }}>
        <TouchableOpacity onPress={onBack} style={{ padding: spacing.sm }}>
          <Text size="md" weight="semibold" color={colors.olive}>← {copy.actions.back}</Text>
        </TouchableOpacity>
        <Text variant="h3" style={{ flex: 1 }}>Fidélité</Text>
      </Box>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
        <Box p="lg" backgroundColor={colors.olive} borderRadius={borderRadius.card} alignItems="center" style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: 28, marginBottom: spacing.xs }}>🎁</Text>
          <Text variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>Points</Text>
          {isLoading ? <ActivityIndicator size="small" color="#fff" style={{ marginTop: spacing.sm }} /> : <Text variant="h1" style={{ color: '#fff', marginTop: spacing.xs }}>{points}</Text>}
        </Box>
        <Text variant="h3" style={{ marginBottom: spacing.sm }}>Récompenses</Text>
        {rewards.length === 0 ? (
          <Text variant="bodySmall" color="secondary">Aucune récompense disponible</Text>
        ) : (
          rewards.map((r) => (
            <Box key={r.id} p="md" backgroundColor={palette.surface} borderRadius={borderRadius.card} style={{ marginBottom: spacing.sm, borderWidth: 1, borderColor: palette.border }}>
              <Text variant="label">{r.name}</Text>
              <Text variant="bodySmall" color="secondary">{(r as { description?: string }).description}</Text>
              <Box flexDirection="row" alignItems="center" justifyContent="space-between" style={{ marginTop: spacing.sm }}>
                <Text variant="label">{r.pointsCost} pts</Text>
                <Button variant="outline" size="sm" onPress={() => points >= r.pointsCost && redeemMutation.mutate({ rewardId: r.id, pointsCost: r.pointsCost })} disabled={points < r.pointsCost || redeemMutation.isPending}>Échanger</Button>
              </Box>
            </Box>
          ))
        )}
      </ScrollView>
    </Box>
  );
};
