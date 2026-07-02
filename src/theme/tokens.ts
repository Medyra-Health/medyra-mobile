/**
 * Medyra design tokens. Single source of truth for all styling.
 * Matches the web brand exactly: dark, premium, calm.
 */

export const colors = {
  /** App background */
  background: '#040C08',
  /** Slightly lifted surface for cards and sheets */
  surface: '#08130D',
  /** Accent emerald */
  emerald: '#10B981',
  emeraldLight: '#34D399',
  emeraldDeep: '#059669',
  /** Primary text */
  text: '#E8F5F0',
  /** Muted text at common opacities */
  textMuted: 'rgba(232, 245, 240, 0.6)',
  textFaint: 'rgba(232, 245, 240, 0.4)',
  /** Glass surfaces: translucent emerald tinted */
  glassFill: 'rgba(16, 185, 129, 0.04)',
  glassBorder: 'rgba(16, 185, 129, 0.08)',
  glassBorderStrong: 'rgba(16, 185, 129, 0.22)',
  /** Semantic status, used only for lab value states */
  statusNormal: '#10B981',
  statusElevated: '#F97316',
  statusCritical: '#EF4444',
} as const;

export const radius = {
  sm: 14,
  md: 18,
  lg: 24,
  full: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fonts = {
  /** Headings: Playfair Display */
  heading: 'PlayfairDisplay_700Bold',
  headingBlack: 'PlayfairDisplay_800ExtraBold',
  /** Body: DM Sans */
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemiBold: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',
} as const;

export const typography = {
  h1: { fontFamily: fonts.heading, fontSize: 32, lineHeight: 38, color: colors.text },
  h2: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 30, color: colors.text },
  h3: { fontFamily: fonts.bodySemiBold, fontSize: 18, lineHeight: 24, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  bodyMuted: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textMuted },
  caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16, color: colors.textFaint },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    color: colors.emerald,
  },
} as const;
