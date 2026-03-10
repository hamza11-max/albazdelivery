/**
 * ALBAZ Delivery – matches web app (apps/customer) design tokens
 * From globals.css: --albaz-cream, --albaz-olive, --albaz-orange, etc.
 */
export const colors = {
  white: '#FFFFFF',
  // ALBAZ palette (light theme)
  cream: '#f5f1e8',
  creamStrong: '#efe8da',
  olive: '#2f5b2f',
  oliveDeep: '#1f3f27',
  oliveMuted: '#4b6a47',
  gold: '#f3be63',
  goldSoft: '#f7d38e',
  orange: '#f1a04a',
  forest: '#12281c',
  // Legacy green scale (kept for compatibility; prefer olive above)
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  // Semantic – primary = olive to match web
  primary: '#2f5b2f',
  primaryDark: '#1f3f27',
  primaryLight: '#4b6a47',
  secondary: '#C4AFA0',
  secondaryDark: '#B89A88',
  secondaryLight: '#E8DFD8',
  background: '#f5f1e8',
  surface: '#f8f5ed',
  surfaceElevated: '#efe8da',
  text: {
    primary: '#1f2c22',
    secondary: '#4a5a50',
    tertiary: '#6b7c72',
    inverse: '#FFFFFF',
    disabled: '#9D7F6F',
  },
  success: '#2f5b2f',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  border: 'rgba(47, 91, 47, 0.08)',
  divider: 'rgba(47, 91, 47, 0.06)',
  shadow: 'rgba(31, 44, 34, 0.08)',
  shadowColor: 'rgba(31, 44, 34, 0.08)',
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
  fontFamily: { regular: 'System', medium: 'System', bold: 'System' },
  fontSize: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, xxl: 24, xxxl: 32 },
  fontWeight: { regular: '400' as const, medium: '500' as const, semibold: '600' as const, bold: '700' as const },
};

/** Web uses 18px for cards, 16px for search/inputs */
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  card: 18,
  input: 16,
  xl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
};
