import React, { useState } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { colors, spacing, borderRadius } from '../theme';
import { Box, Text, Button } from '../components/ui';
import { packageDeliveryAPI } from '../services/api-client';
import { useThemeMode } from '../theme/ThemeProvider';
import copy from '../copy';

const SERVICE_FEE = 500;

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 9 && /^[567]/.test(digits)) return '0' + digits;
  if (digits.length === 10 && digits.startsWith('0') && /^0[567]/.test(digits)) return digits;
  if (digits.length >= 11 && digits.startsWith('213')) return '0' + digits.slice(3);
  return phone;
}

interface PackageDeliveryScreenProps {
  onBack: () => void;
  onSuccess?: (orderId: string) => void;
}

export const PackageDeliveryScreen: React.FC<PackageDeliveryScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const { isDark } = useThemeMode();
  const [packageDescription, setPackageDescription] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [whoPays, setWhoPays] = useState<'customer' | 'receiver'>('customer');

  const palette = {
    background: isDark ? '#05090b' : colors.background,
    headerBg: isDark ? '#111317' : colors.surface,
    headerBorder: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
    inputBg: isDark ? '#1a1d21' : colors.surface,
    border: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
    text: isDark ? '#f5f1e8' : colors.text.primary,
    textSecondary: isDark ? 'rgba(245,241,232,0.7)' : colors.text.secondary,
  };

  const createDelivery = useMutation({
    mutationFn: () => {
      const deliveryAddress = `${fromLocation} → ${toLocation}`;
      const city = toLocation.split(',')[0]?.trim() || 'Alger';
      const normRecipient = normalizePhone(recipientPhone);
      const normSender = normalizePhone(senderPhone);
      return packageDeliveryAPI.create({
        packageDescription: packageDescription.trim(),
        recipientName: recipientName.trim() || 'Destinataire',
        recipientPhone: normRecipient || '0555000000',
        deliveryAddress,
        city,
        customerPhone: normSender || '0555000000',
        deliveryFee: SERVICE_FEE,
        paymentMethod,
        whoPays,
      });
    },
    onSuccess: (res) => {
      const data = res as { data?: { order?: { id: string } } };
      const orderId = data?.data?.order?.id;
      if (orderId && onSuccess) onSuccess(orderId);
      else onBack();
      Alert.alert('Succès', 'Livraison créée avec succès!');
    },
    onError: (err: Error) => {
      Alert.alert('Erreur', err.message || 'Impossible de créer la livraison');
    },
  });

  const handleSubmit = () => {
    if (!packageDescription.trim() || packageDescription.trim().length < 5) {
      Alert.alert('Erreur', 'Décrivez votre colis (au moins 5 caractères)');
      return;
    }
    if (!fromLocation.trim()) {
      Alert.alert('Erreur', "Indiquez le lieu de prise en charge (d'où?)");
      return;
    }
    if (!toLocation.trim()) {
      Alert.alert('Erreur', "Indiquez l'adresse de livraison (où?)");
      return;
    }
    const normRecipient = normalizePhone(recipientPhone);
    const normSender = normalizePhone(senderPhone);
    if (!/^0[567]\d{8}$/.test(normRecipient)) {
      Alert.alert('Erreur', 'Numéro du destinataire invalide (ex: 0555000000)');
      return;
    }
    if (!/^0[567]\d{8}$/.test(normSender)) {
      Alert.alert('Erreur', 'Votre numéro invalide (ex: 0555000000)');
      return;
    }
    createDelivery.mutate();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Box
        flexDirection="row"
        alignItems="center"
        px="md"
        py="md"
        backgroundColor={palette.headerBg}
        style={{ borderBottomWidth: 1, borderBottomColor: palette.headerBorder }}
      >
        <TouchableOpacity onPress={onBack} style={{ padding: spacing.sm, marginRight: spacing.sm }}>
          <Text size="md" weight="semibold" color={colors.olive}>← {copy.actions.back}</Text>
        </TouchableOpacity>
        <Text variant="h3" style={{ flex: 1 }}>Livraison colis</Text>
      </Box>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <Box mb="lg" p="md" backgroundColor={palette.inputBg} borderRadius={borderRadius.md} style={{ borderWidth: 1, borderColor: palette.border }}>
          <Text variant="bodySmall" color="secondary">
            Décrivez votre colis. Tarif service: {SERVICE_FEE} DZD.
          </Text>
        </Box>

        <Text variant="label" style={{ marginBottom: spacing.sm }}>Description du colis *</Text>
        <TextInput
          placeholder="Ex: documents, vêtements..."
          placeholderTextColor={palette.textSecondary}
          value={packageDescription}
          onChangeText={setPackageDescription}
          multiline
          numberOfLines={3}
          style={{
            backgroundColor: palette.inputBg,
            borderRadius: borderRadius.input,
            borderWidth: 1,
            borderColor: palette.border,
            padding: spacing.md,
            fontSize: 16,
            color: palette.text,
            minHeight: 80,
            textAlignVertical: 'top',
          }}
        />

        <Text variant="label" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>Lieu de prise en charge *</Text>
        <TextInput
          placeholder="D'où?"
          placeholderTextColor={palette.textSecondary}
          value={fromLocation}
          onChangeText={setFromLocation}
          style={{
            backgroundColor: palette.inputBg,
            borderRadius: borderRadius.input,
            borderWidth: 1,
            borderColor: palette.border,
            padding: spacing.md,
            fontSize: 16,
            color: palette.text,
          }}
        />

        <Text variant="label" style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>Adresse de livraison *</Text>
        <TextInput
          placeholder="Où?"
          placeholderTextColor={palette.textSecondary}
          value={toLocation}
          onChangeText={setToLocation}
          style={{
            backgroundColor: palette.inputBg,
            borderRadius: borderRadius.input,
            borderWidth: 1,
            borderColor: palette.border,
            padding: spacing.md,
            fontSize: 16,
            color: palette.text,
          }}
        />

        <Text variant="label" style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>Destinataire (nom)</Text>
        <TextInput
          placeholder="Nom du destinataire"
          placeholderTextColor={palette.textSecondary}
          value={recipientName}
          onChangeText={setRecipientName}
          style={{
            backgroundColor: palette.inputBg,
            borderRadius: borderRadius.input,
            borderWidth: 1,
            borderColor: palette.border,
            padding: spacing.md,
            fontSize: 16,
            color: palette.text,
          }}
        />

        <Text variant="label" style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>Téléphone destinataire *</Text>
        <TextInput
          placeholder="0555000000"
          placeholderTextColor={palette.textSecondary}
          value={recipientPhone}
          onChangeText={setRecipientPhone}
          keyboardType="phone-pad"
          style={{
            backgroundColor: palette.inputBg,
            borderRadius: borderRadius.input,
            borderWidth: 1,
            borderColor: palette.border,
            padding: spacing.md,
            fontSize: 16,
            color: palette.text,
          }}
        />

        <Text variant="label" style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>Votre téléphone *</Text>
        <TextInput
          placeholder="0555000000"
          placeholderTextColor={palette.textSecondary}
          value={senderPhone}
          onChangeText={setSenderPhone}
          keyboardType="phone-pad"
          style={{
            backgroundColor: palette.inputBg,
            borderRadius: borderRadius.input,
            borderWidth: 1,
            borderColor: palette.border,
            padding: spacing.md,
            fontSize: 16,
            color: palette.text,
          }}
        />

        <Text variant="label" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>Paiement</Text>
        <Box flexDirection="row" style={{ gap: spacing.sm }}>
          <TouchableOpacity
            onPress={() => setPaymentMethod('CASH')}
            style={{
              flex: 1,
              padding: spacing.md,
              borderRadius: borderRadius.md,
              borderWidth: 1,
              borderColor: paymentMethod === 'CASH' ? colors.olive : palette.border,
              backgroundColor: paymentMethod === 'CASH' ? colors.olive + '15' : 'transparent',
            }}
          >
            <Text variant="bodySmall" style={{ color: paymentMethod === 'CASH' ? colors.olive : palette.text }}>Espèces</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPaymentMethod('CARD')}
            style={{
              flex: 1,
              padding: spacing.md,
              borderRadius: borderRadius.md,
              borderWidth: 1,
              borderColor: paymentMethod === 'CARD' ? colors.olive : palette.border,
              backgroundColor: paymentMethod === 'CARD' ? colors.olive + '15' : 'transparent',
            }}
          >
            <Text variant="bodySmall" style={{ color: paymentMethod === 'CARD' ? colors.olive : palette.text }}>Carte</Text>
          </TouchableOpacity>
        </Box>

        <Text variant="label" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>Qui paie?</Text>
        <Box flexDirection="row" style={{ gap: spacing.sm }}>
          <TouchableOpacity
            onPress={() => setWhoPays('customer')}
            style={{
              flex: 1,
              padding: spacing.md,
              borderRadius: borderRadius.md,
              borderWidth: 1,
              borderColor: whoPays === 'customer' ? colors.olive : palette.border,
              backgroundColor: whoPays === 'customer' ? colors.olive + '15' : 'transparent',
            }}
          >
            <Text variant="bodySmall" style={{ color: whoPays === 'customer' ? colors.olive : palette.text }}>Expéditeur</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setWhoPays('receiver')}
            style={{
              flex: 1,
              padding: spacing.md,
              borderRadius: borderRadius.md,
              borderWidth: 1,
              borderColor: whoPays === 'receiver' ? colors.olive : palette.border,
              backgroundColor: whoPays === 'receiver' ? colors.olive + '15' : 'transparent',
            }}
          >
            <Text variant="bodySmall" style={{ color: whoPays === 'receiver' ? colors.olive : palette.text }}>Destinataire</Text>
          </TouchableOpacity>
        </Box>

        <Box mt="lg" p="md" style={{ borderTopWidth: 1, borderTopColor: palette.border }}>
          <Text variant="h3" style={{ color: colors.olive }}>Total: {SERVICE_FEE} DZD</Text>
        </Box>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={createDelivery.isPending}
          disabled={createDelivery.isPending}
          onPress={handleSubmit}
          style={{ marginTop: spacing.xl }}
        >
          Confirmer la commande
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
