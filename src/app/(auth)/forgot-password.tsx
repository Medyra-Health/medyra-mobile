import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Field, PrimaryButton } from '@/components/form';
import { Screen, ThemedText } from '@/components/screen';
import { spacing } from '@/theme/tokens';

export default function ForgotPasswordScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSendCode() {
    if (!isLoaded || loading) return;
    setError(null);
    setLoading(true);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email.trim(),
      });
      setCodeSent(true);
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? t('auth.resetFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function onReset() {
    if (!isLoaded || loading) return;
    setError(null);
    if (password.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    setLoading(true);
    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: code.trim(),
        password,
      });
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        router.replace('/(tabs)');
      } else {
        setError(t('auth.resetFailed'));
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? t('auth.invalidCode'));
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
            <ThemedText variant="h1">{t('auth.resetTitle')}</ThemedText>
            <ThemedText variant="bodyMuted">
              {codeSent ? t('auth.codeSent', { email: email.trim() }) : t('auth.resetSubtitle')}
            </ThemedText>
          </View>

          {!codeSent ? (
            <>
              <Field
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
                placeholder="you@example.com"
              />
              <PrimaryButton
                title={t('auth.sendCode')}
                onPress={onSendCode}
                loading={loading}
                disabled={!email.trim()}
              />
            </>
          ) : (
            <>
              <Field
                label={t('auth.verificationCode')}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                placeholder="000000"
              />
              <Field
                label={t('auth.newPassword')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
                placeholder={t('auth.passwordPlaceholder')}
              />
              <PrimaryButton
                title={t('auth.resetCta')}
                onPress={onReset}
                loading={loading}
                disabled={!code.trim() || !password}
              />
            </>
          )}

          {error ? (
            <ThemedText variant="caption" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}

          <View style={styles.footer}>
            <Link href="/(auth)/sign-in">
              <ThemedText style={styles.link}>{t('auth.backToSignIn')}</ThemedText>
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
  error: { color: '#F87171', marginTop: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  link: { color: '#34D399' },
});
