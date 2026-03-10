import React from 'react';
import { FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { Box, Text, Card } from '../components/ui';
import { productsAPI } from '../services/api-client';
import { useCartStore } from '../stores/cart-store';
import copy from '../copy';

interface StoreScreenProps {
  storeId: string;
  storeName?: string;
  onBack: () => void;
  onOpenCart: () => void;
}

export const StoreScreen: React.FC<StoreScreenProps> = ({
  storeId,
  storeName = 'Magasin',
  onBack,
  onOpenCart,
}) => {
  const addItem = useCartStore((s) => s.addItem);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', storeId],
    queryFn: async () => {
      const res = await productsAPI.list({ storeId });
      return (res.data as { products: Array<{ id: string; name: string; description: string; price: number; image?: string }> }).products;
    },
    enabled: !!storeId,
  });

  const products = productsData ?? [];

  const handleAddToCart = (product: { id: string; name: string; price: number; image?: string }) => {
    addItem(
      {
        productId: product.id,
        quantity: 1,
        price: product.price,
        name: product.name,
        image: product.image,
      },
      storeId,
      storeName
    );
    onOpenCart();
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
        <TouchableOpacity onPress={onBack} style={{ padding: spacing.sm, marginRight: spacing.sm }}>
          <Text size="md" weight="semibold" color={colors.olive}>← {copy.actions.back}</Text>
        </TouchableOpacity>
        <Text variant="h3" numberOfLines={1} style={{ flex: 1 }}>{storeName}</Text>
      </Box>
      {isLoading ? (
        <Box mt="xl" alignItems="center">
          <ActivityIndicator size="large" color={colors.olive} />
        </Box>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl, flexGrow: 1 }}
          columnWrapperStyle={{ marginBottom: spacing.md, gap: spacing.md }}
          ListEmptyComponent={
            <Box py="xxl" alignItems="center" style={{ width: '100%' }}>
              <Text variant="body" color="secondary">{copy.empty.noProducts}</Text>
            </Box>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleAddToCart(item)}
              activeOpacity={0.7}
              style={{ flex: 1 }}
            >
              <Card>
                <Box style={{ width: '100%', aspectRatio: 1, borderRadius: borderRadius.md, backgroundColor: colors.surfaceElevated, marginBottom: spacing.sm, overflow: 'hidden' }}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%', borderRadius: borderRadius.md }} resizeMode="cover" />
                  ) : (
                    <Box flex={1} justifyContent="center" alignItems="center">
                      <Text style={{ fontSize: 40 }}>🍽️</Text>
                    </Box>
                  )}
                </Box>
                <Text variant="label" numberOfLines={2} style={{ marginBottom: 4 }}>{item.name}</Text>
                <Text variant="bodySmall" style={{ color: colors.olive, fontWeight: '700', marginBottom: spacing.sm }}>{item.price} DZD</Text>
                <Box
                  backgroundColor={colors.olive}
                  py="sm"
                  borderRadius={borderRadius.sm}
                  alignItems="center"
                >
                  <Text variant="button" style={{ color: colors.text.inverse, fontSize: 14 }}>{copy.actions.addToCart}</Text>
                </Box>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </Box>
  );
};
