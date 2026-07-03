import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GhostButton, PrimaryButton } from '@/components/form';
import { ThemedText } from '@/components/screen';
import { colors, radius, spacing } from '@/theme/tokens';

const POINTS: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }[] = [
  {
    icon: 'eye-outline',
    title: 'What we process',
    desc: 'The text content of your uploaded medical report (lab values, test names, dates). We do not store the original file.',
  },
  {
    icon: 'lock-closed-outline',
    title: 'Who can see your data',
    desc: 'Only you. Your data is encrypted in transit and at rest. It is never shared with third parties, insurers, or employers.',
  },
  {
    icon: 'trash-outline',
    title: 'Automatic deletion',
    desc: 'Your reports are automatically and permanently deleted after 30 days.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'AI processing disclosure',
    desc: "Your report text is sent to Anthropic's Claude AI (USA/EU) for analysis. Anthropic does not train on your data. This is disclosed under GDPR Art. 13 and the EU AI Act.",
  },
];

export function ConsentModal({
  visible,
  onAccept,
  onDecline,
  loading,
}: {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
  loading?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onDecline}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <ThemedText variant="h2">{t('consent.title')}</ThemedText>
            <ThemedText variant="caption" style={styles.subtitle}>
              {t('consent.subtitle')}
            </ThemedText>

            <ThemedText variant="bodyMuted" style={styles.intro}>
              {t('consent.intro')}
            </ThemedText>

            {POINTS.map(({ icon, title, desc }) => (
              <View key={title} style={styles.point}>
                <View style={styles.pointIcon}>
                  <Ionicons name={icon} size={16} color={colors.emerald} />
                </View>
                <View style={styles.pointBody}>
                  <ThemedText variant="h3" style={styles.pointTitle}>
                    {title}
                  </ThemedText>
                  <ThemedText variant="caption" style={styles.pointDesc}>
                    {desc}
                  </ThemedText>
                </View>
              </View>
            ))}

            <Pressable onPress={() => setExpanded((e) => !e)} style={styles.expandRow}>
              <ThemedText variant="caption">
                Full details (data processors, legal basis, your rights)
              </ThemedText>
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textFaint} />
            </Pressable>

            {expanded && (
              <View style={styles.details}>
                <ThemedText variant="caption" style={styles.detailBlock}>
                  Legal basis: GDPR Art. 9(2)(a), explicit consent for processing special category
                  health data. You may withdraw consent at any time by deleting your account or
                  emailing privacy@medyra.de.
                </ThemedText>
                <ThemedText variant="caption" style={styles.detailBlock}>
                  Data processors: Anthropic (Claude AI, report text analysis, USA with SCCs),
                  MongoDB Atlas (encrypted storage, EU Frankfurt), Clerk (authentication only, USA
                  with SCCs), Vercel (hosting, EU edge).
                </ThemedText>
                <ThemedText variant="caption" style={styles.detailBlock}>
                  Your rights under GDPR: access, correction, deletion, restriction, portability,
                  objection, and withdrawal of consent at any time. Contact: privacy@medyra.de.
                  Supervisory authority: Landesbeauftragter fuer Datenschutz Baden-Wuerttemberg.
                </ThemedText>
              </View>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <PrimaryButton title={t('consent.accept')} onPress={onAccept} loading={loading} />
            <GhostButton title={t('consent.decline')} onPress={onDecline} />
            <ThemedText variant="caption" style={styles.footnote}>
              {t('consent.footnote')}
            </ThemedText>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderColor: colors.glassBorderStrong,
    borderWidth: 1,
    maxHeight: '88%',
  },
  scroll: { padding: spacing.lg },
  subtitle: { color: colors.emerald, marginTop: spacing.xs, marginBottom: spacing.md },
  intro: { marginBottom: spacing.lg },
  point: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  pointIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.glassFill,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointBody: { flex: 1 },
  pointTitle: { fontSize: 14, lineHeight: 20 },
  pointDesc: { marginTop: 2 },
  expandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopColor: colors.glassBorder,
    borderTopWidth: 1,
  },
  details: {
    backgroundColor: colors.glassFill,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: spacing.sm,
  },
  detailBlock: { lineHeight: 18 },
  actions: { padding: spacing.lg, gap: spacing.sm },
  footnote: { textAlign: 'center', marginTop: spacing.xs },
});
