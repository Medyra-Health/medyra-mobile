import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';

import { GlassCard, Screen, ThemedText } from '@/components/screen';
import { useApi } from '@/lib/api';
import type { Subscription } from '@/lib/types';
import { colors, spacing } from '@/theme/tokens';

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
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useFocusEffect(
    useCallback(() => {
      api.getSubscription().then(setSubscription).catch(() => {});
    }, [api]),
  );

  const email = user?.emailAddresses?.[0]?.emailAddress;

  function open(url: string) {
    WebBrowser.openBrowserAsync(url);
  }

  function onSignOut() {
    Alert.alert('Sign out', 'Sign out of Medyra on this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  function onDeleteAccount() {
    Alert.alert(
      'Delete account',
      'This permanently deletes your account, all reports, and all profiles on web and mobile. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await user?.delete();
            } catch {
              Alert.alert(
                'Could not delete',
                'Please try again, or email privacy@medyra.de and we delete your account for you.',
              );
            }
          },
        },
      ],
    );
  }

  return (
    <Screen style={styles.noPadding}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedText variant="h1" style={styles.title}>
          Settings
        </ThemedText>

        {/* Account */}
        <GlassCard style={styles.card}>
          <ThemedText variant="label">Account</ThemedText>
          <ThemedText variant="body">{email ?? ''}</ThemedText>
          <ThemedText variant="caption">
            {subscription
              ? subscription.tier === 'free'
                ? `Free plan · ${subscription.remaining} of ${subscription.usageLimit} reports left this month`
                : `${subscription.tier.charAt(0).toUpperCase()}${subscription.tier.slice(1)} plan`
              : ' '}
          </ThemedText>
          {subscription?.tier === 'free' ? (
            <Row icon="sparkles-outline" label="Upgrade your plan" onPress={() => router.push('/paywall')} />
          ) : (
            <Row
              icon="card-outline"
              label="Manage subscription"
              onPress={() => open('https://medyra.de/dashboard')}
            />
          )}
        </GlassCard>

        {/* Legal */}
        <GlassCard style={styles.card}>
          <ThemedText variant="label">Legal</ThemedText>
          <Row icon="document-text-outline" label="Privacy Policy" onPress={() => open('https://medyra.de/privacy')} />
          <Row icon="document-text-outline" label="Terms of Service" onPress={() => open('https://medyra.de/terms')} />
          <Row icon="business-outline" label="Impressum" onPress={() => open('https://medyra.de/impressum')} />
        </GlassCard>

        {/* About */}
        <GlassCard style={styles.card}>
          <ThemedText variant="label">About</ThemedText>
          <ThemedText variant="bodyMuted" style={styles.aboutText}>
            Medyra explains medical documents in plain language. We are supported by Potsdam
            Transfer, the startup service of the University of Potsdam.
          </ThemedText>
          <ThemedText variant="caption">Made in Germany · medyra.de</ThemedText>
        </GlassCard>

        {/* Danger zone */}
        <GlassCard style={styles.card}>
          <Row icon="log-out-outline" label="Sign out" onPress={onSignOut} />
          <Row icon="trash-outline" label="Delete account and all data" onPress={onDeleteAccount} danger />
          <ThemedText variant="caption">
            Deletion is immediate and covers web and mobile (GDPR Art. 17).
          </ThemedText>
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
});
