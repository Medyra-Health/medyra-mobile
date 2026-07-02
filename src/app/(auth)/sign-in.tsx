import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Field, PrimaryButton } from '@/components/form';
import { Screen, ThemedText } from '@/components/screen';
import { spacing } from '@/theme/tokens';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSignIn() {
    if (!isLoaded || loading) return;
    setError(null);
    setLoading(true);
    try {
      const attempt = await signIn.create({ identifier: email.trim(), password });
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        router.replace('/(tabs)');
      } else {
        setError('We could not complete the sign in. Please try again.');
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? 'Sign in failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <ThemedText variant="label">Medyra</ThemedText>
            <ThemedText variant="h1">Welcome back</ThemedText>
            <ThemedText variant="bodyMuted">Sign in with your Medyra account.</ThemedText>
          </View>

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            placeholder="Your password"
          />

          {error ? (
            <ThemedText variant="caption" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}

          <PrimaryButton title="Sign in" onPress={onSignIn} loading={loading} disabled={!email || !password} />

          <View style={styles.footer}>
            <ThemedText variant="bodyMuted">New to Medyra? </ThemedText>
            <Link href="/(auth)/sign-up">
              <ThemedText style={styles.link}>Create an account</ThemedText>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.xl },
  header: { gap: spacing.sm, marginBottom: spacing.xl },
  error: { color: '#F87171', marginBottom: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  link: { color: '#34D399' },
});
