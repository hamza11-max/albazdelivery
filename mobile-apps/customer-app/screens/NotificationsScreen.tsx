import React from 'react';
import { FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, borderRadius } from '../theme';
import { Box, Text, Button } from '../components/ui';
import { notificationsAPI } from '../services/api-client';
import { useThemeMode } from '../theme/ThemeProvider';
import copy from '../copy';

interface NotificationsScreenProps {
  onBack: () => void;
}

type Notif = { id: string; title: string; message: string; read?: boolean; createdAt: string };

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack }) => {
  const queryClient = useQueryClient();
  const { isDark } = useThemeMode();
  const palette = {
    background: isDark ? '#05090b' : colors.background,
    surface: isDark ? '#111317' : colors.surface,
    border: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsAPI.list({ limit: 50 }),
  });
  const notifications = (data as { data?: { notifications?: Notif[] } })?.data?.notifications ?? (Array.isArray((data as { data?: unknown })?.data) ? (data as { data: Notif[] }).data : []);

  const markRead = useMutation({
    mutationFn: (ids: string[]) => notificationsAPI.markAsRead(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAllRead = useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <Box flex={1} backgroundColor={palette.background}>
      <Box flexDirection="row" alignItems="center" px="md" py="md" backgroundColor={palette.surface} style={{ borderBottomWidth: 1, borderBottomColor: palette.border }}>
        <TouchableOpacity onPress={onBack} style={{ padding: spacing.sm }}>
          <Text size="md" weight="semibold" color={colors.olive}>← {copy.actions.back}</Text>
        </TouchableOpacity>
        <Text variant="h3" style={{ flex: 1 }}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={() => markAllRead.mutate()}>
            <Text variant="bodySmall" color={colors.olive}>Tout lire</Text>
          </TouchableOpacity>
        )}
      </Box>
      {isLoading ? (
        <Box flex={1} justifyContent="center" alignItems="center"><ActivityIndicator size="large" color={colors.olive} /></Box>
      ) : notifications.length === 0 ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>🔔</Text>
          <Text variant="body" color="secondary">Aucune notification</Text>
        </Box>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => !item.read && markRead.mutate([item.id])}
              style={{ marginBottom: spacing.sm, padding: spacing.md, backgroundColor: palette.surface, borderRadius: borderRadius.card, borderWidth: 1, borderColor: palette.border, opacity: item.read ? 0.8 : 1 }}
            >
              <Text variant="label">{item.title}</Text>
              <Text variant="bodySmall" color="secondary" style={{ marginTop: 4 }}>{item.message}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </Box>
  );
};
