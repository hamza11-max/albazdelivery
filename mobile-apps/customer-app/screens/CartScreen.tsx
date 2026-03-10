import React from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';
import { Box, Text, Button, Stack } from '../components/ui';
import { useCartStore } from '../stores/cart-store';
import { BottomNav, TabType } from '../components/BottomNav';
import copy from '../copy';

interface CartScreenProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onCheckout: (storeId: string, storeName: string) => void;
  onContinueShopping: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({
  activeTab,
  onTabChange,
  onCheckout,
  onContinueShopping,
}) => {
  const { items, updateQuantity, removeItem, getTotal, storeId: cartStoreId, storeName: cartStoreName } = useCartStore();
  const storeId = cartStoreId ?? '';
  const storeName = cartStoreName ?? 'Magasin';

  const subtotal = getTotal();
  const deliveryFee = 500;
  const total = subtotal + deliveryFee;

  if (items.length === 0) {
    return (
      <Box flex={1} backgroundColor={colors.background}>
        <Box
          px="md"
          py="md"
          backgroundColor={colors.surface}
          style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
        >
          <Text variant="h2">{copy.titles.shop}</Text>
        </Box>
        <Box flex={1} justifyContent="center" alignItems="center">
          <Text style={{ fontSize: 64, marginBottom: spacing.md }}>🛒</Text>
          <Text variant="body" color="secondary">{copy.empty.cartEmpty}</Text>
          <Button
            variant="primary"
            size="lg"
            onPress={onContinueShopping}
            style={{ marginTop: spacing.lg, borderRadius: borderRadius.card }}
          >
            {copy.actions.continueShopping}
          </Button>
        </Box>
        <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
      </Box>
    );
  }

  return (
    <Box flex={1} backgroundColor={colors.background}>
      <Box
        px="md"
        py="md"
        backgroundColor={colors.surface}
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <Text variant="h2">{copy.titles.shop}</Text>
      </Box>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
        {items.map((item) => (
          <Box
            key={item.productId}
            flexDirection="row"
            alignItems="center"
            py="md"
            style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
          >
            <Box flex={1}>
              <Text variant="body" weight="semibold">{item.name ?? item.productId}</Text>
              <Text variant="bodySmall" color="secondary" style={{ marginTop: 2 }}>
                {item.price} DZD x {item.quantity}
              </Text>
            </Box>
            <Stack direction="horizontal" gap="sm" align="center" style={{ marginRight: spacing.md }}>
              <TouchableOpacity
                onPress={() => updateQuantity(item.productId, -1)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.surfaceElevated,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text>-</Text>
              </TouchableOpacity>
              <Text style={{ minWidth: 24, textAlign: 'center' }}>{item.quantity}</Text>
              <TouchableOpacity
                onPress={() => updateQuantity(item.productId, 1)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.surfaceElevated,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text>+</Text>
              </TouchableOpacity>
            </Stack>
            <TouchableOpacity onPress={() => removeItem(item.productId)}>
              <Text style={{ fontSize: 20 }}>🗑️</Text>
            </TouchableOpacity>
          </Box>
        ))}
        <Box
          mt="lg"
          pt="lg"
          style={{ borderTopWidth: 1, borderTopColor: colors.border }}
        >
          <Text variant="body" style={{ marginBottom: 4 }}>Sous-total: {subtotal} DZD</Text>
          <Text variant="body" style={{ marginBottom: 4 }}>Livraison: {deliveryFee} DZD</Text>
          <Text variant="h3" color={colors.olive} style={{ marginTop: spacing.sm }}>
            Total: {total} DZD
          </Text>
        </Box>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => onCheckout(storeId, storeName)}
          style={{ marginTop: spacing.xl, padding: spacing.lg, borderRadius: borderRadius.card }}
        >
          {copy.actions.placeOrder} - {total} DZD
        </Button>
      </ScrollView>
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </Box>
  );
};
