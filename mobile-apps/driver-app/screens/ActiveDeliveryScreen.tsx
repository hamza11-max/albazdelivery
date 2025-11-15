import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../shared/theme/colors';
import { Logo } from '../../shared/components/Logo';
import { BottomNavigation, TabType } from '../../shared/components/BottomNavigation';

const { width, height } = Dimensions.get('window');

export const ActiveDeliveryScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Sample map path points (simplified representation)
  const mapPath = [
    { x: width * 0.1, y: height * 0.3 },
    { x: width * 0.3, y: height * 0.25 },
    { x: width * 0.5, y: height * 0.2 },
    { x: width * 0.7, y: height * 0.15 },
    { x: width * 0.85, y: height * 0.1 },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.headerIcon}>☰</Text>
        </TouchableOpacity>
        <Logo size="sm" />
        <View style={styles.headerButton} />
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <View style={styles.map}>
          {/* Map Background Pattern */}
          <View style={styles.mapBackground}>
            {/* Grid pattern */}
            {Array.from({ length: 8 }).map((_, i) => (
              <View
                key={`h-${i}`}
                style={[
                  styles.mapGridLine,
                  { top: (i + 1) * (height * 0.35) / 9 },
                ]}
              />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <View
                key={`v-${i}`}
                style={[
                  styles.mapGridLine,
                  styles.mapGridLineVertical,
                  { left: (i + 1) * (width * 0.9) / 7 },
                ]}
              />
            ))}

            {/* Delivery Path */}
            <View style={styles.pathContainer}>
              {mapPath.map((point, index) => {
                if (index === mapPath.length - 1) return null;
                const nextPoint = mapPath[index + 1];
                const dx = nextPoint.x - point.x;
                const dy = nextPoint.y - point.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                return (
                  <View
                    key={`path-${index}`}
                    style={[
                      styles.pathSegment,
                      {
                        left: point.x,
                        top: point.y,
                        width: length,
                        transform: [{ rotate: `${angle}deg` }],
                      },
                    ]}
                  />
                );
              })}
            </View>

            {/* Destination Pin */}
            <View
              style={[
                styles.destinationPin,
                {
                  left: mapPath[mapPath.length - 1].x - 15,
                  top: mapPath[mapPath.length - 1].y - 30,
                },
              ]}
            >
              <View style={styles.pinCircle} />
              <View style={styles.pinShadow} />
            </View>

            {/* Current Location Indicator */}
            <View
              style={[
                styles.currentLocation,
                {
                  left: mapPath[0].x - 8,
                  top: mapPath[0].y - 8,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Active Delivery Details */}
      <View style={styles.deliveryCard}>
        <Text style={styles.deliveryCardTitle}>Active Delivery</Text>
        <View style={styles.deliveryInfo}>
          <View style={styles.deliveryInfoRow}>
            <Text style={styles.deliveryIcon}>📍</Text>
            <Text style={styles.deliveryText}>
              6789 Al-Basha 123 Street, Algiers
            </Text>
          </View>
          <View style={styles.deliveryInfoRow}>
            <Text style={styles.deliveryIcon}>⏱</Text>
            <Text style={styles.deliveryText}>22 min</Text>
          </View>
        </View>
      </View>

      {/* Accept Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.acceptButton} activeOpacity={0.8}>
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>

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
  mapContainer: {
    flex: 1,
    padding: spacing.md,
  },
  map: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapBackground: {
    flex: 1,
    backgroundColor: colors.beige[100],
    position: 'relative',
  },
  mapGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.3,
  },
  mapGridLineVertical: {
    width: 1,
    height: '100%',
    top: 0,
  },
  pathContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  pathSegment: {
    position: 'absolute',
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
    opacity: 0.8,
  },
  destinationPin: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
    ...shadows.md,
  },
  pinShadow: {
    position: 'absolute',
    bottom: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.shadow,
    opacity: 0.3,
  },
  currentLocation: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
    ...shadows.sm,
  },
  deliveryCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  deliveryCardTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  deliveryInfo: {
    gap: spacing.md,
  },
  deliveryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deliveryIcon: {
    fontSize: 20,
  },
  deliveryText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.primary,
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  acceptButtonText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});

