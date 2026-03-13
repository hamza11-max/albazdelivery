import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, borderRadius } from '../theme';
import { Box, Text, Button } from '../components/ui';
import { Input } from '../components/ui';
import { addressesAPI } from '../services/api-client';
import { useThemeMode } from '../theme/ThemeProvider';
import copy from '../copy';

interface AddressesScreenProps {
  onBack: () => void;
  onSelectAddress?: (address: string, city: string) => void;
}

type Address = { id: string; label: string; address: string; city: string; isDefault?: boolean };

export const AddressesScreen: React.FC<AddressesScreenProps> = ({ onBack, onSelectAddress }) => {
  const queryClient = useQueryClient();
  const { isDark } = useThemeMode();
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  const palette = {
    background: isDark ? '#05090b' : colors.background,
    surface: isDark ? '#111317' : colors.surface,
    border: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesAPI.list(),
  });
  const addresses = (data as { data?: Address[] })?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () => addressesAPI.create({ label: label || 'Adresse', address, city }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setAdding(false);
      setLabel('');
      setAddress('');
      setCity('');
    },
    onError: (e: Error) => Alert.alert('Erreur', e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => addressesAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
    onError: (e: Error) => Alert.alert('Erreur', e.message),
  });

  const handleDelete = (item: Address) => {
    Alert.alert('Supprimer', `Supprimer "${item.label}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) },
    ]);
  };

  return (
    <Box flex={1} backgroundColor={palette.background}>
      <Box flexDirection="row" alignItems="center" px="md" py="md" backgroundColor={palette.surface} style={{ borderBottomWidth: 1, borderBottomColor: palette.border }}>
        <TouchableOpacity onPress={onBack} style={{ padding: spacing.sm }}>
          <Text size="md" weight="semibold" color={colors.olive}>← {copy.actions.back}</Text>
        </TouchableOpacity>
        <Text variant="h3" style={{ flex: 1 }}>Adresses</Text>
      </Box>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
        {!adding ? (
          <>
            {isLoading ? <ActivityIndicator size="small" color={colors.olive} style={{ marginTop: spacing.lg }} /> : addresses.length === 0 ? (
              <Box py="xl" alignItems="center">
                <Text style={{ fontSize: 40, marginBottom: spacing.sm }}>📍</Text>
                <Text variant="body" color="secondary">Aucune adresse enregistrée</Text>
              </Box>
            ) : (
              addresses.map((item) => (
                <Box key={item.id} p="md" backgroundColor={palette.surface} borderRadius={borderRadius.card} style={{ marginBottom: spacing.sm, borderWidth: 1, borderColor: palette.border }}>
                  <Text variant="label">{item.label}</Text>
                  <Text variant="bodySmall" color="secondary">{item.address}</Text>
                  <Text variant="caption" color="tertiary">{item.city}</Text>
                  <Box flexDirection="row" justifyContent="flex-end" style={{ marginTop: spacing.sm }}>
                    {onSelectAddress && (
                      <TouchableOpacity onPress={() => onSelectAddress(item.address, item.city)} style={{ marginRight: spacing.sm }}>
                        <Text variant="bodySmall" color={colors.olive}>Utiliser</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => handleDelete(item)}>
                      <Text variant="bodySmall" style={{ color: colors.error }}>Supprimer</Text>
                    </TouchableOpacity>
                  </Box>
                </Box>
              ))
            )}
            <Button variant="outline" onPress={() => setAdding(true)} style={{ marginTop: spacing.md }}>+ Ajouter une adresse</Button>
          </>
        ) : (
          <>
            <Text variant="label" style={{ marginBottom: spacing.sm }}>Nom (ex: Maison)</Text>
            <Input placeholder="Label" value={label} onChangeText={setLabel} containerStyle={{ marginBottom: spacing.sm }} />
            <Text variant="label" style={{ marginBottom: spacing.sm }}>Adresse</Text>
            <Input placeholder="Rue, numéro, quartier..." value={address} onChangeText={setAddress} containerStyle={{ marginBottom: spacing.sm }} />
            <Text variant="label" style={{ marginBottom: spacing.sm }}>Ville</Text>
            <Input placeholder="Ville" value={city} onChangeText={setCity} containerStyle={{ marginBottom: spacing.sm }} />
            <Box flexDirection="row" style={{ gap: spacing.sm }}>
              <Button variant="ghost" onPress={() => setAdding(false)} style={{ flex: 1 }}>Annuler</Button>
              <Button variant="primary" onPress={() => { if (address.trim() && city.trim()) createMutation.mutate(); else Alert.alert('Erreur', 'Adresse et ville requises'); }} loading={createMutation.isPending} style={{ flex: 1 }}>Enregistrer</Button>
            </Box>
          </>
        )}
      </ScrollView>
    </Box>
  );
};
