import { PropsWithChildren } from 'react';
import { StyleSheet, Text, TextProps, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '@/theme/tokens';

/** Full screen wrapper: brand background, safe area, soft emerald glow up top. */
export function Screen({ children, style, ...rest }: PropsWithChildren<ViewProps>) {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.glow} pointerEvents="none" />
      <View style={[styles.content, style]} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
}

type Variant = keyof typeof typography;

/** Text with brand typography variants. Defaults to body. */
export function ThemedText({
  variant = 'body',
  style,
  ...rest
}: TextProps & { variant?: Variant }) {
  return <Text style={[typography[variant], style]} {...rest} />;
}

/** Glassmorphism card surface. */
export function GlassCard({ children, style, ...rest }: PropsWithChildren<ViewProps>) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glow: {
    position: 'absolute',
    top: -120,
    alignSelf: 'center',
    width: 420,
    height: 320,
    borderRadius: 210,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.glassFill,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    shadowColor: '#0B1F17',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
});
