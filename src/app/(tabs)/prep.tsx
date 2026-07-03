import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { WellnessDisclaimer } from '@/components/disclaimer';
import { GhostButton, PrimaryButton } from '@/components/form';
import { GlassCard, Screen, ThemedText } from '@/components/screen';
import i18n from '@/i18n';
import { ApiError, useApi } from '@/lib/api';
import type { Profile } from '@/lib/types';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

/** Parses the generated summary (bold headings + bullets) into renderable blocks. */
function parseOutput(text: string) {
  const blocks: { type: 'heading' | 'bullet' | 'text'; text: string }[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('**') || (line.startsWith('#') && line.length < 80)) {
      blocks.push({ type: 'heading', text: line.replace(/[*#]/g, '').trim() });
    } else if (line.startsWith('- ') || line.startsWith('• ') || /^\d+\.\s/.test(line)) {
      blocks.push({ type: 'bullet', text: line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '') });
    } else {
      blocks.push({ type: 'text', text: line });
    }
  }
  return blocks;
}

export default function PrepScreen() {
  const api = useApi();
  const router = useRouter();
  const { t } = useTranslation();

  const [input, setInput] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api
        .getProfiles()
        .then((r) => setProfiles(r.profiles ?? []))
        .catch(() => {});
    }, [api]),
  );

  async function onGenerate() {
    if (input.trim().length < 10) {
      Alert.alert(t('prep.tooShort'));
      return;
    }
    setLoading(true);
    try {
      const result = await api.generatePrep(input.trim(), i18n.language, profileId ?? undefined);
      setOutput(result.output);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        Alert.alert(t('prep.limitTitle'), t('prep.limitBody'), [
          { text: t('home.notNow'), style: 'cancel' },
          { text: t('home.seePlans'), onPress: () => router.push('/paywall') },
        ]);
      } else if (err instanceof ApiError && err.code === 'consent_required') {
        Alert.alert(t('consent.title'), t('consent.intro'));
      } else {
        Alert.alert(t('prep.failed'), err instanceof Error ? err.message : '');
      }
    } finally {
      setLoading(false);
    }
  }

  async function onShare() {
    if (!output) return;
    await Share.share({ message: output });
  }

  if (output) {
    const blocks = parseOutput(output);
    return (
      <Screen style={styles.noPadding}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText variant="h1" style={styles.title}>
            {t('prep.yourSummary')}
          </ThemedText>
          <ThemedText variant="bodyMuted">{t('prep.printNote')}</ThemedText>

          <GlassCard style={styles.outputCard}>
            {blocks.map((b, i) =>
              b.type === 'heading' ? (
                <ThemedText key={i} variant="label" style={styles.outputHeading}>
                  {b.text}
                </ThemedText>
              ) : b.type === 'bullet' ? (
                <View key={i} style={styles.bulletRow}>
                  <ThemedText variant="body" style={styles.bulletDot}>
                    ·
                  </ThemedText>
                  <ThemedText variant="body" style={styles.bulletText}>
                    {b.text}
                  </ThemedText>
                </View>
              ) : (
                <ThemedText key={i} variant="body" style={styles.outputText}>
                  {b.text}
                </ThemedText>
              ),
            )}
          </GlassCard>

          <PrimaryButton title={t('prep.share')} onPress={onShare} />
          <GhostButton
            title={t('prep.newSummary')}
            onPress={() => {
              setOutput(null);
              setInput('');
            }}
          />
          <WellnessDisclaimer />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen style={styles.noPadding}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ThemedText variant="label">Medyra</ThemedText>
          <ThemedText variant="h1" style={styles.title}>
            {t('prep.title')}
          </ThemedText>
          <ThemedText variant="bodyMuted">{t('prep.subtitle')}</ThemedText>

          <View style={styles.inputBlock}>
            <ThemedText variant="caption" style={styles.inputLabel}>
              {t('prep.inputLabel')}
            </ThemedText>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t('prep.inputPlaceholder')}
              placeholderTextColor={colors.textFaint}
              multiline
              textAlignVertical="top"
              style={styles.textarea}
            />
          </View>

          {profiles.length > 0 && (
            <View>
              <ThemedText variant="caption" style={styles.inputLabel}>
                {t('prep.profileLabel')}
              </ThemedText>
              <View style={styles.chips}>
                <Pressable
                  onPress={() => setProfileId(null)}
                  style={[styles.chip, profileId === null && styles.chipActive]}
                >
                  <ThemedText variant="caption" style={profileId === null ? styles.chipTextActive : undefined}>
                    {t('prep.noProfile')}
                  </ThemedText>
                </Pressable>
                {profiles.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => setProfileId(p.id)}
                    style={[styles.chip, profileId === p.id && styles.chipActive]}
                  >
                    <ThemedText variant="caption" style={profileId === p.id ? styles.chipTextActive : undefined}>
                      {p.name}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <PrimaryButton
            title={t('prep.generate')}
            onPress={onGenerate}
            loading={loading}
            disabled={input.trim().length < 10}
          />
          <WellnessDisclaimer />
        </ScrollView>
      </KeyboardAvoidingView>

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.emerald} />
          <ThemedText variant="h3" style={styles.overlayTitle}>
            {t('prep.generating')}
          </ThemedText>
          <ThemedText variant="bodyMuted">{t('home.analyzingSub')}</ThemedText>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  title: { fontSize: 28, lineHeight: 34 },
  inputBlock: { marginTop: spacing.sm },
  inputLabel: { marginBottom: spacing.sm },
  textarea: {
    backgroundColor: colors.surface,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
    minHeight: 140,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  chipTextActive: { color: '#FFFFFF' },
  outputCard: { gap: spacing.xs, padding: spacing.lg },
  outputHeading: { marginTop: spacing.sm },
  outputText: { fontSize: 14, lineHeight: 21 },
  bulletRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  bulletDot: { fontSize: 14, lineHeight: 21 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 21 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(247, 251, 249, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  overlayTitle: { marginTop: spacing.md },
});
