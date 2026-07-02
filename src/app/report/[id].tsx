import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';

import { WellnessDisclaimer } from '@/components/disclaimer';
import { GlassCard, Screen, ThemedText } from '@/components/screen';
import { useApi } from '@/lib/api';
import type { Profile, Report } from '@/lib/types';
import { parseExplanation } from '@/lib/types';
import { colors, radius, spacing } from '@/theme/tokens';

function flagColor(flag?: string) {
  const f = (flag ?? 'normal').toLowerCase();
  if (f.includes('critical') || f.includes('high risk')) return colors.statusCritical;
  if (f.includes('elevated') || f.includes('high') || f.includes('low') || f.includes('abnormal'))
    return colors.statusElevated;
  return colors.statusNormal;
}

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useApi();
  const router = useRouter();

  const [report, setReport] = useState<Report | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [{ report: r }, prof] = await Promise.all([
        api.getReport(id),
        api.getProfiles().catch(() => ({ profiles: [] as Profile[] })),
      ]);
      setReport(r);
      setProfiles(prof.profiles ?? []);
    } catch (err) {
      Alert.alert('Could not load report', err instanceof Error ? err.message : 'Please try again.', [
        { text: 'Go back', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [api, id, router]);

  useEffect(() => {
    load();
  }, [load]);

  const exp = parseExplanation(report?.explanation);

  async function onShare() {
    const lines = [
      exp.inShort ? exp.inShort : '',
      '',
      exp.summary,
      '',
      ...exp.tests.map((t) => `${t.name}: ${t.value}${t.flag ? ` (${t.flag})` : ''}`),
      '',
      'Explained with Medyra. Not medical advice.',
    ].filter(Boolean);
    await Share.share({ message: lines.join('\n') });
  }

  async function onAssign(profileId: string) {
    if (!report) return;
    setAssigning(true);
    try {
      await api.assignReport(report.id, profileId);
      setShowAssign(false);
      await load();
    } catch (err) {
      Alert.alert('Could not assign', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setAssigning(false);
    }
  }

  const assignedProfile = profiles.find((p) => p.id === report?.profileId);

  return (
    <Screen style={styles.noPadding}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <ThemedText variant="h3" numberOfLines={1} style={styles.topTitle}>
          {report?.fileName ?? 'Report'}
        </ThemedText>
        <Pressable onPress={onShare} hitSlop={12} style={styles.backBtn} disabled={!report}>
          <Ionicons name="share-outline" size={20} color={colors.text} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.emerald} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {exp.inShort ? (
            <GlassCard style={styles.inShort}>
              <ThemedText variant="label">In short</ThemedText>
              <ThemedText variant="h2" style={styles.inShortText}>
                {exp.inShort}
              </ThemedText>
            </GlassCard>
          ) : null}

          {exp.summary ? (
            <View style={styles.section}>
              <ThemedText variant="label">Summary</ThemedText>
              <ThemedText variant="body" style={styles.summary}>
                {exp.summary}
              </ThemedText>
            </View>
          ) : null}

          {exp.tests.length > 0 && (
            <View style={styles.section}>
              <ThemedText variant="label">Your values</ThemedText>
              {exp.tests.map((t, i) => {
                const flag = t.flag ?? t.status;
                return (
                  <GlassCard key={`${t.name}-${i}`} style={styles.testCard}>
                    <View style={styles.testHeader}>
                      <View style={[styles.testBar, { backgroundColor: flagColor(flag) }]} />
                      <View style={styles.testTitleWrap}>
                        <ThemedText variant="h3" style={styles.testName}>
                          {t.name}
                        </ThemedText>
                        <ThemedText variant="caption">
                          {t.value}
                          {t.range ? `  ·  Reference: ${t.range}` : ''}
                        </ThemedText>
                      </View>
                      {flag ? (
                        <View style={[styles.pill, { borderColor: flagColor(flag) }]}>
                          <ThemedText variant="caption" style={{ color: flagColor(flag) }}>
                            {String(flag)}
                          </ThemedText>
                        </View>
                      ) : null}
                    </View>
                    {t.interpretation ? (
                      <ThemedText variant="bodyMuted" style={styles.interpretation}>
                        {t.interpretation}
                      </ThemedText>
                    ) : null}
                  </GlassCard>
                );
              })}
            </View>
          )}

          {/* Assign to profile */}
          <View style={styles.section}>
            <ThemedText variant="label">Health profile</ThemedText>
            {assignedProfile ? (
              <GlassCard style={styles.assignRow}>
                <Ionicons name="person-circle-outline" size={20} color={colors.emerald} />
                <ThemedText variant="body" style={styles.assignName}>
                  Saved to {assignedProfile.name}
                </ThemedText>
              </GlassCard>
            ) : profiles.length > 0 ? (
              <>
                <Pressable onPress={() => setShowAssign((s) => !s)}>
                  <GlassCard style={styles.assignRow}>
                    <Ionicons name="add-circle-outline" size={20} color={colors.emerald} />
                    <ThemedText variant="body" style={styles.assignName}>
                      Save to a profile for trend tracking
                    </ThemedText>
                    <Ionicons
                      name={showAssign ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={colors.textFaint}
                    />
                  </GlassCard>
                </Pressable>
                {showAssign &&
                  profiles.map((p) => (
                    <Pressable key={p.id} onPress={() => onAssign(p.id)} disabled={assigning}>
                      <GlassCard style={styles.assignOption}>
                        <View style={[styles.dot, { backgroundColor: p.color || colors.emerald }]} />
                        <ThemedText variant="body">{p.name}</ThemedText>
                      </GlassCard>
                    </Pressable>
                  ))}
              </>
            ) : (
              <ThemedText variant="caption">
                Create a health profile in the Profiles tab to track values over time.
              </ThemedText>
            )}
          </View>

          <WellnessDisclaimer />
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
  backBtn: { padding: spacing.xs },
  topTitle: { flex: 1, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  inShort: { gap: spacing.xs, padding: spacing.lg },
  inShortText: { fontSize: 20, lineHeight: 27 },
  section: { gap: spacing.sm },
  summary: { lineHeight: 23 },
  testCard: { marginTop: spacing.xs },
  testHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  testBar: { width: 3, height: 34, borderRadius: 2 },
  testTitleWrap: { flex: 1 },
  testName: { fontSize: 15 },
  pill: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  interpretation: { marginTop: spacing.sm, fontSize: 14, lineHeight: 21 },
  assignRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  assignName: { flex: 1 },
  assignOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
