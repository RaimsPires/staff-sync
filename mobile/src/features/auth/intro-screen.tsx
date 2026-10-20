import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { capitalize, formatDate } from '@/core/format';
import { useSettings, type Language } from '@/core/settings/settings-store';
import { useTheme } from '@/core/theme/theme-provider';
import { cameraColors, radius, spacing, type ThemeColors } from '@/core/theme/tokens';
import { Button, Icon, PagerDots, Screen, Text } from '@/ui';

const GUTTER = 24;
const HERO_HEIGHT = 340;

type Slide = { key: 1 | 2 | 3; bg: keyof ThemeColors };
const SLIDES: Slide[] = [
  { key: 1, bg: 'successBg' },
  { key: 2, bg: 'infoBg' },
  { key: 3, bg: 'infoBg' },
];

const SHADOW = { shadowColor: cameraColors.navy, shadowOpacity: 0.13, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 4 } as const;

function GeofenceArt() {
  const { colors } = useTheme();
  return (
    <View style={[styles.fence, { backgroundColor: `${colors.primary}33`, borderColor: colors.primary }]}>
      <View style={[styles.pin, { backgroundColor: colors.success, borderColor: colors.card, shadowColor: colors.success }]}>
        <Icon name="checkmark" size={26} tone="onPrimary" />
      </View>
    </View>
  );
}

// Mon 2 – Thu 5 Nov 2026, only used to get localised weekday abbreviations.
const sampleDay = (n: number) => new Date(2026, 10, n, 12);

function ScheduleArt() {
  const { colors } = useTheme();
  const { i18n } = useTranslation();
  const days: [string, keyof ThemeColors, 'successFg' | 'warningFg' | 'grayFg'][] = [
    [capitalize(formatDate(sampleDay(2), 'EEE', i18n.language)), 'successBg', 'successFg'],
    [capitalize(formatDate(sampleDay(3), 'EEE', i18n.language)), 'warningBg', 'warningFg'],
    [capitalize(formatDate(sampleDay(4), 'EEE', i18n.language)), 'successBg', 'successFg'],
    [capitalize(formatDate(sampleDay(5), 'EEE', i18n.language)), 'grayBg', 'grayFg'],
  ];
  return (
    <View style={[styles.artCard, SHADOW, { backgroundColor: colors.card }]}>
      <View style={styles.daysRow}>
        {days.map(([d, bg, fg]) => (
          <View key={d} style={[styles.day, { backgroundColor: colors[bg] }]}>
            <Text variant="label" tone={fg} style={styles.dayLabel}>
              {d}
            </Text>
          </View>
        ))}
      </View>
      <View style={[styles.bar, { backgroundColor: colors.infoBg, width: '80%' }]} />
      <View style={[styles.bar, { backgroundColor: colors.infoBg, width: '60%' }]} />
    </View>
  );
}

function LeaveArt() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={[styles.artCard, SHADOW, { backgroundColor: colors.card }]}>
      <Text style={styles.artTitle}>{`${formatDate(sampleDay(12), 'd', i18n.language)} – ${formatDate(sampleDay(16), 'd MMM', i18n.language)}`}</Text>
      <Text variant="caption" tone="muted">
        {t('leave.days', { count: 5 })}
      </Text>
      <View style={[styles.sent, { backgroundColor: colors.infoBg }]}>
        <Text variant="small" tone="infoFg">
          {t('onboarding.requestSent')}
        </Text>
      </View>
    </View>
  );
}

function LanguageStep({ onContinue }: { onContinue: () => void }) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const setLanguage = useSettings((s) => s.setLanguage);
  const current: Language = i18n.language === 'fr' ? 'fr' : 'en';
  const options: { code: Language; label: string; name: string; hint: string }[] = [
    { code: 'en', label: 'EN', name: 'English', hint: t('onboarding.continueInEnglish') },
    { code: 'fr', label: 'FR', name: 'Français', hint: t('onboarding.continueInFrench') },
  ];

  return (
    <Screen
      scroll={false}
      gutter={GUTTER}
      footer={
        <>
          <Text variant="small" tone="muted" style={styles.later}>
            {t('onboarding.changeLater')}
          </Text>
          <Button large label={t('common.continue')} onPress={onContinue} />
        </>
      }>
      <View style={styles.langHead}>
        <Text style={styles.langTitle}>{t('onboarding.chooseLanguage')}</Text>
        <Text tone="muted" style={styles.langSub}>
          {t('onboarding.languageSub')}
        </Text>
      </View>
      <View style={styles.langList}>
        {options.map((o) => {
          const on = current === o.code;
          return (
            <Pressable
              key={o.code}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => setLanguage(o.code)}
              style={[styles.langCard, { backgroundColor: colors.card, borderColor: on ? colors.primary : colors.line, borderWidth: on ? 3 : 1 }]}>
              <View style={[styles.langBadge, { backgroundColor: colors.infoBg }]}>
                <Text tone="primary" style={styles.langBadgeText}>
                  {o.label}
                </Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.langName}>{o.name}</Text>
                <Text variant="caption" tone="muted">
                  {o.hint}
                </Text>
              </View>
              <View style={[styles.check, { backgroundColor: on ? colors.primary : colors.line }]}>{on ? <Icon name="checkmark" size={16} tone="onPrimary" /> : null}</View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

export function IntroScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<Slide>>(null);
  const [stage, setStage] = useState<'language' | 'slides'>('language');
  const [index, setIndex] = useState(0);
  const completeOnboarding = useSettings((s) => s.completeOnboarding);
  const last = index === SLIDES.length - 1;
  const pageWidth = width - GUTTER * 2;

  if (stage === 'language') return <LanguageStep onContinue={() => setStage('slides')} />;

  const goTo = (i: number) => {
    listRef.current?.scrollToIndex({ index: i });
    setIndex(i);
  };
  const next = () => (last ? completeOnboarding() : goTo(index + 1));

  return (
    <Screen scroll={false} gutter={GUTTER} contentStyle={styles.slidesContent} footer={<Button large label={last ? t('onboarding.getStarted') : t('onboarding.next')} onPress={next} />}>
      <View style={styles.skipRow}>
        <Pressable accessibilityRole="button" onPress={() => goTo(SLIDES.length - 1)} style={[styles.skip, last && styles.hidden]} disabled={last}>
          <Text tone="primary" style={styles.skipText}>
            {t('common.skip')}
          </Text>
        </Pressable>
      </View>

      <FlatList<Slide>
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => String(s.key)}
        style={styles.list}
        getItemLayout={(_, i) => ({ length: pageWidth, offset: pageWidth * i, index: i })}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / pageWidth))}
        renderItem={({ item }) => (
          <View style={{ width: pageWidth }}>
            <View style={[styles.hero, { backgroundColor: colors[item.bg] }]}>
              {item.key === 1 ? <GeofenceArt /> : item.key === 2 ? <ScheduleArt /> : <LeaveArt />}
            </View>
            <Text style={styles.title}>{t(`onboarding.slide${item.key}Title`)}</Text>
            <Text tone="muted" style={styles.body}>
              {t(`onboarding.slide${item.key}Body`)}
            </Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        <PagerDots count={SLIDES.length} index={index} activeWidth={28} size={8} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  later: { textAlign: 'center', marginBottom: 6, fontWeight: '400' },
  langHead: { paddingTop: spacing.xxxl + spacing.xl },
  langTitle: { fontSize: 30, fontWeight: '800', lineHeight: 35 },
  langSub: { fontSize: 16, marginTop: 8 },
  langList: { gap: 14, marginTop: 36 },
  langCard: { minHeight: 88, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl },
  langBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  langBadgeText: { fontWeight: '800' },
  langName: { fontSize: 20, fontWeight: '800' },
  check: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  slidesContent: { gap: 0 },
  skipRow: { alignItems: 'flex-end', height: 44 },
  skip: { minWidth: 64, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  hidden: { opacity: 0 },
  skipText: { fontSize: 16, fontWeight: '700' },
  list: { flex: 1, flexGrow: 1 },
  hero: { height: HERO_HEIGHT, borderRadius: radius.sheet, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  title: { fontSize: 28, fontWeight: '800', lineHeight: 32, marginTop: 32 },
  body: { fontSize: 16, lineHeight: 23, marginTop: 10 },
  dots: { marginBottom: spacing.xl, marginTop: spacing.md },
  fence: { width: 220, height: 220, borderRadius: 110, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  pin: { width: 56, height: 56, borderRadius: 28, borderWidth: 6, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  artCard: { width: 260, borderRadius: radius.lg, padding: 16, gap: 10 },
  daysRow: { flexDirection: 'row', gap: 6 },
  day: { flex: 1, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  dayLabel: { letterSpacing: 0, fontWeight: '700' },
  bar: { height: 12, borderRadius: 6 },
  artTitle: { fontWeight: '800', fontSize: 16 },
  sent: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4 },
});
