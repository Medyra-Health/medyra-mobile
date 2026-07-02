import { GlassCard, Screen, ThemedText } from '@/components/screen';
import { spacing } from '@/theme/tokens';

export default function TrendsScreen() {
  return (
    <Screen>
      <ThemedText variant="h2" style={{ marginBottom: spacing.lg }}>
        Trends
      </ThemedText>
      <GlassCard>
        <ThemedText variant="bodyMuted">Lab value trends arrive in Phase 4.</ThemedText>
      </GlassCard>
    </Screen>
  );
}
