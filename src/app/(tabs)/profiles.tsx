import { GlassCard, Screen, ThemedText } from '@/components/screen';
import { spacing } from '@/theme/tokens';

export default function ProfilesScreen() {
  return (
    <Screen>
      <ThemedText variant="h2" style={{ marginBottom: spacing.lg }}>
        Profiles
      </ThemedText>
      <GlassCard>
        <ThemedText variant="bodyMuted">Health Profiles arrive in Phase 3.</ThemedText>
      </GlassCard>
    </Screen>
  );
}
