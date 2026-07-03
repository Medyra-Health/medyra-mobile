import { useSignUp } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Field, PrimaryButton } from '@/components/form';
import { Screen, ThemedText } from '@/components/screen';
import { SocialAuthButtons } from '@/components/social-auth';
import { spacing } from '@/theme/tokens';

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const { t } = useTranslation();
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
      setError(err?.errors?.[0]?.message ?? t('auth.signUpFailed'));
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
          {!pendingVerification ? (
            <>
              <View style={styles.header}>
                <ThemedText variant="label">Medyra</ThemedText>
                <ThemedText variant="h1">{t('auth.createYourAccount')}</ThemedText>
                <ThemedText variant="bodyMuted">{t('auth.signUpSubtitle')}</ThemedText>
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
              <Field
                label={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
                placeholder={t('auth.choosePassword')}
              />

              {error ? (
                <ThemedText variant="caption" style={styles.error}>
                  {error}
                </ThemedText>
              ) : null}

              <PrimaryButton
                title={t('auth.createAccountCta')}
                onPress={onSignUp}
                loading={loading}
                disabled={!email || !password}
              />

              <View style={styles.footer}>
                <ThemedText variant="bodyMuted">{t('auth.haveAccount')}</ThemedText>
                <Link href="/(auth)/sign-in">
                  <ThemedText style={styles.link}>{t('auth.signIn')}</ThemedText>
                </Link>
              </View>
            </>
          ) : (
            <>
              <View style={styles.header}>
                <ThemedText variant="label">Medyra</ThemedText>
                <ThemedText variant="h1">{t('auth.checkEmail')}</ThemedText>
                <ThemedText variant="bodyMuted">{t('auth.codeSent', { email: email.trim() })}</ThemedText>
              </View>

              <Field
                label={t('auth.verificationCode')}
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

              <PrimaryButton
                title={t('auth.verifyContinue')}
                onPress={onVerify}
                loading={loading}
                disabled={code.trim().length < 4}
              />
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
