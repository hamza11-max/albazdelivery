/**
 * ALBAZ design tokens – single source for web and mobile.
 * Web: use for CSS variables or inline styles; Mobile: use for StyleSheet.
 * Matches apps/customer globals.css (--albaz-*) and mobile theme.
 */
export const colors = {
  white: '#FFFFFF',
  cream: '#f5f1e8',
  creamStrong: '#efe8da',
  olive: '#2f5b2f',
  oliveDeep: '#1f3f27',
  oliveMuted: '#4b6a47',
  gold: '#f3be63',
  goldSoft: '#f7d38e',
  orange: '#f1a04a',
  forest: '#12281c',
  primary: '#2f5b2f',
  primaryDark: '#1f3f27',
  primaryLight: '#4b6a47',
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
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  fontSize: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, xxl: 24, xxxl: 32 },
  fontWeight: { regular: '400' as const, medium: '500' as const, semibold: '600' as const, bold: '700' as const },
  lineHeight: { tight: 1.25, normal: 1.5, relaxed: 1.625 },
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  card: 18,
  input: 16,
  xl: 24,
  full: 9999,
} as const;

export const shadows = {
  sm: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  md: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  lg: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
} as const;

export type DesignTokens = {
  colors: typeof colors;
  spacing: typeof spacing;
  typography: typeof typography;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
};
