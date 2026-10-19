import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Image, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useSettings, type Language } from '@/core/settings/settings-store';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { Button, Icon, Screen, Segmented, Text, type IconName } from '@/ui';

const SLIDES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'location', title: 'onboarding.slide1Title', body: 'onboarding.slide1Body' },
  { icon: 'calendar', title: 'onboarding.slide2Title', body: 'onboarding.slide2Body' },
  { icon: 'airplane', title: 'onboarding.slide3Title', body: 'onboarding.slide3Body' },
];

export function IntroScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);
  const completeOnboarding = useSettings((s) => s.completeOnboarding);
  const setLanguage = useSettings((s) => s.setLanguage);
  const last = index === SLIDES.length - 1;
  const pageWidth = width - spacing.xl * 2;

  const next = () => {
    if (last) completeOnboarding();
    else listRef.current?.scrollToIndex({ index: index + 1 });
  };

  return (
    <Screen
      scroll={false}
      footer={
        <>
          <Button label={last ? t('onboarding.getStarted') : t('onboarding.next')} onPress={next} />
          {!last ? <Button variant="ghost" label={t('common.skip')} onPress={completeOnboarding} /> : null}
        </>
      }>
      <View style={styles.top}>
        <Image source={require('@/../assets/images/logo.png')} style={styles.logo} accessibilityLabel="StaffSync" />
        <View style={styles.lang}>
          <Segmented<Language>
            options={[
              { value: 'en', label: 'EN' },
              { value: 'fr', label: 'FR' },
            ]}
            value={i18n.language === 'fr' ? 'fr' : 'en'}
            onChange={setLanguage}
          />
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.title}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / pageWidth))}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: pageWidth }]}>
            <View style={[styles.badge, { backgroundColor: colors.infoBg }]}>
              <Icon name={item.icon} size={56} tone="primary" />
            </View>
            <Text variant="title" style={styles.center}>
              {t(item.title)}
            </Text>
            <Text tone="muted" style={styles.center}>
              {t(item.body)}
            </Text>
          </View>
        )}
      />

      <View style={styles.dots} accessibilityElementsHidden>
        {SLIDES.map((s, i) => (
          <View
            key={s.title}
            style={[styles.dot, { backgroundColor: i === index ? colors.primary : colors.line, width: i === index ? 18 : 6 }]}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: 56, height: 56, borderRadius: radius.md },
  lang: { width: 110 },
  slide: { alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingHorizontal: spacing.sm },
  badge: { width: 128, height: 128, borderRadius: 64, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 3 },
});
