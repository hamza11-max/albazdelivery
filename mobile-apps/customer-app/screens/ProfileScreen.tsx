import React from 'react';
import { ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, borderRadius } from '../theme';
import { Box, Text, Button } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { BottomNav, TabType } from '../components/BottomNav';
import { useThemeMode } from '../theme/ThemeProvider';
import { WALLET_SUSPENDED } from '../config/features';
import { addressesAPI, loyaltyAPI } from '../services/api-client';
import copy from '../copy';

const TOP_MENU_ITEMS: Array<{ id: string; icon: string; label: string }> = [
  { id: 'wallet', icon: '💰', label: 'Portefeuille' },
  { id: 'notifications', icon: '🔔', label: 'Notifications' },
].filter((item) => !(item.id === 'wallet' && WALLET_SUSPENDED));

interface ProfileScreenProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onLogout: () => void;
  onNavigateToWallet?: () => void;
  onNavigateToAddresses?: () => void;
  onNavigateToNotifications?: () => void;
  onNavigateToLoyalty?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  activeTab,
  onTabChange,
  onLogout,
  onNavigateToWallet,
  onNavigateToAddresses,
  onNavigateToNotifications,
  onNavigateToLoyalty,
}) => {
  const { user } = useAuth();
  const { isDark } = useThemeMode();
  const surface = isDark ? '#111317' : colors.surface;
  const border = isDark ? 'rgba(255,255,255,0.06)' : colors.border;

  const { data: addressesData } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesAPI.list(),
  });
  const { data: loyaltyData } = useQuery({
    queryKey: ['loyalty', 'account'],
    queryFn: () => loyaltyAPI.getAccount(user?.id),
  });

  const addresses = (addressesData as { data?: Array<{ id: string; label?: string; address: string; city: string }> })?.data ?? [];
  const points = (loyaltyData as { data?: { points?: number } })?.data?.points ?? 0;

  const handleMenuPress = (id: string) => {
    if (id === 'wallet') onNavigateToWallet?.();
    else if (id === 'notifications') onNavigateToNotifications?.();
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: onLogout },
    ]);
  };

  return (
    <Box flex={1} backgroundColor={isDark ? '#05090b' : colors.background}>
      <Box
        px="md"
        py="md"
        backgroundColor={surface}
        style={{ borderBottomWidth: 1, borderBottomColor: border }}
      >
        <Text variant="h2">{copy.titles.profile}</Text>
      </Box>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <Box alignItems="center" pt="xl">
          <Box
            width={80}
            height={80}
            borderRadius={40}
            backgroundColor={colors.olive}
            justifyContent="center"
            alignItems="center"
          >
            <Text variant="h1" color="inverse" style={{ fontSize: 32 }}>
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </Box>
          <Text variant="h2" style={{ marginTop: spacing.md }}>{user?.name ?? 'Utilisateur'}</Text>
          <Text variant="bodySmall" color="secondary" style={{ marginTop: 4 }}>{user?.email ?? ''}</Text>
        </Box>

        {/* Top menu: Wallet, Notifications */}
        <Box px="md" pt="xl">
          {TOP_MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleMenuPress(item.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.sm,
                marginBottom: spacing.xs,
                backgroundColor: surface,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: border,
              }}
            >
              <Text style={{ fontSize: 24, marginRight: spacing.md }}>{item.icon}</Text>
              <Text variant="body" style={{ flex: 1 }}>{item.label}</Text>
              <Text variant="bodySmall" color="tertiary">›</Text>
            </TouchableOpacity>
          ))}
        </Box>

        {/* Sections under profile: Adresses, Fidélité, Support */}
        <Box px="md" pt="lg">
          <Text variant="caption" color="tertiary" style={{ marginBottom: spacing.sm }}>Compte</Text>

          {/* Adresses */}
          <Box
            p="md"
            backgroundColor={surface}
            borderRadius={borderRadius.card}
            style={{ marginBottom: spacing.sm, borderWidth: 1, borderColor: border }}
          >
            <Box flexDirection="row" alignItems="center" style={{ marginBottom: spacing.sm }}>
              <Text style={{ fontSize: 22, marginRight: spacing.sm }}>📍</Text>
              <Text variant="h3">Adresses</Text>
            </Box>
            {addresses.length === 0 ? (
              <Text variant="bodySmall" color="secondary">Aucune adresse enregistrée</Text>
            ) : (
              addresses.slice(0, 2).map((a) => (
                <Text key={a.id} variant="bodySmall" color="secondary" style={{ marginBottom: 4 }} numberOfLines={1}>
                  {a.label || a.address} – {a.city}
                </Text>
              ))
            )}
            {addresses.length > 2 && <Text variant="caption" color="tertiary">+{addresses.length - 2} autre(s)</Text>}
            <TouchableOpacity onPress={onNavigateToAddresses} style={{ marginTop: spacing.sm }}>
              <Text variant="bodySmall" color={colors.olive} weight="semibold">Gérer les adresses</Text>
            </TouchableOpacity>
          </Box>

          {/* Fidélité */}
          <Box
            p="md"
            backgroundColor={surface}
            borderRadius={borderRadius.card}
            style={{ marginBottom: spacing.sm, borderWidth: 1, borderColor: border }}
          >
            <Box flexDirection="row" alignItems="center" style={{ marginBottom: spacing.sm }}>
              <Text style={{ fontSize: 22, marginRight: spacing.sm }}>🎁</Text>
              <Text variant="h3">Fidélité</Text>
            </Box>
            <Text variant="body" style={{ marginBottom: 4 }}>{points} points</Text>
            <TouchableOpacity onPress={onNavigateToLoyalty}>
              <Text variant="bodySmall" color={colors.olive} weight="semibold">Voir les récompenses</Text>
            </TouchableOpacity>
          </Box>

          {/* Support */}
          <Box
            p="md"
            backgroundColor={surface}
            borderRadius={borderRadius.card}
            style={{ marginBottom: spacing.sm, borderWidth: 1, borderColor: border }}
          >
            <Box flexDirection="row" alignItems="center" style={{ marginBottom: spacing.sm }}>
              <Text style={{ fontSize: 22, marginRight: spacing.sm }}>💬</Text>
              <Text variant="h3">Support</Text>
            </Box>
            <Text variant="bodySmall" color="secondary" style={{ marginBottom: 4 }}>Besoin d'aide ?</Text>
            <TouchableOpacity onPress={() => Linking.openURL('mailto:support@albaz.dz')} style={{ marginBottom: 4 }}>
              <Text variant="bodySmall" color={colors.olive}>support@albaz.dz</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('tel:+213555000000')}>
              <Text variant="bodySmall" color={colors.olive}>+213 555 00 00 00</Text>
            </TouchableOpacity>
          </Box>
        </Box>

        <Box px="md" pt="xl">
          <Button
            variant="destructive"
            onPress={handleLogout}
            style={{ borderRadius: 12 }}
          >
            Déconnexion
          </Button>
        </Box>
      </ScrollView>
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </Box>
  );
};
