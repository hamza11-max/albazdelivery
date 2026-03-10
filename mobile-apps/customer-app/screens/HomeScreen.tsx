import React, { useState } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { Box, Text, Input, Stack } from '../components/ui';
import { Logo } from '../components/Logo';
import { BottomNav, TabType } from '../components/BottomNav';
import { categoriesAPI } from '../services/api-client';
import copy from '../copy';

const CITIES = ['Alger', 'Ouargla', 'Ghardaïa', 'Tamanrasset'];

interface HomeScreenProps {
  onTabChange: (tab: TabType) => void;
  onCategorySelect: (id: number) => void;
  onNavigateToStore: (storeId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onTabChange,
  onCategorySelect,
  onNavigateToStore,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(CITIES[CITIES.length - 1] ?? 'Tamanrasset');

  const { data: categoriesData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoriesAPI.list();
      return (res.data as { categories: Array<{ id: number; name: string; nameFr: string; nameAr: string }> }).categories;
    },
  });

  const categories = categoriesData ?? [];

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    onTabChange(tab);
  };

  return (
    <Box flex={1} backgroundColor={colors.background}>
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        px="md"
        pt="lg"
        pb="md"
        backgroundColor={colors.surface}
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <TouchableOpacity style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 24 }}>☰</Text>
        </TouchableOpacity>
        <Logo size="sm" />
        <TouchableOpacity
          style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
          onPress={() => handleTabChange('search')}
        >
          <Text style={{ fontSize: 24 }}>🔍</Text>
        </TouchableOpacity>
      </Box>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.olive]} />
        }
      >
        <Input
          placeholder={copy.search.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Text style={{ fontSize: 18 }}>🔍</Text>}
          containerStyle={{ marginHorizontal: spacing.md, marginTop: spacing.md, ...shadows.sm }}
        />

        <Box px="md" mt="sm" flexDirection="row" alignItems="center">
          <Box
            style={{
              backgroundColor: colors.orange,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.full,
            }}
          >
            <Text color="inverse" weight="semibold" size="sm">📍 {selectedCity}</Text>
          </Box>
        </Box>

        {isLoading ? (
          <Box mt="xl" alignItems="center">
            <ActivityIndicator size="large" color={colors.olive} />
          </Box>
        ) : (
          <>
            <Text variant="h3" style={{ marginTop: spacing.lg, marginHorizontal: spacing.md }}>
              {copy.sections.categories}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: spacing.md }}
              contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.md, paddingBottom: spacing.md }}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => onCategorySelect(cat.id)}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: colors.surface,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    borderRadius: borderRadius.card,
                    minWidth: 100,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: colors.border,
                    ...shadows.sm,
                  }}
                >
                  <Text variant="label">{cat.nameFr || cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Box
              mx="md"
              mt="lg"
              p="lg"
              backgroundColor={colors.olive}
              borderRadius={borderRadius.card}
              style={shadows.md}
            >
              <Text variant="h2" color="inverse">Livraison gratuite</Text>
              <Text variant="body" color="inverse" style={{ opacity: 0.9, marginTop: 4 }}>
                sur votre première commande
              </Text>
            </Box>
          </>
        )}
      </ScrollView>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </Box>
  );
};
