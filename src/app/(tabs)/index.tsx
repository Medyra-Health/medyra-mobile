import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
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
import { ReferralCard } from '@/components/referral-card';
import { GlassCard, Screen, ThemedText } from '@/components/screen';
import { ApiError, useApi } from '@/lib/api';
import type { DocType, Report, Subscription } from '@/lib/types';
import { parseExplanation } from '@/lib/types';
import { colors, radius, spacing } from '@/theme/tokens';

type PickedFile = { uri: string; name: string; type: string };

const DOC_TYPES: { id: DocType | 'auto'; labelKey: string }[] = [
  { id: 'auto', labelKey: 'home.docTypeAuto' },
  { id: 'lab', labelKey: 'home.docTypeLab' },
  { id: 'letter', labelKey: 'home.docTypeLetter' },
  { id: 'medication', labelKey: 'home.docTypeMedication' },
  { id: 'insurance', labelKey: 'home.docTypeInsurance' },
];

export default function HomeScreen() {
  const { user } = useUser();
  const api = useApi();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [docType, setDocType] = useState<DocType | 'auto'>('auto');

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
      const result = await api.analyzeReport(file, undefined, {
        docType: docType === 'auto' ? undefined : docType,
        language: i18n.language,
      });
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

          {/* Document type hint, helps the analysis match intent */}
          <View style={styles.docTypeRow}>
            {DOC_TYPES.map(({ id, labelKey }) => {
              const active = docType === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setDocType(id)}
                  disabled={analyzing}
                  style={[styles.docTypeChip, active && styles.docTypeChipActive]}
                >
                  <ThemedText
                    variant="caption"
                    style={[styles.docTypeLabel, active && styles.docTypeLabelActive]}
                  >
                    {t(labelKey)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

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

        {/* Feature grid */}
        <View style={styles.featureRow}>
          {[
            { icon: 'medkit-outline' as const, title: t('features.prep'), desc: t('features.prepDesc'), href: '/(tabs)/prep' as const },
            { icon: 'people-outline' as const, title: t('features.profiles'), desc: t('features.profilesDesc'), href: '/(tabs)/profiles' as const },
            { icon: 'trending-up-outline' as const, title: t('features.trends'), desc: t('features.trendsDesc'), href: '/(tabs)/trends' as const },
            { icon: 'flask-outline' as const, title: t('features.check'), desc: t('features.checkDesc'), href: '/check' as const },
          ].map(({ icon, title, desc, href }) => (
            <Pressable
              key={title}
              onPress={() => router.push(href)}
              style={({ pressed }) => [styles.featureCard, pressed && styles.actionPressed]}
            >
              <Ionicons name={icon} size={20} color={colors.emerald} />
              <ThemedText variant="caption" style={styles.featureTitle}>
                {title}
              </ThemedText>
              <ThemedText variant="caption" style={styles.featureDesc} numberOfLines={2}>
                {desc}
              </ThemedText>
            </Pressable>
          ))}
        </View>

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

        {/* Learn: blog + lexikon */}
        <View style={styles.section}>
          <ThemedText variant="h3">{t('learn.title')}</ThemedText>
          {[
            { icon: 'newspaper-outline' as const, title: t('learn.blog'), desc: t('learn.blogDesc'), url: 'https://medyra.de/blog' },
            { icon: 'book-outline' as const, title: t('learn.lexikon'), desc: t('learn.lexikonDesc'), url: 'https://medyra.de/lexikon' },
          ].map(({ icon, title, desc, url }) => (
            <Pressable
              key={title}
              onPress={() => WebBrowser.openBrowserAsync(url)}
              style={({ pressed }) => pressed && styles.actionPressed}
            >
              <GlassCard style={styles.learnCard}>
                <Ionicons name={icon} size={20} color={colors.emerald} />
                <View style={styles.learnBody}>
                  <ThemedText variant="h3" style={styles.learnTitle}>
                    {title}
                  </ThemedText>
                  <ThemedText variant="caption">{desc}</ThemedText>
                </View>
                <Ionicons name="open-outline" size={16} color={colors.textFaint} />
              </GlassCard>
            </Pressable>
          ))}
        </View>

        {/* Invite friends, both sides get a free report */}
        <ReferralCard />

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
  docTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  docTypeChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.mint,
  },
  docTypeChipActive: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  docTypeLabel: { color: colors.textMuted },
  docTypeLabelActive: { color: '#FFFFFF', fontFamily: 'DMSans_600SemiBold' },
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  featureCard: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: 4,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.surface,
    minHeight: 92,
  },
  featureTitle: { color: colors.text, fontFamily: 'DMSans_600SemiBold', fontSize: 13 },
  featureDesc: { fontSize: 11, lineHeight: 14 },
  learnCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  learnBody: { flex: 1, gap: 2 },
  learnTitle: { fontSize: 15 },
  empty: { marginTop: spacing.xs },
  reportCard: { marginTop: spacing.sm },
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reportBody: { flex: 1, gap: 2 },
  reportName: { fontSize: 15 },
  reportDate: { marginTop: 2 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(247, 251, 249, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  overlayTitle: { marginTop: spacing.md },
});
