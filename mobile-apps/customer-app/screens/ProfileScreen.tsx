import React from 'react';
import { TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { Box, Text, Button } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { BottomNav, TabType } from '../components/BottomNav';
import copy from '../copy';

interface ProfileScreenProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  activeTab,
  onTabChange,
  onLogout,
}) => {
  const { user } = useAuth();

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: onLogout },
    ]);
  };

  return (
    <Box flex={1} backgroundColor={colors.background}>
      <Box
        px="md"
        py="md"
        backgroundColor={colors.surface}
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <Text variant="h2">{copy.titles.profile}</Text>
      </Box>
      <Box flex={1} alignItems="center" pt="xl">
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
        <Button
          variant="destructive"
          onPress={handleLogout}
          style={{ marginTop: spacing.xl, borderRadius: 12 }}
        >
          Déconnexion
        </Button>
      </Box>
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </Box>
  );
};
