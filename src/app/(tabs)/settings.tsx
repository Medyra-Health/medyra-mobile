import { GlassCard, Screen, ThemedText } from '@/components/screen';
import { spacing } from '@/theme/tokens';

export default function SettingsScreen() {
  return (
    <Screen>
      <ThemedText variant="h2" style={{ marginBottom: spacing.lg }}>
        Settings
      </ThemedText>
      <GlassCard>
        <ThemedText variant="bodyMuted">Language, account, and legal arrive in Phase 6.</ThemedText>
      </GlassCard>
    </Screen>
  );
}
