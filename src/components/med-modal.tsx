import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/screen';
import type { Medication, MedicationInput, MedSlot } from '@/lib/types';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

const SLOTS: { id: MedSlot; icon: keyof typeof Ionicons.glyphMap; tint: string }[] = [
  { id: 'morning', icon: 'partly-sunny-outline', tint: '#F59E0B' },
  { id: 'noon', icon: 'sunny-outline', tint: '#0EA5E9' },
  { id: 'evening', icon: 'cloudy-night-outline', tint: '#8B5CF6' },
  { id: 'night', icon: 'moon-outline', tint: '#6366F1' },
];

const DEFAULT_TIMES: Record<MedSlot, string> = {
  morning: '08:00',
  noon: '13:00',
  evening: '19:00',
  night: '22:00',
};

export const MED_DOT_COLORS: Record<Medication['color'], string> = {
  emerald: '#10B981',
  sky: '#0EA5E9',
  violet: '#8B5CF6',
  amber: '#F59E0B',
  rose: '#F43F5E',
  indigo: '#6366F1',
};

type Props = {
  visible: boolean;
  med: Medication | null;
  saving: boolean;
  onClose: () => void;
  onSave: (input: MedicationInput) => void;
  onDelete: (med: Medication) => void;
};

export function MedModal({ visible, med, saving, onClose, onSave, onDelete }: Props) {
  const { t, i18n } = useTranslation();

  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState<Medication['color']>('emerald');
  const [slots, setSlots] = useState<Record<MedSlot, boolean>>({ morning: false, noon: false, evening: false, night: false });
  const [times, setTimes] = useState<Record<MedSlot, string>>({ ...DEFAULT_TIMES });
  const [days, setDays] = useState<number[]>([]);
  const [scheme, setScheme] = useState('');

  useEffect(() => {
    if (!visible) return;
    setName(med?.name ?? '');
    setDose(med?.dose ?? '');
    setNotes(med?.notes ?? '');
    setColor(med?.color ?? 'emerald');
    setSlots({
      morning: !!med?.slots?.morning,
      noon: !!med?.slots?.noon,
      evening: !!med?.slots?.evening,
      night: !!med?.slots?.night,
    });
    setTimes({ ...DEFAULT_TIMES, ...(med?.times ?? {}) });
    setDays(med?.days ?? []);
    setScheme('');
  }, [visible, med]);

  // 1-0-1-0 quick scheme fills the slot toggles
  useEffect(() => {
    const m = scheme.trim().match(/^([01])\s*-\s*([01])\s*-\s*([01])(?:\s*-\s*([01]))?$/);
    if (!m) return;
    setSlots({
      morning: m[1] === '1',
      noon: m[2] === '1',
      evening: m[3] === '1',
      night: m[4] === '1',
    });
  }, [scheme]);

  const schemePlaceholder = (['morning', 'noon', 'evening', 'night'] as MedSlot[])
    .map((s) => (slots[s] ? '1' : '0'))
    .join('-');

  const WEEK = [1, 2, 3, 4, 5, 6, 0];
  const dayLabel = (d: number) =>
    new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }).format(new Date(2024, 0, 7 + d));

  const toggleDay = (d: number) =>
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  const save = () => {
    if (!name.trim()) {
      Alert.alert(t('medplan.nameRequired'));
      return;
    }
    if (!Object.values(slots).some(Boolean)) {
      Alert.alert(t('medplan.slotRequired'));
      return;
    }
    const cleanTimes: Record<MedSlot, string> = { ...DEFAULT_TIMES };
    (Object.keys(cleanTimes) as MedSlot[]).forEach((s) => {
      if (/^([01]?\d|2[0-3]):[0-5]\d$/.test(times[s])) cleanTimes[s] = times[s].padStart(5, '0');
    });
    onSave({ name: name.trim(), dose: dose.trim(), notes: notes.trim(), color, slots, times: cleanTimes, days });
  };

  const confirmDelete = () => {
    if (!med) return;
    Alert.alert(t('medplan.deleteTitle'), t('medplan.deleteBody'), [
      { text: t('medplan.cancel'), style: 'cancel' },
      { text: t('medplan.delete'), style: 'destructive', onPress: () => onDelete(med) },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <ThemedText variant="h3">{med ? t('medplan.editMed') : t('medplan.addMed')}</ThemedText>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Name + dose */}
              <ThemedText variant="label" style={styles.label}>{t('medplan.name')}</ThemedText>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('medplan.namePh')}
                placeholderTextColor={colors.textFaint}
              />
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="label" style={styles.label}>{t('medplan.dose')}</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={dose}
                    onChangeText={setDose}
                    placeholder="500 mg"
                    placeholderTextColor={colors.textFaint}
                  />
                </View>
                <View>
                  <ThemedText variant="label" style={styles.label}>{t('medplan.color')}</ThemedText>
                  <View style={styles.colorRow}>
                    {(Object.keys(MED_DOT_COLORS) as Medication['color'][]).map((c) => (
                      <Pressable
                        key={c}
                        onPress={() => setColor(c)}
                        style={[
                          styles.colorDot,
                          { backgroundColor: MED_DOT_COLORS[c] },
                          color === c && styles.colorDotActive,
                        ]}
                      />
                    ))}
                  </View>
                </View>
              </View>

              {/* Scheme quick input */}
              <View style={styles.schemeCard}>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="label" style={{ marginBottom: 4 }}>{t('medplan.scheme')}</ThemedText>
                  <TextInput
                    style={styles.schemeInput}
                    value={scheme}
                    onChangeText={setScheme}
                    placeholder={schemePlaceholder}
                    placeholderTextColor={colors.textFaint}
                    keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                  />
                </View>
                <ThemedText variant="caption" style={styles.schemeHint}>{t('medplan.schemeHint')}</ThemedText>
              </View>

              {/* Slots with times */}
              <ThemedText variant="label" style={styles.label}>{t('medplan.times')}</ThemedText>
              <View style={styles.slotGrid}>
                {SLOTS.map(({ id, icon, tint }) => (
                  <Pressable
                    key={id}
                    onPress={() => setSlots((s) => ({ ...s, [id]: !s[id] }))}
                    style={[styles.slotCard, slots[id] && styles.slotCardActive]}
                  >
                    <View style={styles.slotTop}>
                      <Ionicons name={icon} size={16} color={tint} />
                      <ThemedText variant="caption" style={styles.slotName}>
                        {t(`medplan.slot_${id}`)}
                      </ThemedText>
                      <View style={[styles.radio, slots[id] && styles.radioActive]} />
                    </View>
                    <TextInput
                      style={[styles.timeInput, !slots[id] && { color: colors.textFaint }]}
                      value={times[id]}
                      editable={slots[id]}
                      onChangeText={(v) => setTimes((tm) => ({ ...tm, [id]: v }))}
                      placeholder={DEFAULT_TIMES[id]}
                      placeholderTextColor={colors.textFaint}
                    />
                  </Pressable>
                ))}
              </View>

              {/* Weekdays */}
              <View style={styles.daysHeader}>
                <ThemedText variant="label" style={styles.label}>{t('medplan.days')}</ThemedText>
                <Pressable onPress={() => setDays([])}>
                  <ThemedText
                    variant="caption"
                    style={{ color: days.length === 0 ? colors.emeraldDeep : colors.textFaint, fontFamily: fonts.bodyBold }}
                  >
                    {t('medplan.everyDay')}
                  </ThemedText>
                </Pressable>
              </View>
              <View style={styles.daysRow}>
                {WEEK.map((d) => {
                  const active = days.length === 0 || days.includes(d);
                  return (
                    <Pressable
                      key={d}
                      onPress={() => toggleDay(d)}
                      style={[styles.dayChip, active && styles.dayChipActive, days.length === 0 && { opacity: 0.55 }]}
                    >
                      <ThemedText
                        variant="caption"
                        style={{ color: active ? '#fff' : colors.textMuted, fontFamily: fonts.bodyBold }}
                      >
                        {dayLabel(d)}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              {/* Notes */}
              <ThemedText variant="label" style={styles.label}>{t('medplan.notes')}</ThemedText>
              <TextInput
                style={styles.input}
                value={notes}
                onChangeText={setNotes}
                placeholder={t('medplan.notesPh')}
                placeholderTextColor={colors.textFaint}
              />

              {/* Actions */}
              <View style={styles.actions}>
                {med ? (
                  <Pressable onPress={confirmDelete} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={16} color={colors.statusCritical} />
                    <ThemedText variant="caption" style={{ color: colors.statusCritical, fontFamily: fonts.bodyBold }}>
                      {t('medplan.delete')}
                    </ThemedText>
                  </Pressable>
                ) : (
                  <View />
                )}
                <Pressable onPress={save} disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.6 }]}>
                  <ThemedText variant="body" style={styles.saveText}>
                    {t('medplan.save')}
                  </ThemedText>
                </Pressable>
              </View>
              <View style={{ height: spacing.lg }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(4, 12, 8, 0.5)', justifyContent: 'flex-end' },
  kav: { width: '100%' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    maxHeight: '92%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: { marginTop: spacing.md, marginBottom: 6 },
  input: {
    backgroundColor: colors.mint,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
  },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  colorRow: { flexDirection: 'row', gap: 8, paddingVertical: 12 },
  colorDot: { width: 24, height: 24, borderRadius: 12 },
  colorDotActive: { borderWidth: 3, borderColor: colors.text },
  schemeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.mint,
    borderColor: colors.glassBorderStrong,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  schemeInput: {
    backgroundColor: colors.surface,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    letterSpacing: 3,
    color: colors.text,
  },
  schemeHint: { flex: 1, lineHeight: 15 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotCard: {
    width: '48%',
    flexGrow: 1,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    borderRadius: radius.md,
    padding: 12,
    backgroundColor: colors.surface,
  },
  slotCardActive: { borderColor: colors.emerald, backgroundColor: colors.mint },
  slotTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slotName: { flex: 1, fontFamily: fonts.bodyBold, color: colors.text },
  radio: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.glassBorderStrong },
  radioActive: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  timeInput: { marginTop: 6, fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textMuted, padding: 0 },
  daysHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  daysRow: { flexDirection: 'row', gap: 6 },
  dayChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.sm,
    backgroundColor: colors.mint,
    alignItems: 'center',
  },
  dayChipActive: { backgroundColor: colors.emerald },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  saveBtn: {
    backgroundColor: colors.emerald,
    borderRadius: radius.md,
    paddingHorizontal: 28,
    paddingVertical: 13,
  },
  saveText: { color: '#fff', fontFamily: fonts.bodyBold },
});
