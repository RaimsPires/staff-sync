import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { useSession } from '@/core/session/session-store';
import { spacing } from '@/core/theme/tokens';
import { Card, Icon, Screen, Text } from '@/ui';

export function CompanyScreen() {
  const { t } = useTranslation();
  const companies = useSession((s) => s.companies);
  const choose = useSession((s) => s.chooseCompany);
  const [busy, setBusy] = useState<string>();

  return (
    <Screen>
      <Text variant="title" style={styles.title}>
        {t('auth.chooseCompany')}
      </Text>
      <Text tone="muted">{t('auth.chooseCompanySubtitle')}</Text>
      {companies.map((c) => (
        <Pressable
          key={c.id}
          accessibilityRole="button"
          accessibilityLabel={c.name}
          disabled={!!busy}
          onPress={() => {
            setBusy(c.id);
            void choose(c.id).finally(() => setBusy(undefined));
          }}>
          <Card style={styles.row}>
            <Icon name="business" tone="primary" />
            <Text variant="subheading" style={styles.name}>
              {c.name}
            </Text>
            <Icon name={busy === c.id ? 'hourglass' : 'chevron-forward'} size={18} tone="muted" />
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { paddingTop: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { flex: 1 },
});
