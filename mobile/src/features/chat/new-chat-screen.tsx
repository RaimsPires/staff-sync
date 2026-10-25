import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { loadPeople, openDirect, type ChatPerson } from '@/data/chat';
import { Avatar, BackHeader, Screen, Text, useToast } from '@/ui';

/** Pick a colleague to start a direct conversation with. */
export function NewChatScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [people, setPeople] = useState<ChatPerson[]>([]);

  useEffect(() => {
    let live = true;
    const id = setTimeout(() => void loadPeople(q).then((p) => live && setPeople(p), () => undefined), 200);
    return () => {
      live = false;
      clearTimeout(id);
    };
  }, [q]);

  const start = async (p: ChatPerson) => {
    try {
      const id = await openDirect(p.id);
      router.replace({ pathname: '/chat/[id]', params: { id } });
    } catch {
      toast.show(t('common.genericError'));
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <BackHeader title={t('chat.newChat')} variant="heading" />
      <TextInput
        value={q}
        onChangeText={setQ}
        autoFocus
        placeholder={t('chat.searchPeople')}
        placeholderTextColor={colors.muted}
        accessibilityLabel={t('chat.searchPeople')}
        style={[styles.input, { backgroundColor: colors.card, color: colors.ink, borderColor: colors.fieldBorder }]}
      />
      {people.map((p) => (
        <Pressable key={p.id} accessibilityRole="button" onPress={() => void start(p)} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.line }]}>
          <Avatar name={p.name} size={40} />
          <View style={styles.flex}>
            <Text variant="subheading" numberOfLines={1}>{p.name}</Text>
            {p.title ? <Text variant="caption" tone="muted" numberOfLines={1}>{p.title}</Text> : null}
          </View>
        </Pressable>
      ))}
      {people.length === 0 ? <Text tone="muted" style={styles.none}>{t('chat.noPeople')}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: spacing.sm },
  input: { height: 52, borderRadius: radius.field, borderWidth: 1.5, paddingHorizontal: spacing.lg, fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: 12, borderWidth: 1, borderRadius: radius.row },
  none: { textAlign: 'center', paddingVertical: spacing.xl },
});
