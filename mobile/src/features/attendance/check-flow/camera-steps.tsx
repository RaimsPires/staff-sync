import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, View } from 'react-native';

import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { Button, Card, Text } from '@/ui';

function PermissionGate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [permission, request] = useCameraPermissions();
  if (permission?.granted) return <>{children}</>;
  return (
    <Card>
      <Text>{t('check.cameraNeeded')}</Text>
      <Button label={t('setup.allow')} onPress={() => void request()} />
    </Card>
  );
}

/** Front-camera selfie with a face outline and retake. */
export function SelfieStep({ onDone }: { onDone: (uri: string) => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const ref = useRef<CameraView>(null);
  const [photo, setPhoto] = useState<string>();

  const take = async () => {
    const result = await ref.current?.takePictureAsync({ quality: 0.6, skipProcessing: true });
    if (result) setPhoto(result.uri);
  };

  return (
    <PermissionGate>
      <Text variant="heading">{t('check.selfieTitle')}</Text>
      <Text tone="muted">{t('check.selfieHelp')}</Text>
      <View style={[styles.frame, { borderColor: colors.line }]}>
        {photo ? (
          <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} accessibilityLabel={t('check.selfieTitle')} />
        ) : (
          <>
            <CameraView ref={ref} style={StyleSheet.absoluteFill} facing="front" />
            <View style={[styles.outline, { borderColor: colors.onPrimary }]} pointerEvents="none" />
          </>
        )}
      </View>
      {photo ? (
        <View style={styles.actions}>
          <Button variant="secondary" label={t('check.retake')} onPress={() => setPhoto(undefined)} style={styles.flex} />
          <Button label={t('check.usePhoto')} onPress={() => onDone(photo)} style={styles.flex} />
        </View>
      ) : (
        <Button icon="camera" label={t('check.takePhoto')} onPress={() => void take()} />
      )}
    </PermissionGate>
  );
}

/** Scans the QR code posted at the site entrance. The server validates its signature and time window. */
export function QrStep({ onScanned }: { onScanned: (payload: string) => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [torch, setTorch] = useState(false);
  const done = useRef(false);

  return (
    <PermissionGate>
      <Text variant="heading">{t('check.qrTitle')}</Text>
      <Text tone="muted">{t('check.qrHelp')}</Text>
      <View style={[styles.frame, { borderColor: colors.line }]}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => {
            if (done.current || !data) return;
            done.current = true;
            onScanned(data);
          }}
        />
      </View>
      <Button variant="secondary" icon={torch ? 'flashlight' : 'flashlight-outline'} label={t('check.torch')} onPress={() => setTorch((v) => !v)} />
    </PermissionGate>
  );
}

const styles = StyleSheet.create({
  frame: { height: 340, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, backgroundColor: '#000' },
  outline: { position: 'absolute', alignSelf: 'center', top: 30, width: 200, height: 260, borderWidth: 3, borderRadius: 120, borderStyle: 'dashed' },
  actions: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
