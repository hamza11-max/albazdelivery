import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../shared/theme/colors';
import { erpAPI } from '../services/api';

interface Sale {
  id: string;
  createdAt: string;
  items: Array<{ productName: string; quantity: number; price: number }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card';
}

export const SalesScreen: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSales = async () => {
    try {
      setLoading(true);
      const response = await erpAPI.getSales();
      if (response.success) {
        setSales(response.sales || []);
      }
    } catch (error: any) {
      console.error('Failed to load sales:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sales History</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadSales} />
        }
      >
        {loading && sales.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Loading sales...</Text>
          </View>
        ) : sales.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No sales recorded</Text>
          </View>
        ) : (
          sales.map((sale) => (
            <TouchableOpacity
              key={sale.id}
              style={styles.saleCard}
              activeOpacity={0.7}
            >
              <View style={styles.saleHeader}>
                <Text style={styles.saleId}>#{sale.id.slice(0, 8)}</Text>
                <View
                  style={[
                    styles.paymentBadge,
                    sale.paymentMethod === 'cash' && styles.cashBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.paymentText,
                      sale.paymentMethod === 'cash' && styles.cashText,
                    ]}
                  >
                    {sale.paymentMethod === 'cash' ? 'Cash' : 'Card'}
                  </Text>
                </View>
              </View>
              <Text style={styles.saleDate}>{formatDate(sale.createdAt)}</Text>
              <View style={styles.saleItems}>
                <Text style={styles.saleItemsLabel}>
                  {sale.items.length} item(s)
                </Text>
              </View>
              <View style={styles.saleFooter}>
                <View style={styles.saleAmounts}>
                  {sale.discount > 0 && (
                    <Text style={styles.saleDiscount}>
                      Discount: -{sale.discount.toFixed(2)} DZD
                    </Text>
                  )}
                  <Text style={styles.saleTotal}>
                    {sale.total.toFixed(2)} DZD
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  saleCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  saleId: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.mono,
    color: colors.text.secondary,
  },
  paymentBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  cashBadge: {
    backgroundColor: colors.primary,
  },
  paymentText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
  },
  cashText: {
    color: colors.white,
  },
  saleDate: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  saleItems: {
    marginBottom: spacing.sm,
  },
  saleItemsLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  saleFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  saleAmounts: {
    alignItems: 'flex-end',
  },
  saleDiscount: {
    fontSize: typography.fontSize.sm,
    color: '#4CAF50',
    marginBottom: spacing.xs,
  },
  saleTotal: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
});

