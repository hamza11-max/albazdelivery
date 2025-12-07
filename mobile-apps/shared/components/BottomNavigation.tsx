import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme/colors';

export type TabType = 'home' | 'orders' | 'wallet' | 'profile';

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

interface TabIconProps {
  name: string;
  isActive: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ name, isActive }) => {
  const iconMap: Record<string, string> = {
    home: '🏠',
    orders: '📋',
    wallet: '💳',
    profile: '👤',
  };

  return (
    <Text style={[styles.icon, isActive && styles.iconActive]}>
      {iconMap[name] || '•'}
    </Text>
  );
};

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs: { key: TabType; label: string }[] = [
    { key: 'home', label: 'Home' },
    { key: 'orders', label: 'Orders' },
    { key: 'wallet', label: 'Wallet' },
    { key: 'profile', label: 'Profile' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={styles.tab}
          onPress={() => onTabChange(tab.key)}
          activeOpacity={0.7}
        >
          <TabIcon name={tab.key} isActive={activeTab === tab.key} />
          <Text
            style={[
              styles.label,
              activeTab === tab.key && styles.labelActive,
            ]}
          >
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
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    ...colors.shadows?.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  icon: {
    fontSize: 24,
    marginBottom: spacing.xs,
    opacity: 0.6,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    fontWeight: typography.fontWeight.regular,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
});

