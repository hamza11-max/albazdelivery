import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, borderRadius } from '../theme';
import { Box, Text, Button } from '../components/ui';
import { Input } from '../components/ui';
import { walletAPI } from '../services/api-client';
import { useThemeMode } from '../theme/ThemeProvider';
import copy from '../copy';

interface WalletScreenProps {
  onBack: () => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({ onBack }) => {
  const queryClient = useQueryClient();
  const { isDark } = useThemeMode();
  const [addAmount, setAddAmount] = useState('');
  const palette = {
    background: isDark ? '#05090b' : colors.background,
    surface: isDark ? '#111317' : colors.surface,
    border: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
    text: isDark ? '#f5f1e8' : colors.text.primary,
  };

  const { data: balanceData, isLoading } = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => walletAPI.getBalance(),
  });
  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['wallet', 'transactions'],
    queryFn: () => walletAPI.getTransactions(),
  });

  const rawBalance = (balanceData as { data?: unknown })?.data;
  const balance = typeof rawBalance === 'number' ? rawBalance : (rawBalance as { balance?: number })?.balance ?? 0;
  const rawTx = (txData as { data?: unknown })?.data;
  const transactions = Array.isArray((rawTx as { transactions?: unknown[] })?.transactions)
    ? (rawTx as { transactions: Array<{ id: string; amount: number; description: string; createdAt: string }> }).transactions
    : Array.isArray(rawTx) ? rawTx as Array<{ id: string; amount: number; description: string; createdAt: string }> : [];

  const addFunds = useMutation({
    mutationFn: (amount: number) => walletAPI.addFunds(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setAddAmount('');
      Alert.alert('Succès', 'Recharge enregistrée');
    },
    onError: (e: Error) => Alert.alert('Erreur', e.message),
  });

  const handleAddFunds = () => {
    const n = parseInt(addAmount.replace(/\D/g, ''), 10);
    if (n > 0) addFunds.mutate(n);
    else Alert.alert('Erreur', 'Entrez un montant valide (DZD)');
  };

  return (
    <Box flex={1} backgroundColor={palette.background}>
      <Box flexDirection="row" alignItems="center" px="md" py="md" backgroundColor={palette.surface} style={{ borderBottomWidth: 1, borderBottomColor: palette.border }}>
        <TouchableOpacity onPress={onBack} style={{ padding: spacing.sm }}>
          <Text size="md" weight="semibold" color={colors.olive}>← {copy.actions.back}</Text>
        </TouchableOpacity>
        <Text variant="h3" style={{ flex: 1 }}>Portefeuille</Text>
      </Box>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
        <Box p="lg" backgroundColor={colors.olive} borderRadius={borderRadius.card} alignItems="center" style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: 28, marginBottom: spacing.xs }}>💰</Text>
          <Text variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>Solde</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" style={{ marginTop: spacing.sm }} />
          ) : (
            <Text variant="h1" style={{ color: '#fff', marginTop: spacing.xs }}>{balance} DZD</Text>
          )}
        </Box>
        <Box style={{ marginBottom: spacing.lg }}>
          <Input placeholder="Montant (DZD)" value={addAmount} onChangeText={setAddAmount} keyboardType="numeric" containerStyle={{ marginBottom: spacing.sm }} />
          <Button variant="outline" onPress={handleAddFunds} loading={addFunds.isPending}>Recharger</Button>
        </Box>
        <Text variant="h3" style={{ marginBottom: spacing.sm }}>Historique</Text>
        {txLoading ? <ActivityIndicator size="small" color={colors.olive} /> : transactions.length === 0 ? <Text variant="bodySmall" color="secondary">Aucune transaction</Text> : transactions.slice(0, 20).map((tx) => (
          <Box key={tx.id} flexDirection="row" justifyContent="space-between" alignItems="center" py="sm" style={{ borderBottomWidth: 1, borderBottomColor: palette.border }}>
            <Text variant="bodySmall" style={{ flex: 1 }}>{tx.description || 'Transaction'}</Text>
            <Text variant="label" style={{ color: tx.amount >= 0 ? colors.olive : colors.error }}>{tx.amount >= 0 ? '+' : ''}{tx.amount} DZD</Text>
          </Box>
        ))}
      </ScrollView>
    </Box>
  );
};
