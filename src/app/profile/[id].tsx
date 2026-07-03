import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { LineChart } from '@/components/line-chart';
import { GlassCard, Screen, ThemedText } from '@/components/screen';
import { useApi } from '@/lib/api';
import { biomarkerLabel } from '@/lib/biomarkers';
import type { Profile, Report } from '@/lib/types';
import { parseExplanation } from '@/lib/types';
import { colors, spacing } from '@/theme/tokens';

export default function ProfileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useApi();
  const router = useRouter();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [prof, reps] = await Promise.all([api.getProfiles(), api.getReports(id)]);
      const p = (prof.profiles ?? []).find((x) => x.id === id) ?? null;
      setProfile(p);
      setReports(reps.reports ?? []);
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    load();
  }, [load]);

  const series = useMemo(() => {
    const byKey = new Map<string, { value: number; date: string; flag?: string }[]>();
    for (const b of profile?.biomarkers ?? []) {
      const arr = byKey.get(b.key) ?? [];
      arr.push({ value: b.value, date: b.date, flag: b.flag });
      byKey.set(b.key, arr);
    }
    for (const arr of byKey.values()) {
      arr.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    return byKey;
  }, [profile]);

  const keys = [...series.keys()];
  const currentKey = activeKey && series.has(activeKey) ? activeKey : keys[0] ?? null;
  const currentPoints = currentKey ? series.get(currentKey)! : [];

  return (
    <Screen style={styles.noPadding}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <ThemedText variant="h3" numberOfLines={1} style={styles.topTitle}>
          {profile?.name ?? 'Profile'}
        </ThemedText>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.emerald} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Trends */}
          <View style={styles.section}>
            <ThemedText variant="label">{t('profileDetail.trends')}</ThemedText>
            {keys.length === 0 ? (
              <GlassCard>
                <ThemedText variant="bodyMuted">{t('profileDetail.noValues')}</ThemedText>
              </GlassCard>
            ) : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                  {keys.map((k) => (
                    <Pressable
                      key={k}
                      onPress={() => setActiveKey(k)}
                      style={[styles.chip, currentKey === k && styles.chipActive]}
                    >
                      <ThemedText variant="caption" style={currentKey === k ? styles.chipTextActive : undefined}>
                        {biomarkerLabel(k)}
                      </ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>
                <GlassCard>
                  <View style={styles.chartHeader}>
                    <ThemedText variant="h3">{currentKey ? biomarkerLabel(currentKey) : ''}</ThemedText>
                    {currentPoints.length > 0 && (
                      <ThemedText variant="caption">
                        {t('profileDetail.latest')}: {currentPoints[currentPoints.length - 1].value}
                      </ThemedText>
                    )}
                  </View>
                  <LineChart points={currentPoints} width={width - spacing.lg * 2 - spacing.md * 2} />
                  {currentPoints.length === 1 && (
                    <ThemedText variant="caption" style={styles.singleNote}>
                      {t('profileDetail.oneMeasurement')}
                    </ThemedText>
                  )}
                </GlassCard>
              </>
            )}
          </View>

          {/* Document timeline */}
          <View style={styles.section}>
            <ThemedText variant="label">{t('profileDetail.documents')}</ThemedText>
            {reports.length === 0 ? (
              <ThemedText variant="bodyMuted">{t('profileDetail.noDocuments')}</ThemedText>
            ) : (
              reports.map((r) => {
                const exp = parseExplanation(r.explanation);
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => router.push({ pathname: '/report/[id]', params: { id: r.id } })}
                    style={({ pressed }) => pressed && styles.pressed}
                  >
                    <GlassCard style={styles.reportCard}>
                      <View style={styles.reportRow}>
                        <View style={styles.reportBody}>
                          <ThemedText variant="h3" numberOfLines={1} style={styles.reportName}>
                            {r.fileName}
                          </ThemedText>
                          <ThemedText variant="caption" numberOfLines={1}>
                            {exp.inShort || exp.summary}
                          </ThemedText>
                          <ThemedText variant="caption" style={styles.reportDate}>
                            {new Date(r.createdAt).toLocaleDateString()}
                          </ThemedText>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                      </View>
                    </GlassCard>
                  </Pressable>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.xs, width: 34 },
  topTitle: { flex: 1, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  section: { gap: spacing.sm },
  chips: { gap: spacing.sm, paddingBottom: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
  },
  chipActive: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  chipTextActive: { color: '#FFFFFF' },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  singleNote: { marginTop: spacing.sm },
  pressed: { opacity: 0.75 },
  reportCard: { marginTop: spacing.xs },
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reportBody: { flex: 1, gap: 2 },
  reportName: { fontSize: 15 },
  reportDate: { marginTop: 2 },
});
