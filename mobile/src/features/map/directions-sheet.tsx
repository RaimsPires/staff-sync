import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import type { LatLng } from '@/domain';
import { BottomSheet, Text } from '@/ui';

import { DIRECTIONS_OPTIONS, openDirectionsWith } from './directions';

type Target = { to: LatLng; label: string };

const NAME = { google: 'map.googleMaps', apple: 'map.appleMaps', waze: 'map.waze' } as const;

/** "Open directions in" sheet. Call `open(to, label)` and render `sheet` once in the screen. */
export function useDirectionsSheet() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [target, setTarget] = useState<Target | null>(null);
  const close = useCallback(() => setTarget(null), []);
  const open = useCallback((to: LatLng, label: string) => setTarget({ to, label }), []);

  const sheet = (
    <BottomSheet visible={!!target} onClose={close} title={t('map.openDirectionsIn')}>
      <View style={styles.list}>
        {DIRECTIONS_OPTIONS.map((o) => (
          <Pressable
            key={o.provider}
            accessibilityRole="button"
            onPress={() => {
              if (target) openDirectionsWith(o.provider, target.to, target.label);
              close();
            }}
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.line }]}>
            <View style={[styles.tile, { backgroundColor: o.color }]}>
              <Text tone="onPrimary" style={styles.initial}>
                {o.initial}
              </Text>
            </View>
            <Text variant="lead" style={styles.name}>
              {t(NAME[o.provider])}
            </Text>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" onPress={close} style={styles.cancel}>
          <Text tone="muted" style={styles.cancelLabel}>
            {t('common.cancel')}
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );

  return { open, sheet };
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: { minHeight: 60, borderRadius: radius.button, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14 },
  tile: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  initial: { fontWeight: '800' },
  name: { fontWeight: '700' },
  cancel: { minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  cancelLabel: { fontSize: 16, fontWeight: '700' },
});
