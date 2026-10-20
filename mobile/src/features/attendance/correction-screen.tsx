import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { spacing } from '@/core/theme/tokens';
import { repos } from '@/data';
import type { CorrectionKind } from '@/domain';
import { Button, Icon, Pill, Screen, Segmented, Text, TextField } from '@/ui';

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

const schema = z.object({
  kind: z.enum(['forgot_checkout', 'wrong_time', 'flagged_incorrectly']),
  proposedTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).or(z.literal('')),
  comment: z.string().trim().min(3).max(500),
});
type Form = z.infer<typeof schema>;

export function CorrectionScreen() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [attachment, setAttachment] = useState<string>();
  const [sent, setSent] = useState(false);
  const { control, handleSubmit, watch, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { kind: 'forgot_checkout', proposedTime: '', comment: '' },
  });
  const kind = watch('kind');

  const pick = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
    const file = res.assets?.[0];
    if (file && (file.size ?? 0) <= MAX_ATTACHMENT_BYTES) setAttachment(file.name);
  };

  const submit = handleSubmit(async (v) => {
    await repos.attendance.requestCorrection({
      recordId: id,
      kind: v.kind as CorrectionKind,
      proposedTime: v.proposedTime || undefined,
      comment: v.comment,
      attachmentName: attachment,
    });
    await qc.invalidateQueries({ queryKey: ['attendance'] });
    setSent(true);
    setTimeout(() => router.back(), 900);
  });

  return (
    <Screen footer={<Button label={t('common.submit')} onPress={submit} loading={formState.isSubmitting} disabled={sent} />}>
      <View style={styles.head}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
          <Icon name="chevron-back" />
        </Pressable>
        <Text variant="title" style={styles.flex}>{t('attendance.correctionTitle')}</Text>
      </View>

      <Text variant="subheading">{t('attendance.kind')}</Text>
      <Controller
        control={control}
        name="kind"
        render={({ field }) => (
          <Segmented<Form['kind']>
            options={[
              { value: 'forgot_checkout', label: t('attendance.kindForgotCheckout') },
              { value: 'wrong_time', label: t('attendance.kindWrongTime') },
              { value: 'flagged_incorrectly', label: t('attendance.kindFlaggedIncorrectly') },
            ]}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      {kind !== 'flagged_incorrectly' ? (
        <Controller
          control={control}
          name="proposedTime"
          render={({ field }) => (
            <TextField
              label={t('attendance.proposedTime')}
              placeholder="17:00"
              value={field.value}
              onChangeText={field.onChange}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              error={formState.errors.proposedTime ? t('attendance.proposedTimeInvalid') : undefined}
            />
          )}
        />
      ) : null}

      <Controller
        control={control}
        name="comment"
        render={({ field }) => (
          <TextField
            label={t('attendance.comment')}
            value={field.value}
            onChangeText={field.onChange}
            multiline
            maxLength={500}
            style={styles.multiline}
            error={formState.errors.comment ? t('attendance.commentRequired') : undefined}
          />
        )}
      />

      {attachment ? <Pill tone="info" label={t('attendance.attached', { name: attachment })} /> : null}
      <Button variant="secondary" icon="attach" label={t('attendance.attach')} onPress={() => void pick()} />
      {sent ? <Pill tone="success" label={t('attendance.correctionSent')} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  multiline: { minHeight: 100, textAlignVertical: 'top', paddingTop: spacing.md },
});
