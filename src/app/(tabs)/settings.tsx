import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GlassCard, Screen, ThemedText } from '@/components/screen';
import { getStoredLanguage, setLanguage, SUPPORTED_LANGUAGES } from '@/i18n';
import { useApi } from '@/lib/api';
import type { Subscription } from '@/lib/types';
import { colors, radius, spacing } from '@/theme/tokens';

function Row({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Ionicons name={icon} size={18} color={danger ? colors.statusCritical : colors.emerald} />
      <ThemedText variant="body" style={[styles.rowLabel, danger && styles.dangerText]}>
        {label}
      </ThemedText>
      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const api = useApi();
  const router = useRouter();
  const { t } = useTranslation();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [languageChoice, setLanguageChoice] = useState('system');

  useFocusEffect(
    useCallback(() => {
      api.getSubscription().then(setSubscription).catch(() => {});
    }, [api]),
  );

  useEffect(() => {
    getStoredLanguage().then(setLanguageChoice);
  }, []);

  async function onPickLanguage(code: string) {
    setLanguageChoice(code);
    await setLanguage(code);
  }

  const email = user?.emailAddresses?.[0]?.emailAddress;

  function open(url: string) {
    WebBrowser.openBrowserAsync(url);
  }

  function onSignOut() {
    Alert.alert(t('settings.signOut'), t('settings.signOutBody'), [
      { text: t('settings.cancel'), style: 'cancel' },
      { text: t('settings.signOut'), style: 'destructive', onPress: () => signOut() },
    ]);
  }

  function onDeleteAccount() {
    Alert.alert(t('settings.deleteTitle'), t('settings.deleteBody'), [
      { text: t('settings.cancel'), style: 'cancel' },
      {
        text: t('settings.deletePermanently'),
        style: 'destructive',
        onPress: async () => {
          try {
            await user?.delete();
          } catch {
            Alert.alert(t('settings.deleteFailed'), t('settings.deleteFailedBody'));
          }
        },
      },
    ]);
  }

  return (
    <Screen style={styles.noPadding}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedText variant="h1" style={styles.title}>
          {t('settings.title')}
        </ThemedText>

        {/* Account */}
        <GlassCard style={styles.card}>
          <ThemedText variant="label">{t('settings.account')}</ThemedText>
          <ThemedText variant="body">{email ?? ''}</ThemedText>
          <ThemedText variant="caption">
            {subscription
              ? subscription.tier === 'free'
                ? t('settings.freePlanUsage', {
                    remaining: subscription.remaining,
                    limit: subscription.usageLimit,
                  })
                : t('settings.paidPlan', {
                    tier: `${subscription.tier.charAt(0).toUpperCase()}${subscription.tier.slice(1)}`,
                  })
              : ' '}
          </ThemedText>
          {subscription?.tier === 'free' ? (
            <Row icon="sparkles-outline" label={t('settings.upgrade')} onPress={() => router.push('/paywall')} />
          ) : (
            <Row
              icon="card-outline"
              label={t('settings.manageSubscription')}
              onPress={() => open('https://medyra.de/dashboard')}
            />
          )}
        </GlassCard>

        {/* Language */}
        <GlassCard style={styles.card}>
          <ThemedText variant="label">{t('settings.language')}</ThemedText>
          <View style={styles.chips}>
            {SUPPORTED_LANGUAGES.map(({ code, label }) => (
              <Pressable
                key={code}
                onPress={() => onPickLanguage(code)}
                style={[styles.chip, languageChoice === code && styles.chipActive]}
              >
                <ThemedText variant="caption" style={languageChoice === code ? styles.chipTextActive : undefined}>
                  {code === 'system' ? t('settings.systemLanguage') : label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </GlassCard>

        {/* Legal */}
        <GlassCard style={styles.card}>
          <ThemedText variant="label">{t('settings.legal')}</ThemedText>
          <Row icon="document-text-outline" label={t('settings.privacy')} onPress={() => open('https://medyra.de/privacy')} />
          <Row icon="document-text-outline" label={t('settings.terms')} onPress={() => open('https://medyra.de/terms')} />
          <Row icon="business-outline" label={t('settings.impressum')} onPress={() => open('https://medyra.de/impressum')} />
        </GlassCard>

        {/* About */}
        <GlassCard style={styles.card}>
          <ThemedText variant="label">{t('settings.about')}</ThemedText>
          <ThemedText variant="bodyMuted" style={styles.aboutText}>
            {t('settings.aboutText')}
          </ThemedText>
          <ThemedText variant="caption">{t('settings.madeIn')}</ThemedText>
        </GlassCard>

        {/* Danger zone */}
        <GlassCard style={styles.card}>
          <Row icon="log-out-outline" label={t('settings.signOut')} onPress={onSignOut} />
          <Row icon="trash-outline" label={t('settings.deleteAccount')} onPress={onDeleteAccount} danger />
          <ThemedText variant="caption">{t('settings.deletionNote')}</ThemedText>
        </GlassCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  title: { fontSize: 28, lineHeight: 34 },
  card: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  rowLabel: { flex: 1 },
  dangerText: { color: colors.statusCritical },
  pressed: { opacity: 0.7 },
  aboutText: { lineHeight: 21 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
  },
  chipActive: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  chipTextActive: { color: '#04120C' },
});
