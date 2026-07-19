import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { WellnessDisclaimer } from '@/components/disclaimer';
import { MedModal, MED_DOT_COLORS } from '@/components/med-modal';
import { GlassCard, Screen, ThemedText } from '@/components/screen';
import { useApi, ApiError } from '@/lib/api';
import {
  getRemindersEnabled,
  resyncMedReminders,
  setMedRemindersEnabled,
} from '@/lib/med-notifications';
import type { Medication, MedicationInput, MedplanData, MedSlot, Profile } from '@/lib/types';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

const SLOT_META: { id: MedSlot; icon: keyof typeof Ionicons.glyphMap; tint: string; bg: string }[] = [
  { id: 'morning', icon: 'partly-sunny-outline', tint: '#B45309', bg: '#FEF3C7' },
  { id: 'noon', icon: 'sunny-outline', tint: '#0369A1', bg: '#E0F2FE' },
  { id: 'evening', icon: 'cloudy-night-outline', tint: '#6D28D9', bg: '#EDE9FE' },
  { id: 'night', icon: 'moon-outline', tint: '#3730A3', bg: '#E0E7FF' },
];

export default function MedsScreen() {
  const api = useApi();
  const router = useRouter();
  const { t } = useTranslation();

  const [data, setData] = useState<MedplanData | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [saving, setSaving] = useState(false);
  const [reminders, setReminders] = useState(false);
  const [remindersBusy, setRemindersBusy] = useState(false);

  const load = useCallback(
    async (pid: string | null, silent = false) => {
      if (!silent) setLoading(true);
      try {
        const d = await api.getMedplan(pid);
        setData(d);
      } catch {
        // keep last known state; pull to refresh retries
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [api],
  );

  useEffect(() => {
    load(profileId);
  }, [load, profileId]);

  useEffect(() => {
    api.getProfiles().then((d) => setProfiles(d.profiles ?? [])).catch(() => {});
    getRemindersEnabled().then(setReminders);
  }, [api]);

  const meds = data?.medications ?? [];
  const weekday = data?.weekday ?? new Date().getDay();
  const dueToday = useMemo(
    () => meds.filter((m) => m.active && (m.days.length === 0 || m.days.includes(weekday))),
    [meds, weekday],
  );

  const intakeOf = (medId: string, slot: MedSlot) =>
    data?.todayIntakes.find((i) => i.medicationId === medId && i.slot === slot)?.status ?? null;

  const dueCount = dueToday.reduce(
    (a, m) => a + SLOT_META.filter((s) => m.slots[s.id]).length,
    0,
  );
  const takenCount = dueToday.reduce(
    (a, m) => a + SLOT_META.filter((s) => m.slots[s.id] && intakeOf(m.id, s.id) === 'taken').length,
    0,
  );
  const pct = dueCount ? Math.round((takenCount / dueCount) * 100) : 0;
  const allDone = dueCount > 0 && takenCount === dueCount;

  const cycleIntake = async (med: Medication, slot: MedSlot) => {
    const current = intakeOf(med.id, slot);
    const next = current === null ? 'taken' : current === 'taken' ? 'skipped' : null;
    setData((d) => {
      if (!d) return d;
      const others = d.todayIntakes.filter((i) => !(i.medicationId === med.id && i.slot === slot));
      return {
        ...d,
        todayIntakes: next === null ? others : [...others, { medicationId: med.id, slot, date: d.today, status: next }],
      };
    });
    try {
      await api.setMedIntake(med.id, slot, next);
    } catch {
      load(profileId, true);
    }
  };

  const saveMed = async (input: MedicationInput) => {
    setSaving(true);
    try {
      if (editingMed) await api.updateMedication(editingMed.id, { ...input, profileId });
      else await api.createMedication({ ...input, profileId });
      setModalVisible(false);
      setEditingMed(null);
      const d = await api.getMedplan(profileId);
      setData(d);
      if (!profileId) await resyncMedReminders(d.medications, t('medplan.notifTitle'));
    } catch (err) {
      const msg = err instanceof ApiError && err.code === 'med_limit_reached'
        ? t('medplan.limitReached')
        : t('medplan.saveError');
      Alert.alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const deleteMed = async (med: Medication) => {
    setModalVisible(false);
    setEditingMed(null);
    try {
      await api.deleteMedication(med.id);
      const d = await api.getMedplan(profileId);
      setData(d);
      if (!profileId) await resyncMedReminders(d.medications, t('medplan.notifTitle'));
    } catch {
      load(profileId, true);
    }
  };

  const toggleReminders = async (on: boolean) => {
    setRemindersBusy(true);
    try {
      // reminders always follow the user's own plan (profileId null)
      const selfMeds = profileId === null && data ? data.medications : (await api.getMedplan(null)).medications;
      const result = await setMedRemindersEnabled(on, selfMeds, t('medplan.notifTitle'));
      setReminders(result);
      if (on && !result) Alert.alert(t('medplan.notifDenied'));
    } finally {
      setRemindersBusy(false);
    }
  };

  const switchProfile = (pid: string | null) => {
    if (pid !== null && data && !data.profilesAllowed) {
      Alert.alert(t('medplan.lockedTitle'), t('medplan.lockedBody'), [
        { text: t('medplan.cancel'), style: 'cancel' },
        { text: t('medplan.upgrade'), onPress: () => router.push('/paywall') },
      ]);
      return;
    }
    setProfileId(pid);
  };

  const streak = data?.stats.streak ?? 0;
  const adherence7 = data?.stats.adherence7 ?? null;

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(profileId, true); }} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <ThemedText variant="h2">{t('medplan.title')}</ThemedText>
            <ThemedText variant="caption" style={{ marginTop: 2 }}>{t('medplan.subtitle')}</ThemedText>
          </View>
          <Pressable style={styles.addBtn} onPress={() => { setEditingMed(null); setModalVisible(true); }}>
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>

        {/* Profile chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileRow}>
          <Pressable
            onPress={() => switchProfile(null)}
            style={[styles.profileChip, profileId === null && styles.profileChipActive]}
          >
            <ThemedText variant="caption" style={[styles.profileChipText, profileId === null && { color: '#fff' }]}>
              {t('medplan.me')}
            </ThemedText>
          </Pressable>
          {profiles.map((p) => {
            const locked = data ? !data.profilesAllowed : false;
            return (
              <Pressable
                key={p.id}
                onPress={() => switchProfile(p.id)}
                style={[styles.profileChip, profileId === p.id && styles.profileChipActive]}
              >
                {locked && <Ionicons name="lock-closed" size={11} color={colors.textFaint} style={{ marginRight: 4 }} />}
                <ThemedText variant="caption" style={[styles.profileChipText, profileId === p.id && { color: '#fff' }]}>
                  {p.name}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading && !data ? (
          <View style={styles.center}><ActivityIndicator color={colors.emerald} /></View>
        ) : (
          <>
            {/* Stats card */}
            <Animated.View entering={FadeInDown.duration(350)}>
              <GlassCard style={styles.statsCard}>
                <View style={styles.progressBlock}>
                  <View style={styles.progressCircle}>
                    <ThemedText variant="h3" style={{ color: colors.emeraldDeep }}>{pct}%</ThemedText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="h3">{t('medplan.today')}</ThemedText>
                    <ThemedText variant="caption">{takenCount}/{dueCount} {t('medplan.doses')}</ThemedText>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${pct}%` }]} />
                    </View>
                  </View>
                </View>
                <View style={styles.statChips}>
                  <View style={[styles.statChip, { backgroundColor: '#FFF7ED' }]}>
                    <Ionicons name="flame" size={16} color="#F97316" />
                    <ThemedText variant="caption" style={styles.statChipText}>
                      {streak} {t('medplan.streak')}
                    </ThemedText>
                  </View>
                  {adherence7 !== null && (
                    <View style={[styles.statChip, { backgroundColor: colors.mint }]}>
                      <Ionicons name="checkmark-done" size={16} color={colors.emeraldDeep} />
                      <ThemedText variant="caption" style={styles.statChipText}>
                        {adherence7}% {t('medplan.rate')}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </GlassCard>
            </Animated.View>

            {allDone && (
              <Animated.View entering={ZoomIn.springify()} style={styles.doneBanner}>
                <Ionicons name="sparkles" size={16} color="#fff" />
                <ThemedText variant="body" style={styles.doneText}>{t('medplan.allDone')}</ThemedText>
              </Animated.View>
            )}

            {/* Slot sections */}
            {dueToday.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="medkit-outline" size={26} color={colors.emerald} />
                </View>
                <ThemedText variant="h3" style={{ textAlign: 'center' }}>{t('medplan.emptyTitle')}</ThemedText>
                <ThemedText variant="bodyMuted" style={styles.emptyText}>{t('medplan.emptyText')}</ThemedText>
                <Pressable style={styles.emptyBtn} onPress={() => { setEditingMed(null); setModalVisible(true); }}>
                  <ThemedText variant="body" style={{ color: '#fff', fontFamily: fonts.bodyBold }}>
                    {t('medplan.addMed')}
                  </ThemedText>
                </Pressable>
              </GlassCard>
            ) : (
              SLOT_META.map(({ id, icon, tint, bg }, si) => {
                const slotMeds = dueToday.filter((m) => m.slots[id]);
                if (slotMeds.length === 0) return null;
                const slotTaken = slotMeds.filter((m) => intakeOf(m.id, id) === 'taken').length;
                return (
                  <Animated.View key={id} entering={FadeInDown.delay(si * 70).duration(320)}>
                    <GlassCard style={styles.slotCard}>
                      <View style={[styles.slotHeader, { backgroundColor: bg }]}>
                        <Ionicons name={icon} size={17} color={tint} />
                        <ThemedText variant="body" style={[styles.slotTitle, { color: tint }]}>
                          {t(`medplan.slot_${id}`)}
                        </ThemedText>
                        <ThemedText variant="caption" style={{ color: tint }}>
                          {slotMeds[0].times?.[id]}
                        </ThemedText>
                        <View style={styles.slotCount}>
                          <ThemedText variant="caption" style={{ color: tint, fontFamily: fonts.bodyBold }}>
                            {slotTaken}/{slotMeds.length}
                          </ThemedText>
                        </View>
                      </View>
                      {slotMeds.map((m) => {
                        const status = intakeOf(m.id, id);
                        return (
                          <View key={m.id} style={styles.medRow}>
                            <Pressable
                              style={styles.medInfo}
                              onPress={() => { setEditingMed(m); setModalVisible(true); }}
                            >
                              <View style={[styles.medDot, { backgroundColor: MED_DOT_COLORS[m.color] ?? colors.emerald }]} />
                              <View style={{ flex: 1 }}>
                                <ThemedText
                                  variant="body"
                                  style={[
                                    { fontFamily: fonts.bodySemiBold },
                                    status === 'taken' && styles.medTaken,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {m.name}
                                </ThemedText>
                                {!!m.dose && <ThemedText variant="caption" numberOfLines={1}>{m.dose}</ThemedText>}
                              </View>
                            </Pressable>
                            <Pressable onPress={() => cycleIntake(m, id)} hitSlop={8}>
                              <Animated.View
                                key={`${m.id}-${id}-${status ?? 'none'}`}
                                entering={ZoomIn.springify().damping(14)}
                                style={[
                                  styles.checkBtn,
                                  status === 'taken' && styles.checkTaken,
                                  status === 'skipped' && styles.checkSkipped,
                                ]}
                              >
                                {status === 'skipped' ? (
                                  <Ionicons name="close" size={16} color={colors.textFaint} />
                                ) : (
                                  <Ionicons name="checkmark" size={18} color={status === 'taken' ? '#fff' : colors.glassBorderStrong} />
                                )}
                              </Animated.View>
                            </Pressable>
                          </View>
                        );
                      })}
                    </GlassCard>
                  </Animated.View>
                );
              })
            )}

            {/* Dose reminders toggle (device local notifications, own plan) */}
            {meds.length > 0 && (
              <Animated.View entering={FadeInDown.delay(280).duration(320)}>
                <GlassCard style={styles.reminderCard}>
                  <View style={styles.reminderIcon}>
                    <Ionicons name="alarm-outline" size={20} color={colors.emeraldDeep} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="body" style={{ fontFamily: fonts.bodySemiBold }}>
                      {t('medplan.reminders')}
                    </ThemedText>
                    <ThemedText variant="caption">{t('medplan.remindersDesc')}</ThemedText>
                  </View>
                  <Switch
                    value={reminders}
                    disabled={remindersBusy}
                    onValueChange={toggleReminders}
                    trackColor={{ true: colors.emerald, false: undefined }}
                  />
                </GlassCard>
              </Animated.View>
            )}

            <WellnessDisclaimer />
          </>
        )}
        <View style={{ height: spacing.xl }} />
      </ScrollView>

      <MedModal
        visible={modalVisible}
        med={editingMed}
        saving={saving}
        onClose={() => { setModalVisible(false); setEditingMed(null); }}
        onSave={saveMed}
        onDelete={deleteMed}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRow: { gap: 8, paddingBottom: spacing.md },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  profileChipActive: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  profileChipText: { fontFamily: fonts.bodyBold, color: colors.textMuted },
  center: { paddingVertical: 60, alignItems: 'center' },
  statsCard: { padding: spacing.md, marginBottom: spacing.md },
  progressBlock: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  progressCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mint,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.mint,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.emerald },
  statChips: { flexDirection: 'row', gap: 8, marginTop: spacing.md },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  statChipText: { fontFamily: fonts.bodyBold, color: colors.text },
  doneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.emerald,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.md,
  },
  doneText: { color: '#fff', fontFamily: fonts.bodyBold, flex: 1 },
  emptyCard: { padding: spacing.lg, alignItems: 'center' },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyText: { textAlign: 'center', marginTop: 6, marginBottom: spacing.md },
  emptyBtn: {
    backgroundColor: colors.emerald,
    borderRadius: radius.md,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  slotCard: { padding: 0, overflow: 'hidden', marginBottom: spacing.md },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  slotTitle: { fontFamily: fonts.bodyBold, flex: 0 },
  slotCount: { marginLeft: 'auto' },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.mint,
  },
  medInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  medDot: { width: 10, height: 10, borderRadius: 5 },
  medTaken: { color: colors.textFaint, textDecorationLine: 'line-through' },
  checkBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.glassBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkTaken: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  checkSkipped: { backgroundColor: colors.mint, borderColor: colors.glassBorder },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  reminderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
