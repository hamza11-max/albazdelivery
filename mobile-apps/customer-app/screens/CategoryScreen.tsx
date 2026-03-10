import React from 'react';
import { FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { Box, Text, Card, Stack } from '../components/ui';
import { storesAPI } from '../services/api-client';
import copy from '../copy';

interface CategoryScreenProps {
  categoryId: number;
  city: string;
  onSelectStore: (storeId: string) => void;
  onBack: () => void;
}

export const CategoryScreen: React.FC<CategoryScreenProps> = ({
  categoryId,
  city,
  onSelectStore,
  onBack,
}) => {
  const { data: storesData, isLoading } = useQuery({
    queryKey: ['stores', categoryId, city],
    queryFn: async () => {
      const res = await storesAPI.list({ categoryId, city });
      return (res.data as { stores: Array<{ id: string; name: string; type: string; rating: number; deliveryTime: string }> }).stores;
    },
  });

  const stores = storesData ?? [];

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
      </Box>
      {isLoading ? (
        <Box mt="xl" alignItems="center">
          <ActivityIndicator size="large" color={colors.olive} />
        </Box>
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl, flexGrow: 1 }}
          ListHeaderComponent={
            <Text variant="h3" style={{ marginBottom: spacing.md }}>
              {copy.sections.availableStores}
            </Text>
          }
          ListEmptyComponent={
            <Box py="xxl" alignItems="center">
              <Text variant="body" color="secondary">{copy.empty.noStores}</Text>
            </Box>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => onSelectStore(item.id)}
              activeOpacity={0.7}
              style={{ marginBottom: spacing.md }}
            >
              <Card>
                <Stack direction="horizontal" gap="md" align="center">
                  <Box
                    width={56}
                    height={56}
                    borderRadius={borderRadius.md}
                    backgroundColor={colors.surfaceElevated}
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Text style={{ fontSize: 28 }}>🏪</Text>
                  </Box>
                  <Box flex={1}>
                    <Text variant="h3" numberOfLines={1}>{item.name}</Text>
                    <Text variant="bodySmall" style={{ marginTop: 2 }}>{item.type}</Text>
                    <Text variant="caption" style={{ marginTop: 4 }}>
                      ⭐ {item.rating} • 🕐 {item.deliveryTime}
                    </Text>
                  </Box>
                  <Text variant="body" color="tertiary">›</Text>
                </Stack>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </Box>
  );
};
