import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GhostButton, PrimaryButton } from '@/components/form';
import { GlassCard, Screen, ThemedText } from '@/components/screen';
import { colors, spacing } from '@/theme/tokens';

// NOTE Phase 5: native purchases via RevenueCat replace the web checkout link.
// That requires an EAS development build (react-native-purchases has native code)
// plus RevenueCat, App Store Connect, and Play Console products. Until then we
// route to the existing Stripe web checkout, which unlocks mobile too because
// entitlement lives in the shared backend.

const TIERS = [
  {
    name: 'Personal',
    price: '4.99 EUR / month',
    features: ['20 reports per month', '2 health profiles', 'Trends over time', 'Full PDF export'],
  },
  {
    name: 'Family',
    price: '9.99 EUR / month',
    features: ['50 reports per month', 'Up to 5 member profiles', 'Shared family health history', 'Priority support'],
  },
];

export default function PaywallScreen() {
  const router = useRouter();

  async function openWebPricing() {
    await WebBrowser.openBrowserAsync('https://medyra.de/pricing');
  }

  return (
    <Screen style={styles.noPadding}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.close}>
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <ThemedText variant="label">Medyra</ThemedText>
          <ThemedText variant="h1">More clarity for you and your family</ThemedText>
          <ThemedText variant="bodyMuted">
            One subscription works everywhere: web, iPhone, and Android.
          </ThemedText>
        </View>

        {TIERS.map((tier) => (
          <GlassCard key={tier.name} style={styles.tier}>
            <ThemedText variant="h2">{tier.name}</ThemedText>
            <ThemedText variant="bodyMuted" style={styles.price}>
              {tier.price}
            </ThemedText>
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
          <PrimaryButton title="Continue on medyra.de" onPress={openWebPricing} />
          <GhostButton title="Maybe later" onPress={() => router.back()} />
          <ThemedText variant="caption" style={styles.note}>
            Subscriptions are managed on medyra.de for now. Your plan unlocks the app automatically
            with the same account. Cancel anytime.
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
