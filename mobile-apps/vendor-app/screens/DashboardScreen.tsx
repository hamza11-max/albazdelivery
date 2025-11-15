import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../shared/theme/colors';
import { Logo } from '../../shared/components/Logo';
import { BottomNavigation, TabType } from '../../shared/components/BottomNavigation';

const { width } = Dimensions.get('window');

interface ActiveOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  icon: string;
}

export const DashboardScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('orders');

  const activeOrders: ActiveOrder[] = [
    { id: '1', orderNumber: '5123', customerName: 'Saber El Amine', icon: '🥐' },
    { id: '2', orderNumber: '3344', customerName: 'Amina Ali', icon: '🥐' },
  ];

  // Sample graph data (7 days: Sunday to Saturday)
  const earningsData = [2000, 3500, 2800, 4200, 3800, 4500, 8000];
  const maxEarnings = Math.max(...earningsData);
  const days = ['S', 'M', 'M', 'Tu', 'W', 'Th', 'F'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Logo size="sm" />
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Orders Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Today's Orders</Text>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryNumber}>3</Text>
            <View style={styles.summaryEarnings}>
              <Text style={styles.summaryAmount}>8,000</Text>
              <Text style={styles.summaryCurrency}>DZD</Text>
            </View>
          </View>
        </View>

        {/* Earnings Graph */}
        <View style={styles.graphCard}>
          <Text style={styles.graphTitle}>Weekly Earnings</Text>
          <View style={styles.graphContainer}>
            <View style={styles.graphBars}>
              {earningsData.map((value, index) => {
                const height = (value / maxEarnings) * 120;
                return (
                  <View key={index} style={styles.graphBarContainer}>
                    <View
                      style={[
                        styles.graphBar,
                        {
                          height: height,
                          backgroundColor:
                            value === maxEarnings
                              ? colors.primary
                              : colors.secondary,
                        },
                      ]}
                    />
                    <Text style={styles.graphDayLabel}>{days[index]}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Manage Menu Button */}
        <TouchableOpacity style={styles.manageMenuButton} activeOpacity={0.7}>
          <Text style={styles.manageMenuText}>Manage Menu</Text>
        </TouchableOpacity>

        {/* Active Orders Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Orders</Text>
          {activeOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              activeOpacity={0.7}
            >
              <View style={styles.orderIconContainer}>
                <Text style={styles.orderIcon}>{order.icon}</Text>
              </View>
              <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                <Text style={styles.orderCustomer}>{order.customerName}</Text>
              </View>
              <View style={styles.orderArrow}>
                <Text style={styles.orderArrowIcon}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
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
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  summaryLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  summaryNumber: {
    fontSize: 48,
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  summaryEarnings: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  summaryAmount: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  summaryCurrency: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
  },
  graphCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  graphTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  graphContainer: {
    height: 160,
    justifyContent: 'flex-end',
  },
  graphBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120,
  },
  graphBarContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  graphBar: {
    width: '70%',
    borderRadius: borderRadius.sm,
    minHeight: 8,
    marginBottom: spacing.xs,
  },
  graphDayLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  manageMenuButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  manageMenuText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semibold,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  orderIconContainer: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  orderIcon: {
    fontSize: 24,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  orderCustomer: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
  orderArrow: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderArrowIcon: {
    fontSize: 24,
    color: colors.text.secondary,
  },
});

