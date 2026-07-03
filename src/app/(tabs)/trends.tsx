import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/form';
import { GlassCard, Screen, ThemedText } from '@/components/screen';
import { useApi } from '@/lib/api';
import { biomarkerLabel } from '@/lib/biomarkers';
import type { Profile, Subscription } from '@/lib/types';
import { colors, spacing } from '@/theme/tokens';

export default function TrendsScreen() {
  const api = useApi();
  const router = useRouter();
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [prof, sub] = await Promise.all([api.getProfiles(), api.getSubscription()]);
      setProfiles(prof.profiles ?? []);
      setSubscription(sub);
    } catch {
      // pull to refresh retries
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const isFree = subscription?.tier === 'free';

  return (
    <Screen style={styles.noPadding}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.emerald} />}
      >
        <View>
          <ThemedText variant="h1" style={styles.title}>
            {t('trends.title')}
          </ThemedText>
          <ThemedText variant="bodyMuted">{t('trends.subtitle')}</ThemedText>
        </View>

        {isFree ? (
          <GlassCard style={styles.upsell}>
            <Ionicons name="trending-up-outline" size={22} color={colors.emerald} />
            <ThemedText variant="h3" style={styles.center}>
              {t('trends.upsellTitle')}
            </ThemedText>
            <ThemedText variant="bodyMuted" style={styles.center}>
              {t('trends.upsellBody')}
            </ThemedText>
            <PrimaryButton title={t('profiles.seePlans')} onPress={() => router.push('/paywall')} />
          </GlassCard>
        ) : profiles.length === 0 ? (
          <GlassCard>
            <ThemedText variant="bodyMuted">{t('trends.empty')}</ThemedText>
          </GlassCard>
        ) : (
          profiles.map((p) => {
            const keys = [...new Set((p.biomarkers ?? []).map((b) => b.key))];
            return (
              <Pressable
                key={p.id}
                onPress={() => router.push({ pathname: '/profile/[id]', params: { id: p.id } })}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <GlassCard style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.dot, { backgroundColor: p.color || colors.emerald }]} />
                    <ThemedText variant="h3" style={styles.cardName}>
                      {p.name}
                    </ThemedText>
                    <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                  </View>
                  {keys.length === 0 ? (
                    <ThemedText variant="caption">{t('trends.noValues')}</ThemedText>
                  ) : (
                    <View style={styles.badges}>
                      {keys.slice(0, 6).map((k) => (
                        <View key={k} style={styles.badge}>
                          <ThemedText variant="caption" style={styles.badgeText}>
                            {biomarkerLabel(k)}
                          </ThemedText>
                        </View>
                      ))}
                      {keys.length > 6 && (
                        <ThemedText variant="caption">{t('trends.more', { count: keys.length - 6 })}</ThemedText>
                      )}
                    </View>
                  )}
                </GlassCard>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  title: { fontSize: 28, lineHeight: 34 },
  upsell: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  center: { textAlign: 'center' },
  pressed: { opacity: 0.75 },
  card: { gap: spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardName: { flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, alignItems: 'center' },
  badge: {
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeText: { color: colors.text },
});
