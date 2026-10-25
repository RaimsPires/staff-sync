import { useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { repos } from '@/data';
import type { CorrectionKind } from '@/domain';
import { Button, Icon, isValidTime, RadioRow, Text, TimeField, useToast } from '@/ui';

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const KINDS: { kind: CorrectionKind; key: string }[] = [
  { kind: 'forgot_checkout', key: 'attendance.kindForgotCheckout' },
  { kind: 'wrong_time', key: 'attendance.kindWrongTime' },
  { kind: 'flagged_incorrectly', key: 'attendance.kindFlaggedIncorrectly' },
];

const sizeLabel = (bytes?: number) => (!bytes ? '' : bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/** Presented as a transparent modal route: scrim + 28px bottom sheet, as in the design. */
export function CorrectionScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [kind, setKind] = useState<CorrectionKind>('forgot_checkout');
  const [time, setTime] = useState('17:00');
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<{ name: string; size: string; uri: string; type?: string }>();
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);

  const needsTime = kind !== 'flagged_incorrectly';
  const timeError = tried && needsTime && !isValidTime(time) ? t('attendance.proposedTimeInvalid') : undefined;

  const pick = async () => {
    if (file) return setFile(undefined);
    const res = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
    const picked = res.assets?.[0];
    if (!picked) return;
    if ((picked.size ?? 0) > MAX_ATTACHMENT_BYTES) return toast.show(t('attendance.attachTooBig'));
    setFile({ name: picked.name, size: sizeLabel(picked.size), uri: picked.uri, type: picked.mimeType });
  };

  const submit = async () => {
    setTried(true);
    if (needsTime && !isValidTime(time)) return;
    setBusy(true);
    try {
      await repos.attendance.requestCorrection({
        recordId: id,
        kind,
        proposedTime: needsTime ? time : undefined,
        comment: comment.trim(),
        attachmentName: file?.name,
        attachmentUri: file?.uri,
        attachmentType: file?.type,
      });
      await qc.invalidateQueries({ queryKey: ['attendance'] });
      toast.show(t('attendance.correctionSent'));
      router.back();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('common.close')} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { backgroundColor: colors.bg, paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.header}>
            <Text variant="heading">{t('attendance.requestCorrection')}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              onPress={() => router.back()}
              style={[styles.close, { backgroundColor: colors.card, borderColor: colors.line }]}>
              <Icon name="close" size={20} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text variant="caption" tone="muted" style={styles.label}>
              {t('attendance.kind')}
            </Text>
            <View style={styles.radios}>
              {KINDS.map((k) => (
                <RadioRow key={k.kind} label={t(k.key)} selected={kind === k.kind} onPress={() => setKind(k.kind)} />
              ))}
            </View>

            {needsTime ? (
              <TimeField
                label={kind === 'forgot_checkout' ? t('attendance.proposedCheckoutTime') : t('attendance.proposedTimeShort')}
                value={time}
                onChange={setTime}
                error={timeError}
              />
            ) : null}

            <View style={styles.field}>
              <Text variant="caption" tone="muted" style={styles.label}>
                {t('attendance.comment')}
              </Text>
              <TextInput
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                maxLength={500}
                placeholder={t('attendance.commentPlaceholder')}
                placeholderTextColor={colors.muted}
                accessibilityLabel={t('attendance.comment')}
                style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.line, color: colors.ink }]}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => void pick()}
              style={[styles.attach, { backgroundColor: colors.card, borderColor: colors.primary }]}>
              <Text tone="primary" style={styles.attachLabel} numberOfLines={1}>
                {file ? `📎 ${t('attendance.removeAttachment', file)}` : t('attendance.addAttachment')}
              </Text>
            </Pressable>

            <Button label={t('attendance.submitRequest')} onPress={() => void submit()} loading={busy} style={styles.submit} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingTop: spacing.lg, paddingHorizontal: spacing.xl, gap: spacing.md, maxHeight: 700 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  body: { gap: 12 },
  label: { fontWeight: '800' },
  radios: { gap: spacing.sm },
  field: { gap: 6 },
  textarea: { minHeight: 84, borderRadius: radius.field, borderWidth: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md, fontSize: 15, textAlignVertical: 'top' },
  attach: { minHeight: 48, borderRadius: radius.field, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  attachLabel: { fontSize: 15, fontWeight: '800' },
  submit: { marginTop: 4 },
});
