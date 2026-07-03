import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ConsentModal } from '@/components/consent-modal';
import { WellnessDisclaimer } from '@/components/disclaimer';
import { GlassCard, Screen, ThemedText } from '@/components/screen';
import { ApiError, useApi } from '@/lib/api';
import type { Report, Subscription } from '@/lib/types';
import { parseExplanation } from '@/lib/types';
import { colors, radius, spacing } from '@/theme/tokens';

type PickedFile = { uri: string; name: string; type: string };

export default function HomeScreen() {
  const { user } = useUser();
  const api = useApi();
  const router = useRouter();
  const { t } = useTranslation();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [consentVisible, setConsentVisible] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);
  const [pendingFile, setPendingFile] = useState<PickedFile | null>(null);

  const load = useCallback(async () => {
    try {
      const [sub, reps] = await Promise.all([api.getSubscription(), api.getReports()]);
      setSubscription(sub);
      setReports(reps.reports ?? []);
    } catch {
      // keep the last known state; pull to refresh retries
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function analyze(file: PickedFile) {
    setAnalyzing(true);
    try {
      const result = await api.analyzeReport(file);
      setPendingFile(null);
      await load();
      router.push({ pathname: '/report/[id]', params: { id: result.reportId } });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'consent_required') {
        setPendingFile(file);
        setConsentVisible(true);
      } else if (err instanceof ApiError && err.status === 429) {
        Alert.alert(t('home.limitTitle'), t('home.limitBody'), [
          { text: t('home.notNow'), style: 'cancel' },
          { text: t('home.seePlans'), onPress: () => router.push('/paywall') },
        ]);
      } else {
        Alert.alert(t('home.analysisFailed'), err instanceof Error ? err.message : t('home.tryAgain'));
      }
    } finally {
      setAnalyzing(false);
    }
  }

  async function onGrantConsent() {
    setConsentLoading(true);
    try {
      await api.grantConsent();
      setConsentVisible(false);
      if (pendingFile) {
        const file = pendingFile;
        setPendingFile(null);
        await analyze(file);
      }
    } catch {
      Alert.alert(t('home.analysisFailed'), t('home.tryAgain'));
    } finally {
      setConsentLoading(false);
    }
  }

  async function pickFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('home.cameraNeeded'), t('home.cameraNeededBody'));
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    const asset = res.assets?.[0];
    if (res.canceled || !asset) return;
    await analyze({
      uri: asset.uri,
      name: asset.fileName ?? 'photo.jpg',
      type: asset.mimeType ?? 'image/jpeg',
    });
  }

  async function pickFromLibrary() {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    const asset = res.assets?.[0];
    if (res.canceled || !asset) return;
    await analyze({
      uri: asset.uri,
      name: asset.fileName ?? 'photo.jpg',
      type: asset.mimeType ?? 'image/jpeg',
    });
  }

  async function pickDocument() {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'text/plain'],
      copyToCacheDirectory: true,
    });
    const asset = res.assets?.[0];
    if (res.canceled || !asset) return;
    await analyze({
      uri: asset.uri,
      name: asset.name ?? 'document.pdf',
      type: asset.mimeType ?? 'application/pdf',
    });
  }

  const firstName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0];

  return (
    <Screen style={styles.noPadding}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.emerald} />}
      >
        <View style={styles.header}>
          <ThemedText variant="label">Medyra</ThemedText>
          <ThemedText variant="h1">
            {t('home.hello')}
            {firstName ? `, ${firstName}` : ''}
          </ThemedText>
          {subscription && (
            <ThemedText variant="bodyMuted">
              {subscription.tier === 'free'
                ? t('home.freeLeft', { remaining: subscription.remaining, limit: subscription.usageLimit })
                : t('home.plan', {
                    tier: `${subscription.tier.charAt(0).toUpperCase()}${subscription.tier.slice(1)}`,
                  })}
            </ThemedText>
          )}
        </View>

        {/* Upload actions */}
        <GlassCard style={styles.uploadCard}>
          <ThemedText variant="h3" style={styles.uploadTitle}>
            {t('home.uploadTitle')}
          </ThemedText>
          <ThemedText variant="caption" style={styles.uploadSub}>
            {t('home.uploadSubtitle')}
          </ThemedText>
          <View style={styles.actionsRow}>
            {[
              { icon: 'camera-outline' as const, label: t('home.camera'), onPress: pickFromCamera },
              { icon: 'images-outline' as const, label: t('home.photos'), onPress: pickFromLibrary },
              { icon: 'document-outline' as const, label: t('home.files'), onPress: pickDocument },
            ].map(({ icon, label, onPress }) => (
              <Pressable
                key={label}
                onPress={onPress}
                disabled={analyzing}
                style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
              >
                <Ionicons name={icon} size={24} color={colors.emerald} />
                <ThemedText variant="caption" style={styles.actionLabel}>
                  {label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </GlassCard>

        {/* Recent reports */}
        <View style={styles.section}>
          <ThemedText variant="h3">{t('home.recentReports')}</ThemedText>
          {reports.length === 0 ? (
            <ThemedText variant="bodyMuted" style={styles.empty}>
              {t('home.emptyReports')}
            </ThemedText>
          ) : (
            reports.slice(0, 10).map((r) => {
              const exp = parseExplanation(r.explanation);
              return (
                <Pressable
                  key={r.id}
                  onPress={() => router.push({ pathname: '/report/[id]', params: { id: r.id } })}
                  style={({ pressed }) => pressed && styles.actionPressed}
                >
                  <GlassCard style={styles.reportCard}>
                    <View style={styles.reportRow}>
                      <View style={styles.reportBody}>
                        <ThemedText variant="h3" numberOfLines={1} style={styles.reportName}>
                          {r.fileName}
                        </ThemedText>
                        <ThemedText variant="caption" numberOfLines={2}>
                          {exp.inShort || exp.summary}
                        </ThemedText>
                        <ThemedText variant="caption" style={styles.reportDate}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                    </View>
                  </GlassCard>
                </Pressable>
              );
            })
          )}
        </View>

        <WellnessDisclaimer />
      </ScrollView>

      {/* Analyzing overlay */}
      {analyzing && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.emerald} />
          <ThemedText variant="h3" style={styles.overlayTitle}>
            {t('home.analyzing')}
          </ThemedText>
          <ThemedText variant="bodyMuted">{t('home.analyzingSub')}</ThemedText>
        </View>
      )}

      <ConsentModal
        visible={consentVisible}
        loading={consentLoading}
        onAccept={onGrantConsent}
        onDecline={() => {
          setConsentVisible(false);
          setPendingFile(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  header: { gap: spacing.xs },
  uploadCard: { padding: spacing.lg },
  uploadTitle: { marginBottom: 2 },
  uploadSub: { marginBottom: spacing.md },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
    backgroundColor: colors.glassFill,
    minHeight: 76,
    justifyContent: 'center',
  },
  actionPressed: { opacity: 0.7 },
  actionLabel: { color: colors.text },
  section: { gap: spacing.sm },
  empty: { marginTop: spacing.xs },
  reportCard: { marginTop: spacing.sm },
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reportBody: { flex: 1, gap: 2 },
  reportName: { fontSize: 15 },
  reportDate: { marginTop: 2 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 12, 8, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  overlayTitle: { marginTop: spacing.md },
});
