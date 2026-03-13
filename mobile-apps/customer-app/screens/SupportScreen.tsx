import React from 'react';
import { ScrollView, TouchableOpacity, Linking } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { Box, Text } from '../components/ui';
import { useThemeMode } from '../theme/ThemeProvider';
import copy from '../copy';

interface SupportScreenProps {
  onBack: () => void;
}

export const SupportScreen: React.FC<SupportScreenProps> = ({ onBack }) => {
  const { isDark } = useThemeMode();
  const palette = {
    background: isDark ? '#05090b' : colors.background,
    surface: isDark ? '#111317' : colors.surface,
    border: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
  };

  return (
    <Box flex={1} backgroundColor={palette.background}>
      <Box flexDirection="row" alignItems="center" px="md" py="md" backgroundColor={palette.surface} style={{ borderBottomWidth: 1, borderBottomColor: palette.border }}>
        <TouchableOpacity onPress={onBack} style={{ padding: spacing.sm }}>
          <Text size="md" weight="semibold" color={colors.olive}>← {copy.actions.back}</Text>
        </TouchableOpacity>
        <Text variant="h3" style={{ flex: 1 }}>Support</Text>
      </Box>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
        <Box p="lg" alignItems="center" style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>💬</Text>
          <Text variant="h3" style={{ marginBottom: spacing.sm }}>Besoin d'aide ?</Text>
          <Text variant="body" color="secondary" style={{ textAlign: 'center' }}>Contactez notre équipe par email ou téléphone.</Text>
        </Box>
        <Box p="md" backgroundColor={palette.surface} borderRadius={borderRadius.card} style={{ borderWidth: 1, borderColor: palette.border }}>
          <Text variant="label" style={{ marginBottom: 4 }}>Email</Text>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:support@albaz.dz')}>
            <Text variant="body" color={colors.olive}>support@albaz.dz</Text>
          </TouchableOpacity>
        </Box>
        <Box p="md" backgroundColor={palette.surface} borderRadius={borderRadius.card} style={{ marginTop: spacing.sm, borderWidth: 1, borderColor: palette.border }}>
          <Text variant="label" style={{ marginBottom: 4 }}>Téléphone</Text>
          <TouchableOpacity onPress={() => Linking.openURL('tel:+213555000000')}>
            <Text variant="body" color={colors.olive}>+213 555 00 00 00</Text>
          </TouchableOpacity>
        </Box>
      </ScrollView>
    </Box>
  );
};
