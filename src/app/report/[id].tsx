import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import type { Profile, Reminder, Report } from '@/lib/types';
import { parseExplanation } from '@/lib/types';
import { colors, radius, spacing } from '@/theme/tokens';

const REMINDER_PRESETS = ['4w', '3m', '6m'] as const;

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
  const { t, i18n } = useTranslation();

  const [report, setReport] = useState<Report | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [reminderBusy, setReminderBusy] = useState(false);
  const [sharingLink, setSharingLink] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [{ report: r }, prof, rem] = await Promise.all([
        api.getReport(id),
        api.getProfiles().catch(() => ({ profiles: [] as Profile[] })),
        api.getReminders(id).catch(() => ({ reminders: [] as Reminder[] })),
      ]);
      setReport(r);
      setProfiles(prof.profiles ?? []);
      setReminder(rem.reminders?.[0] ?? null);
    } catch (err) {
      Alert.alert(t('report.couldNotLoad'), err instanceof Error ? err.message : '', [
        { text: t('report.goBack'), onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [api, id, router]);

  useEffect(() => {
    load();
  }, [load]);

  const exp = parseExplanation(report?.explanation);

  async function shareAsText() {
    const lines = [
      exp.inShort ? exp.inShort : '',
      '',
      exp.summary,
      '',
      ...exp.tests.map((t) => `${t.name}: ${t.value}${t.flag ? ` (${t.flag})` : ''}`),
      '',
      t('report.sharedFooter'),
    ].filter(Boolean);
    await Share.share({ message: lines.join('\n') });
  }

  // Secure read only link: shows only the explanation, expires after 7 days
  async function shareAsLink() {
    if (!report || sharingLink) return;
    setSharingLink(true);
    try {
      const { token } = await api.createShareLink(report.id);
      await Share.share({ message: `${t('report.shareLinkText')} https://medyra.de/share/${token}` });
    } catch (err) {
      Alert.alert(t('report.shareLinkFailed'), err instanceof Error ? err.message : '');
    } finally {
      setSharingLink(false);
    }
  }

  function onShare() {
    Alert.alert(t('report.shareTitle'), t('report.shareBody'), [
      { text: t('report.shareAsLink'), onPress: shareAsLink },
      { text: t('report.shareAsText'), onPress: shareAsText },
      { text: t('report.shareCancel'), style: 'cancel' },
    ]);
  }

  async function setRecheckReminder(preset: (typeof REMINDER_PRESETS)[number]) {
    if (!report || reminderBusy) return;
    setReminderBusy(true);
    try {
      const res = await api.createReminder(preset, report.id, report.fileName, i18n.language);
      setReminder(res.reminder);
    } catch (err) {
      Alert.alert(t('report.reminderFailed'), err instanceof Error ? err.message : '');
    } finally {
      setReminderBusy(false);
    }
  }

  async function cancelReminder() {
    if (!reminder) return;
    const prev = reminder;
    setReminder(null);
    try {
      await api.deleteReminder(prev.id);
    } catch {
      setReminder(prev);
    }
  }

  async function onAssign(profileId: string) {
    if (!report) return;
    setAssigning(true);
    try {
      await api.assignReport(report.id, profileId);
      setShowAssign(false);
      await load();
    } catch (err) {
      Alert.alert(t('report.couldNotAssign'), err instanceof Error ? err.message : '');
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
              <ThemedText variant="label">{t('report.inShort')}</ThemedText>
              <ThemedText variant="h2" style={styles.inShortText}>
                {exp.inShort}
              </ThemedText>
            </GlassCard>
          ) : null}

          {exp.summary ? (
            <View style={styles.section}>
              <ThemedText variant="label">{t('report.summary')}</ThemedText>
              <ThemedText variant="body" style={styles.summary}>
                {exp.summary}
              </ThemedText>
            </View>
          ) : null}

          {exp.tests.length > 0 && (
            <View style={styles.section}>
              <ThemedText variant="label">{t('report.yourValues')}</ThemedText>
              {exp.tests.map((test, i) => {
                const flag = test.flag ?? test.status;
                return (
                  <GlassCard key={`${test.name}-${i}`} style={styles.testCard}>
                    <View style={styles.testHeader}>
                      <View style={[styles.testBar, { backgroundColor: flagColor(flag) }]} />
                      <View style={styles.testTitleWrap}>
                        <ThemedText variant="h3" style={styles.testName}>
                          {test.name}
                        </ThemedText>
                        <ThemedText variant="caption">
                          {test.value}
                          {test.range ? `  ·  ${t('report.reference')}: ${test.range}` : ''}
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
                    {test.interpretation ? (
                      <ThemedText variant="bodyMuted" style={styles.interpretation}>
                        {test.interpretation}
                      </ThemedText>
                    ) : null}
                  </GlassCard>
                );
              })}
            </View>
          )}

          {/* Document sections (doctor letters, prescriptions, insurance letters) */}
          {(exp.sections ?? []).length > 0 && (
            <View style={styles.section}>
              {(exp.sections ?? []).map((section, i) => (
                <GlassCard key={`${section.title}-${i}`} style={styles.testCard}>
                  <ThemedText variant="h3" style={styles.testName}>
                    {section.title}
                  </ThemedText>
                  {section.content ? (
                    <ThemedText variant="bodyMuted" style={styles.interpretation}>
                      {section.content}
                    </ThemedText>
                  ) : null}
                  {(section.items ?? []).map((item, j) => (
                    <View key={j} style={styles.bulletRow}>
                      <ThemedText variant="bodyMuted" style={styles.bullet}>
                        ·
                      </ThemedText>
                      <ThemedText variant="bodyMuted" style={styles.bulletText}>
                        {item}
                      </ThemedText>
                    </View>
                  ))}
                </GlassCard>
              ))}
            </View>
          )}

          {/* Questions for the doctor */}
          {(exp.questionsForDoctor ?? []).length > 0 && (
            <View style={styles.section}>
              <ThemedText variant="label">{t('report.questionsForDoctor')}</ThemedText>
              <GlassCard>
                {(exp.questionsForDoctor ?? []).map((q, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <ThemedText variant="bodyMuted" style={styles.bullet}>
                      {i + 1}.
                    </ThemedText>
                    <ThemedText variant="bodyMuted" style={styles.bulletText}>
                      {q}
                    </ThemedText>
                  </View>
                ))}
              </GlassCard>
            </View>
          )}

          {/* Next steps */}
          {(exp.nextSteps ?? []).length > 0 && (
            <View style={styles.section}>
              <ThemedText variant="label">{t('report.nextSteps')}</ThemedText>
              <GlassCard>
                {(exp.nextSteps ?? []).map((s, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Ionicons name="checkmark-circle-outline" size={15} color={colors.emerald} style={styles.bulletIcon} />
                    <ThemedText variant="bodyMuted" style={styles.bulletText}>
                      {s}
                    </ThemedText>
                  </View>
                ))}
              </GlassCard>
            </View>
          )}

          {/* Recheck reminder */}
          <View style={styles.section}>
            <ThemedText variant="label">{t('report.reminderTitle')}</ThemedText>
            <GlassCard style={styles.reminderCard}>
              {reminder ? (
                <>
                  <View style={styles.reminderActiveRow}>
                    <Ionicons name="notifications-outline" size={18} color={colors.emerald} />
                    <ThemedText variant="body" style={styles.reminderActiveText}>
                      {t('report.reminderActive', {
                        date: new Date(reminder.dueAt).toLocaleDateString(),
                      })}
                    </ThemedText>
                  </View>
                  <Pressable onPress={cancelReminder} hitSlop={8}>
                    <ThemedText variant="caption" style={styles.reminderCancel}>
                      {t('report.reminderCancel')}
                    </ThemedText>
                  </Pressable>
                </>
              ) : (
                <>
                  <ThemedText variant="bodyMuted" style={styles.reminderDesc}>
                    {t('report.reminderDesc')}
                  </ThemedText>
                  <View style={styles.reminderRow}>
                    {REMINDER_PRESETS.map((preset) => (
                      <Pressable
                        key={preset}
                        onPress={() => setRecheckReminder(preset)}
                        disabled={reminderBusy}
                        style={({ pressed }) => [
                          styles.reminderChip,
                          (pressed || reminderBusy) && { opacity: 0.6 },
                        ]}
                      >
                        <ThemedText variant="caption" style={styles.reminderChipLabel}>
                          {t(`report.reminder_${preset}`)}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
            </GlassCard>
          </View>

          {/* Assign to profile */}
          <View style={styles.section}>
            <ThemedText variant="label">{t('report.healthProfile')}</ThemedText>
            {assignedProfile ? (
              <GlassCard style={styles.assignRow}>
                <Ionicons name="person-circle-outline" size={20} color={colors.emerald} />
                <ThemedText variant="body" style={styles.assignName}>
                  {t('report.savedTo', { name: assignedProfile.name })}
                </ThemedText>
              </GlassCard>
            ) : profiles.length > 0 ? (
              <>
                <Pressable onPress={() => setShowAssign((s) => !s)}>
                  <GlassCard style={styles.assignRow}>
                    <Ionicons name="add-circle-outline" size={20} color={colors.emerald} />
                    <ThemedText variant="body" style={styles.assignName}>
                      {t('report.saveToProfile')}
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
              <ThemedText variant="caption">{t('report.createProfileHint')}</ThemedText>
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
  bulletRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs, alignItems: 'flex-start' },
  bullet: { fontSize: 14, lineHeight: 21 },
  bulletIcon: { marginTop: 3 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 21 },
  reminderCard: { gap: spacing.sm },
  reminderDesc: { fontSize: 14, lineHeight: 20 },
  reminderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  reminderChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
    backgroundColor: colors.mint,
  },
  reminderChipLabel: { color: colors.text, fontFamily: 'DMSans_600SemiBold' },
  reminderActiveRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reminderActiveText: { flex: 1, fontSize: 14 },
  reminderCancel: { color: colors.statusCritical, fontFamily: 'DMSans_600SemiBold' },
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
