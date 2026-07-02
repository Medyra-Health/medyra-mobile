import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/screen';
import { colors, radius, spacing } from '@/theme/tokens';

/** Wellness disclaimer. Shown on every analysis screen. Copy mirrors the web legal notice. */
export function WellnessDisclaimer() {
  return (
    <View style={styles.box}>
      <Ionicons name="shield-outline" size={14} color={colors.textFaint} style={styles.icon} />
      <ThemedText variant="caption" style={styles.text}>
        Medyra is an educational tool that explains medical terminology: it does not provide
        medical advice, diagnoses, or treatment recommendations. Always consult your licensed
        physician before making any health decisions. Your data is handled in compliance with GDPR
        and automatically deleted after 30 days.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.glassFill,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  icon: { marginTop: 2 },
  text: { flex: 1, lineHeight: 17 },
});
