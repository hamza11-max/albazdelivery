import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../shared/theme/colors';
import { Logo } from '../../shared/components/Logo';
import { BottomNavigation, TabType } from '../../shared/components/BottomNavigation';

const { width } = Dimensions.get('window');

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Vendor {
  id: string;
  name: string;
  image: string;
}

export const HomeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: Category[] = [
    { id: '1', name: 'Food', icon: '🍔' },
    { id: '2', name: 'Groceries', icon: '🛒' },
    { id: '3', name: 'Pharmacy', icon: '💊' },
    { id: '4', name: 'Courier', icon: '📦' },
  ];

  const featuredVendors: Vendor[] = [
    { id: '1', name: "Baker's", image: '🥖' },
    { id: '2', name: 'Fresh Grocer', image: '🍊' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.headerIcon}>☰</Text>
        </TouchableOpacity>
        <Logo size="sm" />
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.headerIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for food, groceries or shops"
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Promotional Banner */}
        <View style={styles.bannerContainer}>
          <View style={styles.banner}>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>FREE DELIVERY</Text>
              <Text style={styles.bannerSubtitle}>on your first order</Text>
            </View>
            <View style={styles.bannerDecoration}>
              <Text style={styles.bannerEmoji}>🐦</Text>
            </View>
          </View>
        </View>

        {/* Featured Vendors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Vendors</Text>
          <View style={styles.vendorsGrid}>
            {featuredVendors.map((vendor) => (
              <TouchableOpacity
                key={vendor.id}
                style={styles.vendorCard}
                activeOpacity={0.7}
              >
                <View style={styles.vendorImageContainer}>
                  <Text style={styles.vendorImage}>{vendor.image}</Text>
                </View>
                <Text style={styles.vendorName}>{vendor.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 24,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
    color: colors.text.secondary,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
  },
  categoriesContainer: {
    marginBottom: spacing.lg,
  },
  categoriesContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  categoryCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    minWidth: 100,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  categoryName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.fontWeight.medium,
  },
  bannerContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  banner: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...shadows.md,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  bannerSubtitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.white,
    opacity: 0.9,
  },
  bannerDecoration: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerEmoji: {
    fontSize: 48,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  vendorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  vendorCard: {
    width: (width - spacing.md * 3) / 2,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  vendorImageContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  vendorImage: {
    fontSize: 48,
  },
  vendorName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semibold,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
});

