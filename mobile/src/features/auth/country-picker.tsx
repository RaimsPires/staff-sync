import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { BottomSheet, Icon, Text } from '@/ui';

import { listCountries, PINNED, type Country, type CountryCode } from './phone';

type Props = { visible: boolean; selected: CountryCode; lang: string; onSelect: (code: CountryCode) => void; onClose: () => void };

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Searchable country list in a bottom sheet; the launch markets are pinned on top. */
export function CountryPicker({ visible, selected, lang, onSelect, onClose }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const all = listCountries(lang);
    const q = norm(query.trim());
    if (q) return all.filter((c) => norm(c.name).includes(q) || c.dial.includes(q) || c.code.toLowerCase() === q);
    const pinned = PINNED.map((code) => all.find((c) => c.code === code)).filter((c): c is Country => !!c);
    return [...pinned, ...all.filter((c) => !PINNED.includes(c.code))];
  }, [lang, query]);

  const pick = (code: CountryCode) => {
    onSelect(code);
    setQuery('');
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} closable title={t('auth.selectCountry')}>
      <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.fieldBorder }]}>
        <Icon name="search" size={18} tone="muted" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('auth.searchCountry')}
          placeholderTextColor={colors.muted}
          accessibilityLabel={t('auth.searchCountry')}
          autoCorrect={false}
          style={[styles.input, { color: colors.ink }]}
        />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(c) => c.code}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={16}
        ListEmptyComponent={
          <Text tone="muted" style={styles.empty}>
            {t('auth.noCountry')}
          </Text>
        }
        renderItem={({ item, index }) => {
          const on = item.code === selected;
          const pinnedEnd = !query && index === PINNED.length - 1;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => pick(item.code)}
              style={[styles.row, pinnedEnd && { borderBottomWidth: 1, borderBottomColor: colors.line }]}>
              <Text style={styles.flag}>{item.flag}</Text>
              <Text variant="bodyStrong" style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Text tone="muted">{item.dial}</Text>
              {on ? <Icon name="checkmark" size={18} tone="primary" /> : <View style={styles.tick} />}
            </Pressable>
          );
        }}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  search: { minHeight: 48, borderRadius: radius.field, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 16, minHeight: 44 },
  list: { height: 360 },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flag: { fontSize: 24 },
  name: { flex: 1 },
  tick: { width: 18 },
  empty: { textAlign: 'center', paddingVertical: spacing.xl },
});
