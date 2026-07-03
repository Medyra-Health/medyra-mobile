import { useSSO } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/screen';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

WebBrowser.maybeCompleteAuthSession();

type Strategy = 'oauth_google' | 'oauth_linkedin_oidc';

const PROVIDERS: { strategy: Strategy; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { strategy: 'oauth_google', label: 'Google', icon: 'logo-google' },
  { strategy: 'oauth_linkedin_oidc', label: 'LinkedIn', icon: 'logo-linkedin' },
];

/** Social sign in buttons. Same Clerk providers as the web app (Google, LinkedIn). */
export function SocialAuthButtons({ onError }: { onError: (message: string) => void }) {
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const { t } = useTranslation();
  const [busy, setBusy] = useState<Strategy | null>(null);

  function startFlow(strategy: Strategy) {
    return async () => {
      if (busy) return;
      setBusy(strategy);
      try {
        const { createdSessionId, setActive } = await startSSOFlow({
          strategy,
          redirectUrl: AuthSession.makeRedirectUri(),
        });
        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
          router.replace('/(tabs)');
        }
      } catch (err: any) {
        onError(err?.errors?.[0]?.message ?? t('auth.signInFailed'));
      } finally {
        setBusy(null);
      }
    };
  }

  return (
    <View style={styles.wrap}>
      {PROVIDERS.map(({ strategy, label, icon }) => (
        <Pressable
          key={strategy}
          onPress={startFlow(strategy)}
          disabled={busy !== null}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          {busy === strategy ? (
            <ActivityIndicator color={colors.text} size="small" />
          ) : (
            <>
              <Ionicons name={icon} size={18} color={colors.text} />
              <ThemedText style={styles.label}>
                {t('auth.continueWith', { provider: label })}
              </ThemedText>
            </>
          )}
        </Pressable>
      ))}
      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <ThemedText variant="caption" style={styles.dividerText}>
          {t('auth.or')}
        </ThemedText>
        <View style={styles.divider} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginBottom: spacing.md },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
    backgroundColor: colors.glassFill,
    paddingVertical: 14,
    minHeight: 48,
  },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text },
  pressed: { opacity: 0.75 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  divider: { flex: 1, height: 1, backgroundColor: colors.glassBorder },
  dividerText: { color: colors.textFaint },
});
