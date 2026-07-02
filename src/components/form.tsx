import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { ThemedText } from '@/components/screen';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <ThemedText variant="caption" style={styles.fieldLabel}>
        {label}
      </ThemedText>
      <TextInput
        placeholderTextColor={colors.textFaint}
        style={styles.input}
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [pressed && styles.pressed]}>
      <LinearGradient
        colors={[colors.emerald, colors.emeraldDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.primary, (disabled || loading) && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <ThemedText style={styles.primaryText}>{title}</ThemedText>
        )}
      </LinearGradient>
    </Pressable>
  );
}

export function GhostButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}>
      <ThemedText style={styles.ghostText}>{title}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    marginLeft: spacing.xs,
  },
  input: {
    backgroundColor: colors.glassFill,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  primary: {
    borderRadius: radius.sm,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryText: {
    fontFamily: fonts.bodyBold,
    color: '#ffffff',
    fontSize: 15,
  },
  disabled: {
    opacity: 0.6,
  },
  ghost: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
  },
  ghostText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.85,
  },
});
