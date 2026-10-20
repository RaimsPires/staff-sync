import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useSession } from '@/core/session/session-store';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { Button, Screen, Text } from '@/ui';

export function CompanyScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const companies = useSession((s) => s.companies);
  const choose = useSession((s) => s.chooseCompany);
  const [selected, setSelected] = useState<string>(companies[0]?.id ?? '');
  const [busy, setBusy] = useState(false);

  const confirm = () => {
    setBusy(true);
    void choose(selected).finally(() => setBusy(false));
  };

  return (
    <Screen gutter={24} contentStyle={styles.content} footer={<Button large label={t('common.continue')} onPress={confirm} loading={busy} disabled={!selected} />}>
      <View style={styles.titles}>
        <Text variant="display">{t('auth.chooseCompany')}</Text>
        <Text tone="muted">{t('auth.chooseCompanySubtitle')}</Text>
      </View>

      <View style={styles.list} accessibilityRole="radiogroup">
        {companies.map((c) => {
          const active = c.id === selected;
          return (
            <Pressable
              key={c.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={c.name}
              onPress={() => setSelected(c.id)}
              style={[styles.card, { backgroundColor: colors.card, borderColor: active ? colors.primary : colors.line, borderWidth: active ? 3 : 1 }]}>
              <View style={[styles.tile, { backgroundColor: c.color }]}>
                <Text variant="heading" tone="onPrimary" style={styles.tileText}>{c.initials}</Text>
              </View>
              <View style={styles.flex}>
                <Text variant="heading" style={styles.name}>{c.name}</Text>
                <Text variant="caption" tone="muted">{c.role === 'site_manager' ? t('auth.roleManager') : t('auth.roleEmployee')}</Text>
              </View>
              <Text style={styles.mark} tone="primary">{active ? '●' : '○'}</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingTop: 48 },
  titles: { gap: spacing.sm },
  list: { gap: spacing.md, marginTop: spacing.xl },
  card: { minHeight: 84, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: spacing.lg },
  tile: { width: 52, height: 52, borderRadius: radius.field, alignItems: 'center', justifyContent: 'center' },
  tileText: { fontSize: 18 },
  name: { fontSize: 18 },
  mark: { fontSize: 22 },
});
