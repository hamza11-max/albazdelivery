/**
 * ALBAZ Delivery App Color Theme
 * Colors: White, Green, and Beige
 */

export const colors = {
  // Primary Colors
  white: '#FFFFFF',
  beige: {
    50: '#FEFCFB',
    100: '#F9F6F4',
    200: '#F5F0ED',
    300: '#E8DFD8',
    400: '#D4C4B8',
    500: '#C4AFA0', // Main beige
    600: '#B89A88',
    700: '#9D7F6F',
    800: '#7A6255',
    900: '#5C4A40',
  },
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E', // Main green
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  
  // Semantic Colors
  primary: '#22C55E', // Green
  primaryDark: '#16A34A',
  primaryLight: '#4ADE80',
  
  secondary: '#C4AFA0', // Beige
  secondaryDark: '#B89A88',
  secondaryLight: '#E8DFD8',
  
  background: '#FEFCFB', // Light beige/white
  surface: '#FFFFFF',
  surfaceElevated: '#F9F6F4',
  
  // Text Colors
  text: {
    primary: '#5C4A40', // Dark beige
    secondary: '#7A6255',
    tertiary: '#9D7F6F',
    inverse: '#FFFFFF',
    disabled: '#D4C4B8',
  },
  
  // Status Colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Border & Divider
  border: '#E8DFD8',
  divider: '#F5F0ED',
  
  // Shadow
  shadow: 'rgba(92, 74, 64, 0.1)',
  shadowColor: 'rgba(92, 74, 64, 0.1)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

