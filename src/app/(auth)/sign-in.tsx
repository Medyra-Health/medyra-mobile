import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Field, PrimaryButton } from '@/components/form';
import { Screen, ThemedText } from '@/components/screen';
import { SocialAuthButtons } from '@/components/social-auth';
import { spacing } from '@/theme/tokens';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codeMode, setCodeMode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
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
        setError(t('auth.signInFailed'));
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? t('auth.signInFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function onSendCode() {
    if (!isLoaded || loading) return;
    setError(null);
    setLoading(true);
    try {
      const attempt = await signIn.create({ identifier: email.trim() });
      const factor = attempt.supportedFirstFactors?.find((f) => f.strategy === 'email_code');
      if (!factor || !('emailAddressId' in factor)) {
        setError(t('auth.signInFailed'));
        return;
      }
      await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: factor.emailAddressId });
      setCodeSent(true);
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? t('auth.signInFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyCode() {
    if (!isLoaded || loading) return;
    setError(null);
    setLoading(true);
    try {
      const attempt = await signIn.attemptFirstFactor({ strategy: 'email_code', code: code.trim() });
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        router.replace('/(tabs)');
      } else {
        setError(t('auth.invalidCode'));
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
            <ThemedText variant="h1">{t('auth.welcomeBack')}</ThemedText>
            <ThemedText variant="bodyMuted">{t('auth.signInSubtitle')}</ThemedText>
          </View>

          <SocialAuthButtons onError={setError} />

          <Field
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@example.com"
          />

          {codeMode ? (
            codeSent ? (
              <Field
                label={t('auth.verificationCode')}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                placeholder="000000"
              />
            ) : null
          ) : (
            <>
              <Field
                label={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="current-password"
                placeholder={t('auth.passwordPlaceholder')}
              />

              <View style={styles.forgotRow}>
                <Link href="/(auth)/forgot-password">
                  <ThemedText variant="caption" style={styles.link}>
                    {t('auth.forgotPassword')}
                  </ThemedText>
                </Link>
              </View>
            </>
          )}

          {error ? (
            <ThemedText variant="caption" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}

          {codeMode ? (
            codeSent ? (
              <PrimaryButton title={t('auth.verifyContinue')} onPress={onVerifyCode} loading={loading} disabled={!code.trim()} />
            ) : (
              <PrimaryButton title={t('auth.sendSignInCode')} onPress={onSendCode} loading={loading} disabled={!email.trim()} />
            )
          ) : (
            <PrimaryButton title={t('auth.signIn')} onPress={onSignIn} loading={loading} disabled={!email || !password} />
          )}

          <View style={styles.footer}>
            <ThemedText
              style={styles.link}
              onPress={() => {
                setCodeMode(!codeMode);
                setCodeSent(false);
                setCode('');
                setError(null);
              }}
            >
              {codeMode ? t('auth.usePasswordInstead') : t('auth.useCodeInstead')}
            </ThemedText>
          </View>

          <View style={styles.footer}>
            <ThemedText variant="bodyMuted">{t('auth.newHere')}</ThemedText>
            <Link href="/(auth)/sign-up">
              <ThemedText style={styles.link}>{t('auth.createAccount')}</ThemedText>
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
  forgotRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md },
  link: { color: '#34D399' },
});
