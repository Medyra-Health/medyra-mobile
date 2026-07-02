import { StyleSheet, View } from 'react-native';

import { GlassCard, Screen, ThemedText } from '@/components/screen';
import { spacing } from '@/theme/tokens';

export default function HomeScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText variant="label">Medyra</ThemedText>
        <ThemedText variant="h1" style={styles.title}>
          Your health data,{'\n'}finally clear.
        </ThemedText>
      </View>
      <GlassCard>
        <ThemedText variant="bodyMuted">
          Document upload arrives in Phase 2.
        </ThemedText>
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    marginTop: spacing.xs,
  },
});
