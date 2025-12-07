import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../shared/theme/colors';
import { erpAPI } from '../services/api';

interface Product {
  id: number;
  name: string;
  sellingPrice: number;
  stock: number;
  sku: string;
}

interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export const POSScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await erpAPI.getInventory();
      if (response.success) {
        setProducts(response.products?.filter((p: Product) => p.stock > 0) || []);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load products');
    }
  };

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.productId === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prevCart,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: product.sellingPrice,
        },
      ];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prevCart) => {
      const updated = prevCart.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      );
      return updated.filter((item) => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  };

  const completeSale = async (paymentMethod: 'cash' | 'card') => {
    if (cart.length === 0) {
      Alert.alert('Error', 'Cart is empty');
      return;
    }

    try {
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const total = subtotal - discount;

      const sale = {
        items: cart,
        subtotal,
        discount,
        total,
        paymentMethod,
      };

      const response = await erpAPI.createSale(sale);
      if (response.success) {
        Alert.alert('Success', `Sale completed: ${total.toFixed(2)} DZD`);
        setCart([]);
        setDiscount(0);
        loadProducts();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete sale');
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal - discount;

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Point of Sale</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.text.secondary}
        />
      </View>

      <View style={styles.content}>
        <ScrollView style={styles.productsContainer}>
          {filteredProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              onPress={() => addToCart(product)}
              activeOpacity={0.7}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productSku}>SKU: {product.sku}</Text>
              </View>
              <View style={styles.productPriceContainer}>
                <Text style={styles.productPrice}>{product.sellingPrice} DZD</Text>
                <Text style={styles.productStock}>Stock: {product.stock}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.cartContainer}>
          <Text style={styles.cartTitle}>Cart</Text>
          <ScrollView style={styles.cartItems}>
            {cart.map((item) => (
              <View key={item.productId} style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>{item.productName}</Text>
                  <Text style={styles.cartItemPrice}>
                    {item.price} DZD × {item.quantity}
                  </Text>
                </View>
                <View style={styles.cartItemActions}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.productId, -1)}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.productId, 1)}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFromCart(item.productId)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {cart.length === 0 && (
              <Text style={styles.emptyCartText}>Cart is empty</Text>
            )}
          </ScrollView>

          <View style={styles.cartSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>{subtotal.toFixed(2)} DZD</Text>
            </View>
            <View style={styles.discountContainer}>
              <Text style={styles.summaryLabel}>Discount:</Text>
              <TextInput
                style={styles.discountInput}
                value={discount.toString()}
                onChangeText={(text) => setDiscount(Number(text) || 0)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>{total.toFixed(2)} DZD</Text>
            </View>
          </View>

          <View style={styles.paymentButtons}>
            <TouchableOpacity
              style={[styles.paymentButton, styles.cashButton]}
              onPress={() => completeSale('cash')}
              disabled={cart.length === 0}
            >
              <Text style={styles.paymentButtonText}>Cash</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentButton, styles.cardButton]}
              onPress={() => completeSale('card')}
              disabled={cart.length === 0}
            >
              <Text style={styles.paymentButtonText}>Card</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  productsContainer: {
    flex: 1,
    padding: spacing.md,
  },
  productCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  productInfo: {
    marginBottom: spacing.sm,
  },
  productName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  productSku: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  productPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  productStock: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  cartContainer: {
    width: 300,
    backgroundColor: colors.surface,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    padding: spacing.md,
  },
  cartTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  cartItems: {
    flex: 1,
    marginBottom: spacing.md,
  },
  cartItem: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  cartItemInfo: {
    marginBottom: spacing.xs,
  },
  cartItemName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
  },
  cartItemPrice: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  quantityText: {
    minWidth: 30,
    textAlign: 'center',
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: '#FF5252',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: typography.fontSize.lg,
    color: colors.white,
    fontWeight: 'bold',
  },
  emptyCartText: {
    textAlign: 'center',
    color: colors.text.secondary,
    padding: spacing.lg,
  },
  cartSummary: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
  },
  discountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  discountInput: {
    width: 80,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'right',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  totalLabel: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  paymentButtons: {
    gap: spacing.sm,
  },
  paymentButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cashButton: {
    backgroundColor: colors.primary,
  },
  cardButton: {
    backgroundColor: colors.secondary,
  },
  paymentButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
});

