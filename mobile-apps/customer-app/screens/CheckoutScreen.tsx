import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, borderRadius } from '../theme';
import { Box, Text, Input, Button, Stack } from '../components/ui';
import { useCartStore } from '../stores/cart-store';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, deliveryAPI, promoAPI, addressesAPI } from '../services/api-client';
import { WALLET_SUSPENDED } from '../config/features';
import copy from '../copy';

const CITIES = ['Alger', 'Ouargla', 'Ghardaïa', 'Tamanrasset'];

interface CheckoutScreenProps {
  storeId: string;
  storeName?: string;
  onBack: () => void;
  onOrderPlaced: (orderId: string) => void;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 9 && /^[567]/.test(digits)) return '0' + digits;
  if (digits.length === 10 && digits.startsWith('0') && /^0[567]/.test(digits)) return digits;
  if (digits.length >= 11 && digits.startsWith('213')) return '0' + digits.slice(3);
  return phone;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  storeId,
  storeName,
  onBack,
  onOrderPlaced,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const clearCart = useCartStore((s) => s.clearCart);

  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState(CITIES[0] ?? 'Alger');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'WALLET'>('CASH');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState<string | null>(null);

  const { data: addressesData } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesAPI.list(),
  });
  const savedAddresses = (addressesData as { data?: Array<{ id: string; label?: string; address: string; city: string }> })?.data ?? [];

  const subtotal = getTotal();
  const { data: feeData } = useQuery({
    queryKey: ['deliveryFee', city],
    queryFn: async () => {
      const res = await deliveryAPI.getFee(city);
      return res.data as { fee?: number };
    },
  });
  const deliveryFee = feeData?.fee ?? 500;
  const total = Math.max(0, subtotal + deliveryFee - promoDiscount);

  const createOrder = useMutation({
    mutationFn: () =>
      ordersAPI.create({
        storeId,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
        subtotal,
        deliveryFee,
        total,
        paymentMethod,
        deliveryAddress: address || 'Adresse à préciser',
        city,
        customerPhone: normalizePhone(phone) || '0555000000',
        ...(promoDiscount > 0 && promoCode ? { promoCode, discount: promoDiscount } : {}),
      }),
    onSuccess: (res) => {
      const orderId = (res.data as { order?: { id: string } })?.order?.id;
      if (orderId) {
        clearCart();
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        onOrderPlaced(orderId);
      }
    },
    onError: (err: Error) => {
      Alert.alert('Erreur', err.message || 'Impossible de passer la commande');
    },
  });

  const handlePlaceOrder = () => {
    const normPhone = normalizePhone(phone);
    if (!/^0[567]\d{8}$/.test(normPhone)) {
      Alert.alert('Erreur', 'Numéro de téléphone invalide (ex: 0555000000)');
      return;
    }
    if (!address || address.length < 10) {
      Alert.alert('Erreur', 'Adresse requise (min. 10 caractères)');
      return;
    }
    createOrder.mutate();
  };

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
        <Text variant="h3" style={{ flex: 1, textAlign: 'center' }}>{copy.actions.checkout}</Text>
      </Box>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
        <Text variant="h3" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>Articles</Text>
        {items.map((item) => (
          <Box
            key={item.productId}
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            py="sm"
            style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
          >
            <Text variant="bodySmall" style={{ flex: 1 }}>{item.name || item.productId}</Text>
            <Text variant="bodySmall" color="secondary" style={{ marginHorizontal: spacing.sm }}>x{item.quantity}</Text>
            <Text variant="label">{item.price * item.quantity} DZD</Text>
          </Box>
        ))}

        <Text variant="h3" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>Adresse de livraison</Text>
        {savedAddresses.length > 0 && (
          <Box style={{ marginBottom: spacing.sm }}>
            <Text variant="bodySmall" color="secondary" style={{ marginBottom: spacing.xs }}>Choisir une adresse enregistrée</Text>
            {savedAddresses.map((a) => (
              <TouchableOpacity
                key={a.id}
                onPress={() => { setAddress(a.address); setCity(a.city); }}
                style={{
                  padding: spacing.sm,
                  marginBottom: spacing.xs,
                  borderRadius: borderRadius.md,
                  borderWidth: 1,
                  borderColor: address === a.address ? colors.olive : colors.border,
                  backgroundColor: address === a.address ? colors.olive + '15' : 'transparent',
                }}
              >
                <Text variant="bodySmall" weight="medium">{a.label || 'Adresse'}</Text>
                <Text variant="caption" color="secondary">{a.address}, {a.city}</Text>
              </TouchableOpacity>
            ))}
          </Box>
        )}
        <Input
          placeholder="Rue, numéro, quartier..."
          value={address}
          onChangeText={setAddress}
          containerStyle={{ marginBottom: spacing.sm }}
        />
        <Input
          placeholder="0555000000"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          containerStyle={{ marginBottom: spacing.sm }}
        />

        <Text variant="h3" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>Code promo</Text>
        <Box flexDirection="row" style={{ gap: spacing.sm, marginBottom: spacing.md }}>
          <Input placeholder="Code promo" value={promoCode} onChangeText={(t) => { setPromoCode(t); setPromoError(null); }} containerStyle={{ flex: 1 }} />
          <TouchableOpacity
            onPress={async () => {
              if (!promoCode.trim()) return;
              try {
                const res = await promoAPI.validate(promoCode.trim(), subtotal);
                const d = res.data as { discount?: number };
                setPromoDiscount(d?.discount ?? 0);
                setPromoError(null);
              } catch {
                setPromoDiscount(0);
                setPromoError('Code invalide ou expiré');
              }
            }}
            style={{ paddingHorizontal: spacing.md, justifyContent: 'center', backgroundColor: colors.olive, borderRadius: borderRadius.md }}
          >
            <Text variant="body" color="#fff" weight="semibold">Appliquer</Text>
          </TouchableOpacity>
        </Box>
        {promoError && <Text variant="caption" style={{ color: colors.error, marginBottom: spacing.sm }}>{promoError}</Text>}
        {promoDiscount > 0 && <Text variant="bodySmall" style={{ color: colors.olive, marginBottom: spacing.sm }}>−{promoDiscount} DZD appliqué</Text>}

        <Text variant="h3" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>Ville</Text>
        <Box flexDirection="row" flexWrap="wrap" style={{ gap: spacing.sm, marginBottom: spacing.md }}>
          {CITIES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCity(c)}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: city === c ? colors.olive : colors.border,
                backgroundColor: city === c ? colors.olive : 'transparent',
              }}
            >
              <Text variant="bodySmall" color={city === c ? 'inverse' : 'primary'} weight={city === c ? 'semibold' : 'regular'}>{c}</Text>
            </TouchableOpacity>
          ))}
        </Box>

        <Text variant="h3" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>Paiement</Text>
        <TouchableOpacity
          onPress={() => setPaymentMethod('CASH')}
          style={{
            padding: spacing.md,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: paymentMethod === 'CASH' ? colors.olive : colors.border,
            backgroundColor: paymentMethod === 'CASH' ? colors.olive + '15' : 'transparent',
            marginBottom: spacing.sm,
          }}
        >
          <Text variant="body">💵 Espèces à la livraison</Text>
        </TouchableOpacity>
        {!WALLET_SUSPENDED && (
          <TouchableOpacity
            onPress={() => setPaymentMethod('WALLET')}
            style={{
              padding: spacing.md,
              borderRadius: borderRadius.md,
              borderWidth: 1,
              borderColor: paymentMethod === 'WALLET' ? colors.olive : colors.border,
              backgroundColor: paymentMethod === 'WALLET' ? colors.olive + '15' : 'transparent',
              marginBottom: spacing.sm,
            }}
          >
            <Text variant="body">👛 Portefeuille</Text>
          </TouchableOpacity>
        )}

        <Box mt="lg" pt="lg" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
          <Text variant="body" style={{ marginBottom: 4 }}>Sous-total: <Text weight="semibold">{subtotal} DZD</Text></Text>
          <Text variant="body" style={{ marginBottom: 4 }}>Livraison: <Text weight="semibold">{deliveryFee} DZD</Text></Text>
          {promoDiscount > 0 && <Text variant="body" style={{ marginBottom: 4 }}>Réduction: <Text weight="semibold">−{promoDiscount} DZD</Text></Text>}
          <Text variant="h3" style={{ marginTop: spacing.sm }}>Total: <Text weight="bold" color={colors.olive}>{total} DZD</Text></Text>
        </Box>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={createOrder.isPending}
          disabled={createOrder.isPending}
          onPress={handlePlaceOrder}
          style={{ marginTop: spacing.xl, padding: spacing.lg, borderRadius: borderRadius.card }}
        >
          {copy.actions.order} - {total} DZD
        </Button>
      </ScrollView>
    </Box>
  );
};
