import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { GlassCard, ThemedText } from '@/components/screen';
import { useApi } from '@/lib/api';
import type { Referral } from '@/lib/types';
import { colors, radius, spacing } from '@/theme/tokens';

/**
 * Invite card: share a personal link, inviter and invited each get one extra
 * free report per month. The link is claimed on the website during signup.
 */
export function ReferralCard() {
  const api = useApi();
  const { t } = useTranslation();
  const [referral, setReferral] = useState<Referral | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .getReferral()
      .then((r) => {
        if (alive && r.code) setReferral(r);
      })
      .catch(() => {
        // card simply stays hidden
      });
    return () => {
      alive = false;
    };
  }, [api]);

  if (!referral) return null;

  const link = `https://medyra.de/?ref=${referral.code}`;

  async function onShare() {
    await Share.share({ message: `${t('referral.shareText')} ${link}` });
  }

  return (
    <GlassCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="gift-outline" size={18} color="#FFFFFF" />
        </View>
        <ThemedText variant="label">{t('referral.title')}</ThemedText>
      </View>
      <ThemedText variant="bodyMuted" style={styles.body}>
        {t('referral.description')}
      </ThemedText>
      <Pressable onPress={onShare} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
        <ThemedText variant="body" style={styles.buttonLabel}>
          {t('referral.shareButton')}
        </ThemedText>
      </Pressable>
      {(referral.referredCount > 0 || referral.bonusReports > 0) && (
        <ThemedText variant="caption" style={styles.stats}>
          {t('referral.stats', { count: referral.referredCount, bonus: referral.bonusReports })}
        </ThemedText>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, borderColor: colors.glassBorderStrong },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.sm - 4,
    backgroundColor: colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { fontSize: 14, lineHeight: 20 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.emerald,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm + 2,
  },
  pressed: { opacity: 0.8 },
  buttonLabel: { color: '#FFFFFF', fontFamily: 'DMSans_600SemiBold', fontSize: 14 },
  stats: { color: colors.emeraldDeep, fontFamily: 'DMSans_600SemiBold' },
});
