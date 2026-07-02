import { useSignUp } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Field, PrimaryButton } from '@/components/form';
import { Screen, ThemedText } from '@/components/screen';
import { spacing } from '@/theme/tokens';

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSignUp() {
    if (!isLoaded || loading) return;
    setError(null);
    setLoading(true);
    try {
      await signUp.create({ emailAddress: email.trim(), password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function onVerify() {
    if (!isLoaded || loading) return;
    setError(null);
    setLoading(true);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        router.replace('/(tabs)');
      } else {
        setError('Verification did not complete. Please try again.');
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {!pendingVerification ? (
            <>
              <View style={styles.header}>
                <ThemedText variant="label">Medyra</ThemedText>
                <ThemedText variant="h1">Create your account</ThemedText>
                <ThemedText variant="bodyMuted">
                  One account for web and mobile. 3 free reports per month.
                </ThemedText>
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
                autoComplete="new-password"
                placeholder="Choose a password"
              />

              {error ? (
                <ThemedText variant="caption" style={styles.error}>
                  {error}
                </ThemedText>
              ) : null}

              <PrimaryButton title="Create account" onPress={onSignUp} loading={loading} disabled={!email || !password} />

              <View style={styles.footer}>
                <ThemedText variant="bodyMuted">Already have an account? </ThemedText>
                <Link href="/(auth)/sign-in">
                  <ThemedText style={styles.link}>Sign in</ThemedText>
                </Link>
              </View>
            </>
          ) : (
            <>
              <View style={styles.header}>
                <ThemedText variant="label">Medyra</ThemedText>
                <ThemedText variant="h1">Check your email</ThemedText>
                <ThemedText variant="bodyMuted">We sent a verification code to {email.trim()}.</ThemedText>
              </View>

              <Field
                label="Verification code"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                placeholder="123456"
              />

              {error ? (
                <ThemedText variant="caption" style={styles.error}>
                  {error}
                </ThemedText>
              ) : null}

              <PrimaryButton title="Verify and continue" onPress={onVerify} loading={loading} disabled={code.trim().length < 4} />
            </>
          )}
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
