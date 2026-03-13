import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, borderRadius } from '../theme';
import { Box, Text, Button } from '../components/ui';
import { Input } from '../components/ui';
import { reviewsAPI } from '../services/api-client';
import { useThemeMode } from '../theme/ThemeProvider';
import copy from '../copy';

interface ReviewScreenProps {
  orderId: string;
  onBack: () => void;
  onSuccess?: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({ orderId, onBack, onSuccess }) => {
  const queryClient = useQueryClient();
  const { isDark } = useThemeMode();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const palette = {
    background: isDark ? '#05090b' : colors.background,
    surface: isDark ? '#111317' : colors.surface,
    border: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
  };

  const createMutation = useMutation({
    mutationFn: () => reviewsAPI.create({ orderId, rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      Alert.alert('Merci', 'Votre avis a été enregistré.');
      onSuccess?.();
      onBack();
    },
    onError: (e: Error) => Alert.alert('Erreur', e.message),
  });

  return (
    <Box flex={1} backgroundColor={palette.background}>
      <Box flexDirection="row" alignItems="center" px="md" py="md" backgroundColor={palette.surface} style={{ borderBottomWidth: 1, borderBottomColor: palette.border }}>
        <TouchableOpacity onPress={onBack} style={{ padding: spacing.sm }}>
          <Text size="md" weight="semibold" color={colors.olive}>← {copy.actions.back}</Text>
        </TouchableOpacity>
        <Text variant="h3" style={{ flex: 1 }}>Laisser un avis</Text>
      </Box>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
        <Text variant="label" style={{ marginBottom: spacing.sm }}>Note (1-5)</Text>
        <Box flexDirection="row" style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} onPress={() => setRating(n)} style={{ padding: spacing.sm, borderRadius: borderRadius.md, backgroundColor: rating === n ? colors.olive : palette.surface, borderWidth: 1, borderColor: palette.border }}>
              <Text variant="h3" color={rating === n ? 'inverse' : 'primary'}>{n}</Text>
            </TouchableOpacity>
          ))}
        </Box>
        <Text variant="label" style={{ marginBottom: spacing.sm }}>Commentaire</Text>
        <Input placeholder="Votre avis..." value={comment} onChangeText={setComment} containerStyle={{ marginBottom: spacing.lg }} multiline />
        <Button variant="primary" onPress={() => createMutation.mutate()} loading={createMutation.isPending}>Envoyer</Button>
      </ScrollView>
    </Box>
  );
};
