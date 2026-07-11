import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GhostButton, PrimaryButton } from '@/components/form';
import { GlassCard, Screen, ThemedText } from '@/components/screen';
import { colors, spacing } from '@/theme/tokens';

// NOTE Phase 5: native purchases via RevenueCat replace the web checkout link.
// See PHASE5-REVENUECAT.md for the full plan and backend entitlement spec.

// Store builds must not show prices or link to external checkout for digital
// subscriptions (App Store 3.1.1, Play Payments policy). eas.json sets this
// env only in the production profile; Expo Go and preview keep the web link.
const STORE_BUILD = process.env.EXPO_PUBLIC_STORE_BUILD === '1';

export default function PaywallScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  async function openWebPricing() {
    await WebBrowser.openBrowserAsync('https://medyra.de/pricing');
  }

  const tiers = [
    {
      name: 'Personal',
      price: t('paywall.personalPrice'),
      features: t('paywall.personalFeatures', { returnObjects: true }) as string[],
    },
    {
      name: 'Family',
      price: t('paywall.familyPrice'),
      features: t('paywall.familyFeatures', { returnObjects: true }) as string[],
    },
  ];

  return (
    <Screen style={styles.noPadding}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.close}>
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <ThemedText variant="label">Medyra</ThemedText>
          <ThemedText variant="h1">{t('paywall.headline')}</ThemedText>
          <ThemedText variant="bodyMuted">{t('paywall.subtitle')}</ThemedText>
        </View>

        {tiers.map((tier) => (
          <GlassCard key={tier.name} style={styles.tier}>
            <ThemedText variant="h2">{tier.name}</ThemedText>
            {!STORE_BUILD && (
              <ThemedText variant="bodyMuted" style={styles.price}>
                {tier.price}
              </ThemedText>
            )}
            {tier.features.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.emerald} />
                <ThemedText variant="body" style={styles.featureText}>
                  {f}
                </ThemedText>
              </View>
            ))}
          </GlassCard>
        ))}

        <View style={styles.actions}>
          {!STORE_BUILD && <PrimaryButton title={t('paywall.continueWeb')} onPress={openWebPricing} />}
          <GhostButton title={t('paywall.maybeLater')} onPress={() => router.back()} />
          <ThemedText variant="caption" style={styles.note}>
            {t(STORE_BUILD ? 'paywall.storeNote' : 'paywall.note')}
          </ThemedText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  header: { gap: spacing.sm, marginBottom: spacing.sm },
  close: { alignSelf: 'flex-end' },
  tier: { gap: spacing.xs, padding: spacing.lg },
  price: { marginBottom: spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  featureText: { flex: 1, fontSize: 14 },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  note: { textAlign: 'center', marginTop: spacing.xs },
});
