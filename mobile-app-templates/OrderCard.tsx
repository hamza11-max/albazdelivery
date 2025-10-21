// Order Card Component Template
// Copy to: mobile-apps/[app-name]/components/OrderCard.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';

interface OrderCardProps {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    restaurant: {
      name: string;
      image?: string;
    };
    items: Array<{
      name: string;
      quantity: number;
    }>;
  };
}

export function OrderCard({ order }: OrderCardProps) {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#F59E0B',
      accepted: '#3B82F6',
      preparing: '#8B5CF6',
      delivering: '#10B981',
      delivered: '#059669',
      cancelled: '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      accepted: 'Accepted',
      preparing: 'Preparing',
      delivering: 'On the way',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const itemsPreview = order.items
    .slice(0, 2)
    .map((item) => `${item.quantity}x ${item.name}`)
    .join(', ');
  
  const moreItems = order.items.length > 2 ? ` +${order.items.length - 2} more` : '';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/order/${order.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.restaurantInfo}>
          {order.restaurant.image && (
            <Image
              source={{ uri: order.restaurant.image }}
              style={styles.restaurantImage}
            />
          )}
          <View style={styles.headerText}>
            <Text style={styles.restaurantName}>{order.restaurant.name}</Text>
            <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.items} numberOfLines={1}>
          {itemsPreview}{moreItems}
        </Text>
        
        <View style={styles.footer}>
          <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
          <Text style={styles.total}>{order.total.toFixed(2)} DZD</Text>
        </View>
      </View>

      {['preparing', 'delivering'].includes(order.status) && (
        <View style={styles.trackButton}>
          <Text style={styles.trackButtonText}>Track Order →</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  restaurantImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  orderNumber: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    marginBottom: 8,
  },
  items: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  trackButton: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    textAlign: 'center',
  },
});
