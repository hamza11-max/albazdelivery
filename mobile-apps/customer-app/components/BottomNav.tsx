import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme/colors';
import { useCartStore } from '../stores/cart-store';
import copy from '../copy';
import { useThemeMode } from '../theme/ThemeProvider';

export type TabType = 'home' | 'search' | 'cart' | 'orders' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { key: TabType; label: string; icon: string }[] = [
  { key: 'home', label: copy.nav.home, icon: '🏠' },
  { key: 'search', label: copy.nav.search, icon: '🔍' },
  { key: 'cart', label: copy.nav.shop, icon: '🛒' },
  { key: 'orders', label: copy.nav.dats, icon: '📋' },
  { key: 'profile', label: copy.nav.profile, icon: '👤' },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const itemCount = useCartStore((s) => s.getItemCount());
  const { isDark } = useThemeMode();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(10, 12, 16, 0.98)' : 'rgba(248, 245, 237, 0.95)',
          borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
        },
      ]}
    >
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={styles.tab}
          onPress={() => onTabChange(tab.key)}
          activeOpacity={0.7}
        >
          <View>
            <Text style={[styles.icon, activeTab === tab.key && styles.iconActive]}>
              {tab.icon}
            </Text>
            {tab.key === 'cart' && itemCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{itemCount > 99 ? '99+' : itemCount}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.label, activeTab === tab.key && styles.labelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  icon: {
    fontSize: 22,
    opacity: 0.6,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  labelActive: {
    color: colors.olive,
    fontWeight: typography.fontWeight.semibold,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: colors.orange,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
