import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { useSession } from '@/core/session/session-store';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { Icon, Screen, Text, initialsOf } from '@/ui';

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.between}>
      <Text tone="muted" style={styles.rowLabel}>
        {label}
      </Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function ProfileScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const user = useSession((s) => s.user);
  const [photo, setPhoto] = useState<string>();

  if (!user) return null;

  // The picked photo is held in memory for this session only; there is no upload endpoint yet.
  const changePhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!res.canceled) setPhoto(res.assets[0].uri);
  };

  const card = [styles.card, { backgroundColor: colors.card, borderColor: colors.line }];

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.titleRow}>
        <Text variant="title">{t('profile.title')}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('profile.settings')}
          onPress={() => router.push('/settings')}
          style={[styles.gear, { backgroundColor: colors.card, borderColor: colors.line }]}>
          <Icon name="settings-outline" size={22} />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View>
          <View style={[styles.avatar, { backgroundColor: colors.map }]}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photo} />
            ) : (
              <Text style={[styles.initials, { color: colors.infoFg }]}>{initialsOf(user.name)}</Text>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.changePhoto')}
            onPress={() => void changePhoto()}
            style={[styles.camera, { backgroundColor: colors.primary, borderColor: colors.bg }]}>
            <Icon name="camera" size={18} tone="onPrimary" />
          </Pressable>
        </View>
        <Text variant="hero" style={styles.name}>
          {user.name}
        </Text>
        <Text tone="muted">{user.title}</Text>
        <View style={[styles.idPill, { backgroundColor: colors.infoBg }]}>
          <Text variant="small" tone="infoFg">
            {t('profile.idPill', { id: user.employeeId })}
          </Text>
        </View>
      </View>

      <View style={card}>
        <Row label={t('profile.branch')} value={user.branch} />
        <View style={[styles.divider, { backgroundColor: colors.soft }]} />
        <Text variant="small" tone="muted">
          {t('profile.sites')}
        </Text>
        <View style={styles.chips}>
          {user.siteNames.map((s) => (
            <View key={s} style={[styles.chip, { backgroundColor: colors.soft }]}>
              <Text variant="caption" style={styles.chipLabel}>
                {s}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={card}>
        <Text variant="small" tone="muted">
          {t('profile.manager')}
        </Text>
        <View style={styles.managerRow}>
          <View style={[styles.managerAvatar, { backgroundColor: colors.soft }]}>
            <Text style={[styles.managerInitials, { color: colors.infoFg }]}>{initialsOf(user.managerName)}</Text>
          </View>
          <View style={styles.flex}>
            <Text variant="subheading" style={styles.managerName}>
              {user.managerName}
            </Text>
            <Text variant="caption" tone="muted">
              {t('profile.siteManager')}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.callManager')}
            onPress={() => void Linking.openURL(`tel:${user.managerPhone}`)}
            style={[styles.round, { backgroundColor: colors.primary }]}>
            <Icon name="call" size={18} tone="onPrimary" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.messageManager')}
            onPress={() => void Linking.openURL(`sms:${user.managerPhone}`)}
            style={[styles.round, styles.roundOutline, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <Icon name="chatbubble-ellipses-outline" size={18} tone="primary" />
          </Pressable>
        </View>
      </View>

      <View style={card}>
        <View style={styles.between}>
          <Text variant="small" tone="muted">
            {t('profile.contactDetails')}
          </Text>
          <View style={styles.lock}>
            <Icon name="lock-closed" size={12} tone="muted" />
            <Text variant="label" tone="muted" style={styles.lockLabel}>
              {t('profile.readOnlyBadge')}
            </Text>
          </View>
        </View>
        <Row label={t('profile.phone')} value={user.phone} />
        <Row label={t('profile.email')} value={user.email} />
        <View style={[styles.hint, { backgroundColor: colors.bg }]}>
          <Text variant="small" tone="muted" style={styles.hintText}>
            {t('profile.contactHint')}
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gear: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', gap: 6 },
  avatar: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photo: { width: 96, height: 96 },
  initials: { fontSize: 34, fontWeight: '800' },
  camera: { position: 'absolute', right: -2, bottom: -2, width: 44, height: 44, borderRadius: 22, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  name: { marginTop: 6 },
  idPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill },
  card: { borderWidth: 1, borderRadius: radius.row, padding: 14, gap: 10 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  rowLabel: { fontSize: 15 },
  rowValue: { fontSize: 15, fontWeight: '800', flexShrink: 1, textAlign: 'right' },
  divider: { height: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  chipLabel: { fontWeight: '700' },
  managerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  managerAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  managerInitials: { fontWeight: '800' },
  managerName: { fontWeight: '800' },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  roundOutline: { borderWidth: 1.5 },
  lock: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockLabel: { letterSpacing: 0, fontWeight: '700' },
  hint: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  hintText: { lineHeight: 18, fontWeight: '400' },
});
