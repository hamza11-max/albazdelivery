import React, { useState } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { Box, Text } from '../components/ui';
import { BottomNav, TabType } from '../components/BottomNav';
import { categoriesAPI } from '../services/api-client';
import copy from '../copy';
import { useThemeMode } from '../theme/ThemeProvider';

const logoImage = require('../assets/albaz-logo.png');

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
  const { mode: themeMode, toggle: toggleTheme, isDark } = useThemeMode();

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

  const palette = {
    background: isDark ? '#05090b' : colors.background,
    headerBg: isDark ? '#111317' : colors.surface,
    headerBorder: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
    searchBg: isDark ? '#1a1d21' : colors.surface,
    searchPlaceholder: isDark ? 'rgba(245,241,232,0.6)' : undefined,
    bannerBg: isDark ? '#00513a' : colors.olive,
    textPrimary: isDark ? '#f5f1e8' : colors.text.primary,
  };

  const getCategoryConfig = (name: string) => {
    const key = name.toLowerCase();
    if (key.includes('shop')) return { icon: '🏬', color: colors.olive };
    if (key.includes('grocer') || key.includes('market')) return { icon: '🛒', color: colors.orange };
    if (key.includes('pharm')) return { icon: '💊', color: colors.oliveMuted };
    if (key.includes('food') || key.includes('restaur') || key.includes('pizza')) return { icon: '🍽️', color: colors.olive };
    if (key.includes('package') || key.includes('delivery') || key.includes('courier')) return { icon: '📦', color: colors.gold };
    return { icon: '🍽️', color: colors.olive };
  };

  return (
    <Box flex={1} backgroundColor={palette.background}>
      {/* Top bar: logo (left) | location pill (center) | theme + notifications (right) */}
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        px="md"
        pt="lg"
        pb="md"
        backgroundColor={palette.headerBg}
        style={{ borderBottomWidth: 1, borderBottomColor: palette.headerBorder }}
      >
        <Box style={{ width: 100, height: 36, justifyContent: 'center' }}>
          <Image
            source={logoImage}
            style={{ width: 100, height: 36 }}
            resizeMode="contain"
          />
        </Box>

        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.orange,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.full,
          }}
        >
          <Text color="inverse" weight="semibold" size="sm">
            📍 {selectedCity}
          </Text>
        </TouchableOpacity>

        <Box flexDirection="row" alignItems="center">
          <TouchableOpacity
            onPress={toggleTheme}
            style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
          >
            <Text style={{ fontSize: 22 }}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginLeft: spacing.xs }}
          >
            <Text style={{ fontSize: 22, color: palette.textPrimary }}>🔔</Text>
          </TouchableOpacity>
        </Box>
      </Box>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.olive]} />
        }
      >
        {/* Search bar */}
        <Box
          mx="md"
          mt="md"
          flexDirection="row"
          alignItems="center"
          style={{
            backgroundColor: palette.searchBg,
            borderRadius: borderRadius.full,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            ...shadows.sm,
          }}
        >
          <Text style={{ fontSize: 18, marginRight: spacing.sm, color: palette.textPrimary }}>🔍</Text>
          <Box flex={1}>
            <Text
              variant="bodySmall"
              color={isDark ? 'inverse' : 'tertiary'}
              numberOfLines={1}
            >
              {copy.search.placeholder}
            </Text>
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
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                  }}
                >
                  {(() => {
                    const label = cat.nameFr || cat.name;
                    const cfg = getCategoryConfig(label);
                    return (
                      <Box
                        width={64}
                        height={64}
                        borderRadius={32}
                        justifyContent="center"
                        alignItems="center"
                        style={{
                          backgroundColor: cfg.color,
                          marginBottom: spacing.sm,
                        }}
                      >
                        <Text style={{ fontSize: 26, color: colors.white }}>{cfg.icon}</Text>
                      </Box>
                    );
                  })()}
                  <Text variant="bodySmall" style={{ textAlign: 'center', maxWidth: 80 }}>
                    {cat.nameFr || cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Box
              mx="md"
              mt="lg"
              p="lg"
              backgroundColor={palette.bannerBg}
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
