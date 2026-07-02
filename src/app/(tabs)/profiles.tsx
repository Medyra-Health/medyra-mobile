import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Field, GhostButton, PrimaryButton } from '@/components/form';
import { GlassCard, Screen, ThemedText } from '@/components/screen';
import { ApiError, useApi } from '@/lib/api';
import type { Profile, Subscription } from '@/lib/types';
import { colors, radius, spacing } from '@/theme/tokens';

const PROFILE_COLORS = ['#10B981', '#2DD4BF', '#34D399', '#6EE7B7', '#5EEAD4'];
const RELATIONSHIPS = ['Me', 'Partner', 'Child', 'Parent', 'Other'];

export default function ProfilesScreen() {
  const api = useApi();
  const router = useRouter();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Me');
  const [color, setColor] = useState(PROFILE_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [prof, sub] = await Promise.all([api.getProfiles(), api.getSubscription()]);
      setProfiles(prof.profiles ?? []);
      setCanCreate(prof.canCreate);
      setSubscription(sub);
    } catch {
      // pull to refresh retries
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function openCreate() {
    setEditing(null);
    setName('');
    setRelationship('Me');
    setColor(PROFILE_COLORS[0]);
    setModalVisible(true);
  }

  function openEdit(p: Profile) {
    setEditing(p);
    setName(p.name);
    setRelationship(p.relationship || 'Me');
    setColor(p.color || PROFILE_COLORS[0]);
    setModalVisible(true);
  }

  async function onSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.updateProfile(editing.id, { name: name.trim(), relationship, color });
      } else {
        await api.createProfile({ name: name.trim(), relationship, color });
      }
      setModalVisible(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError && (err.status === 403 || err.status === 429)) {
        setModalVisible(false);
        router.push('/paywall');
      } else {
        Alert.alert('Could not save profile', err instanceof Error ? err.message : 'Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  function onDelete(p: Profile) {
    Alert.alert(
      'Delete profile',
      `Delete ${p.name} and its tracked values? Reports stay until they expire.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteProfile(p.id);
              await load();
            } catch (err) {
              Alert.alert('Could not delete', err instanceof Error ? err.message : 'Please try again.');
            }
          },
        },
      ],
    );
  }

  const isFree = subscription?.tier === 'free';

  return (
    <Screen style={styles.noPadding}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.emerald} />}
      >
        <View style={styles.headerRow}>
          <View>
            <ThemedText variant="h1" style={styles.title}>
              Profiles
            </ThemedText>
            <ThemedText variant="bodyMuted">Health history for you and your family</ThemedText>
          </View>
          {canCreate && (
            <Pressable onPress={openCreate} style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}>
              <Ionicons name="add" size={22} color="#ffffff" />
            </Pressable>
          )}
        </View>

        {isFree ? (
          <GlassCard style={styles.upsell}>
            <Ionicons name="lock-closed-outline" size={22} color={colors.emerald} />
            <ThemedText variant="h3" style={styles.upsellTitle}>
              Health profiles are part of Personal and Family
            </ThemedText>
            <ThemedText variant="bodyMuted" style={styles.upsellBody}>
              Track lab values over time for yourself and your family, and see trends across
              reports.
            </ThemedText>
            <PrimaryButton title="See plans" onPress={() => router.push('/paywall')} />
          </GlassCard>
        ) : profiles.length === 0 ? (
          <GlassCard>
            <ThemedText variant="bodyMuted">
              No profiles yet. Create one to start tracking values across reports.
            </ThemedText>
          </GlassCard>
        ) : (
          profiles.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => router.push({ pathname: '/profile/[id]', params: { id: p.id } })}
              onLongPress={() => onDelete(p)}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <GlassCard style={styles.profileCard}>
                <View style={[styles.avatar, { backgroundColor: p.color || colors.emerald }]}>
                  <ThemedText style={styles.avatarLetter}>{p.name.charAt(0).toUpperCase()}</ThemedText>
                </View>
                <View style={styles.profileBody}>
                  <ThemedText variant="h3">{p.name}</ThemedText>
                  <ThemedText variant="caption">
                    {p.relationship || 'Profile'} · {(p.biomarkers ?? []).length} tracked values
                  </ThemedText>
                </View>
                <Pressable onPress={() => openEdit(p)} hitSlop={10}>
                  <Ionicons name="pencil-outline" size={16} color={colors.textFaint} />
                </Pressable>
                <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
              </GlassCard>
            </Pressable>
          ))
        )}

        {!isFree && (
          <ThemedText variant="caption" style={styles.hint}>
            Tip: long press a profile to delete it.
          </ThemedText>
        )}
      </ScrollView>

      {/* Create / edit modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <ThemedText variant="h2" style={styles.sheetTitle}>
              {editing ? 'Edit profile' : 'New profile'}
            </ThemedText>

            <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. Emma" autoCapitalize="words" />

            <ThemedText variant="caption" style={styles.groupLabel}>
              Relationship
            </ThemedText>
            <View style={styles.chips}>
              {RELATIONSHIPS.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRelationship(r)}
                  style={[styles.chip, relationship === r && styles.chipActive]}
                >
                  <ThemedText variant="caption" style={relationship === r ? styles.chipTextActive : undefined}>
                    {r}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <ThemedText variant="caption" style={styles.groupLabel}>
              Color
            </ThemedText>
            <View style={styles.chips}>
              {PROFILE_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchActive]}
                />
              ))}
            </View>

            <View style={styles.sheetActions}>
              <PrimaryButton
                title={editing ? 'Save changes' : 'Create profile'}
                onPress={onSave}
                loading={saving}
                disabled={!name.trim()}
              />
              <GhostButton title="Cancel" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: { padding: 0 },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 28, lineHeight: 34 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
  upsell: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  upsellTitle: { textAlign: 'center' },
  upsellBody: { textAlign: 'center', marginBottom: spacing.sm },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#04120C', fontSize: 16, fontWeight: '700' },
  profileBody: { flex: 1, gap: 2 },
  hint: { textAlign: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderColor: colors.glassBorderStrong,
    borderWidth: 1,
    padding: spacing.lg,
  },
  sheetTitle: { marginBottom: spacing.lg },
  groupLabel: { marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.glassBorderStrong,
  },
  chipActive: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  chipTextActive: { color: '#04120C' },
  swatch: { width: 34, height: 34, borderRadius: 17 },
  swatchActive: { borderWidth: 3, borderColor: colors.text },
  sheetActions: { gap: spacing.sm, marginTop: spacing.sm },
});
