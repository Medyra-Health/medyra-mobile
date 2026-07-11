import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { WellnessDisclaimer } from '@/components/disclaimer';
import { GlassCard, Screen, ThemedText } from '@/components/screen';
import { useApi } from '@/lib/api';
import type { WerteEntry } from '@/lib/types';
import { colors, radius, spacing } from '@/theme/tokens';

type CheckStatus = 'low' | 'normal' | 'elevated' | 'high';

/** Same range model as the web checker (lexikon reference ranges). */
function resolveStatus(ranges: WerteEntry['ranges'], value: number): CheckStatus | null {
  if (!ranges?.normal) return null;
  const n = ranges.normal;
  if (n.min != null && value < n.min) return 'low';
  if (n.max != null && value <= n.max) return 'normal';
  if (ranges.elevated) {
    const eMax = ranges.elevated.max;
    if (eMax == null || value <= eMax) return 'elevated';
  }
  if (ranges.high) return 'high';
  return 'elevated';
}

const STATUS_COLOR: Record<CheckStatus, string> = {
  low: '#3B82F6',
  normal: colors.statusNormal,
  elevated: colors.statusElevated,
  high: colors.statusCritical,
};

const POPULAR = ['tsh', 'hba1c', 'ferritin', 'ldl', 'crp', 'haemoglobin'];

export default function CheckScreen() {
  const api = useApi();
  const router = useRouter();
  const { t } = useTranslation();

  const [entries, setEntries] = useState<WerteEntry[] | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<WerteEntry | null>(null);
  const [rawValue, setRawValue] = useState('');

  useEffect(() => {
    let alive = true;
    api
      .getWerte()
      .then((d) => {
        if (alive) setEntries(d.entries ?? []);
      })
      .catch(() => {
        if (alive) setEntries([]);
      });
    return () => {
      alive = false;
    };
  }, [api]);

  const suggestions = useMemo(() => {
    if (!entries) return [];
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return entries
      .filter(
        (e) =>
          e.acronym.toLowerCase().includes(q) ||
          e.name.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [entries, query]);

  const value = useMemo(() => {
    const v = parseFloat(rawValue.replace(',', '.'));
    return Number.isFinite(v) ? v : null;
  }, [rawValue]);

  const status = selected && value != null ? resolveStatus(selected.ranges, value) : null;
  const statusColor = status ? STATUS_COLOR[status] : colors.textFaint;

  function pick(entry: WerteEntry) {
    setSelected(entry);
    setQuery('');
  }

  return (
    <Screen style={styles.noPadding}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <ThemedText variant="h3" style={styles.topTitle}>
          {t('check.title')}
        </ThemedText>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ThemedText variant="bodyMuted">{t('check.subtitle')}</ThemedText>

        {entries === null ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.emerald} />
          </View>
        ) : (
          <>
            {/* Value picker */}
            {selected ? (
              <Pressable onPress={() => setSelected(null)}>
                <GlassCard style={styles.selectedRow}>
                  <View style={styles.selectedText}>
                    <ThemedText variant="h3">{selected.acronym}</ThemedText>
                    <ThemedText variant="caption" numberOfLines={1}>
                      {selected.name}
                    </ThemedText>
                  </View>
                  <Ionicons name="swap-horizontal-outline" size={18} color={colors.textFaint} />
                </GlassCard>
              </Pressable>
            ) : (
              <View>
                <View style={styles.inputWrap}>
                  <Ionicons name="search-outline" size={18} color={colors.textFaint} />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder={t('check.searchPlaceholder')}
                    placeholderTextColor={colors.textFaint}
                    style={styles.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {suggestions.map((e) => (
                  <Pressable key={e.slug} onPress={() => pick(e)}>
                    <GlassCard style={styles.suggestionRow}>
                      <View style={styles.selectedText}>
                        <ThemedText variant="body" style={styles.suggestionName}>
                          {e.acronym}
                        </ThemedText>
                        <ThemedText variant="caption" numberOfLines={1}>
                          {e.name}
                        </ThemedText>
                      </View>
                      <ThemedText variant="caption">{e.category}</ThemedText>
                    </GlassCard>
                  </Pressable>
                ))}
                {!query && (
                  <View style={styles.popularWrap}>
                    <ThemedText variant="caption">{t('check.popular')}</ThemedText>
                    <View style={styles.popularRow}>
                      {POPULAR.map((slug) => {
                        const e = entries.find((x) => x.slug === slug);
                        if (!e) return null;
                        return (
                          <Pressable key={slug} onPress={() => pick(e)} style={styles.popularChip}>
                            <ThemedText variant="caption" style={styles.popularLabel}>
                              {e.acronym}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Number input */}
            {selected && (
              <View style={styles.inputWrap}>
                <TextInput
                  value={rawValue}
                  onChangeText={(v) => setRawValue(v.replace(/[^\d.,]/g, ''))}
                  placeholder={t('check.valuePlaceholder')}
                  placeholderTextColor={colors.textFaint}
                  style={styles.input}
                  keyboardType="decimal-pad"
                />
                {selected.unit ? <ThemedText variant="caption">{selected.unit}</ThemedText> : null}
              </View>
            )}

            {/* Result */}
            {selected && (
              <GlassCard style={styles.resultCard}>
                {status ? (
                  <>
                    <View style={styles.resultHeader}>
                      <View style={[styles.statusPill, { borderColor: statusColor }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <ThemedText variant="caption" style={{ color: statusColor, fontFamily: 'DMSans_600SemiBold' }}>
                          {t(`check.status.${status}`)}
                        </ThemedText>
                      </View>
                      <ThemedText variant="caption">
                        {t('check.usualRange')}: {selected.ranges.normal.min ?? '<'} to{' '}
                        {selected.ranges.normal.max ?? '>'} {selected.unit}
                      </ThemedText>
                    </View>
                    <ThemedText variant="bodyMuted" style={styles.answer}>
                      {selected.shortAnswer}
                    </ThemedText>
                    <Pressable
                      onPress={() => WebBrowser.openBrowserAsync(`https://medyra.de/lexikon/${selected.slug}`)}
                      style={({ pressed }) => [styles.learnLink, pressed && { opacity: 0.7 }]}
                    >
                      <ThemedText variant="body" style={styles.learnLabel}>
                        {t('check.learnMore', { value: selected.acronym })}
                      </ThemedText>
                      <Ionicons name="open-outline" size={14} color={colors.emeraldDeep} />
                    </Pressable>
                  </>
                ) : (
                  <ThemedText variant="bodyMuted">
                    {t('check.enterValue', { value: selected.acronym, unit: selected.unit })}
                  </ThemedText>
                )}
              </GlassCard>
            )}

            <ThemedText variant="caption" style={styles.rangeNote}>
              {t('check.rangeNote')}
            </ThemedText>
          </>
        )}

        <WellnessDisclaimer />
      </ScrollView>
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
  center: { paddingVertical: spacing.xl, alignItems: 'center' },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  input: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 15, color: colors.text },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  suggestionName: { fontFamily: 'DMSans_600SemiBold' },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  selectedText: { flex: 1, gap: 2 },
  popularWrap: { marginTop: spacing.md, gap: spacing.xs },
  popularRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  popularChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.mint,
  },
  popularLabel: { color: colors.text, fontFamily: 'DMSans_600SemiBold' },
  resultCard: { gap: spacing.sm },
  resultHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  answer: { fontSize: 14, lineHeight: 21 },
  learnLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  learnLabel: { color: colors.emeraldDeep, fontFamily: 'DMSans_600SemiBold', fontSize: 14 },
  rangeNote: { lineHeight: 16 },
});
