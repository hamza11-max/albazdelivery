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

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
}

export const SuppliersScreen: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await erpAPI.getSuppliers();
      if (response.success) {
        setSuppliers(response.suppliers || []);
      }
    } catch (error: any) {
      console.error('Failed to load suppliers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Suppliers</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadSuppliers} />
        }
      >
        {loading && suppliers.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Loading suppliers...</Text>
          </View>
        ) : suppliers.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No suppliers found</Text>
          </View>
        ) : (
          suppliers.map((supplier) => (
            <TouchableOpacity
              key={supplier.id}
              style={styles.supplierCard}
              activeOpacity={0.7}
            >
              <View style={styles.supplierHeader}>
                <View style={styles.supplierIcon}>
                  <Text style={styles.supplierIconText}>🏭</Text>
                </View>
                <View style={styles.supplierInfo}>
                  <Text style={styles.supplierName}>{supplier.name}</Text>
                  <Text style={styles.supplierContact}>
                    Contact: {supplier.contactPerson}
                  </Text>
                </View>
              </View>
              <View style={styles.supplierDetails}>
                <Text style={styles.supplierDetail}>
                  📞 {supplier.phone}
                </Text>
                {supplier.email && (
                  <Text style={styles.supplierDetail}>
                    ✉️ {supplier.email}
                  </Text>
                )}
                {supplier.address && (
                  <Text style={styles.supplierDetail}>
                    📍 {supplier.address}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
  supplierCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  supplierHeader: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  supplierIcon: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  supplierIconText: {
    fontSize: 24,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  supplierContact: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  supplierDetails: {
    gap: spacing.xs,
  },
  supplierDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  fabText: {
    fontSize: 32,
    color: colors.white,
    fontWeight: 'bold',
  },
});

