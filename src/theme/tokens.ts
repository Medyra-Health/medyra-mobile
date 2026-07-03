/**
 * Medyra design tokens. Single source of truth for all styling.
 * Matches the current web brand: light, bright, clinical premium,
 * emerald accents, Playfair Display headings, DM Sans body.
 */

export const colors = {
  /** App background: soft mint white, like the web dashboard */
  background: '#F7FBF9',
  /** Card and sheet surface */
  surface: '#FFFFFF',
  /** Accent emerald */
  emerald: '#10B981',
  emeraldLight: '#34D399',
  emeraldDeep: '#059669',
  /** Primary text: deep green black, like web headings */
  text: '#0B1F17',
  /** Muted text */
  textMuted: 'rgba(11, 31, 23, 0.62)',
  textFaint: 'rgba(11, 31, 23, 0.42)',
  /** Card surfaces: white with soft emerald tinted borders */
  glassFill: '#FFFFFF',
  glassBorder: 'rgba(16, 185, 129, 0.16)',
  glassBorderStrong: 'rgba(16, 185, 129, 0.38)',
  /** Soft mint fill for secondary surfaces */
  mint: '#F3FAF6',
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
    color: colors.emeraldDeep,
  },
} as const;
