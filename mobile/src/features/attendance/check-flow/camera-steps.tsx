import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { cameraColors, radius, spacing } from '@/core/theme/tokens';
import { Button, Text } from '@/ui';

const BRACKET = 56;
const BOX = 260;

function PermissionGate({ children, onCancel }: { children: ReactNode; onCancel: () => void }) {
  const { t } = useTranslation();
  const [permission, request] = useCameraPermissions();
  if (permission?.granted) return <>{children}</>;
  return (
    <View style={styles.gate}>
      <Text variant="heading" style={styles.white}>
        {t('check.cameraNeeded')}
      </Text>
      <Button label={t('setup.allow')} onPress={() => void request()} />
      <Button variant="ghost" label={t('common.cancel')} onPress={onCancel} />
    </View>
  );
}

function Cancel({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.cancel}>
      <Text style={styles.cancelLabel}>{t('common.cancel')}</Text>
    </Pressable>
  );
}

/** Front-camera selfie in a 250×330 oval on the fixed-dark camera surface. */
export function SelfieStep({ onDone, onCancel }: { onDone: (uri: string) => void; onCancel: () => void }) {
  const { t } = useTranslation();
  const ref = useRef<CameraView>(null);
  const [photo, setPhoto] = useState<string>();

  const take = async () => {
    const result = await ref.current?.takePictureAsync({ quality: 0.6, skipProcessing: true });
    if (result) setPhoto(result.uri);
  };

  return (
    <PermissionGate onCancel={onCancel}>
      <View style={styles.screen}>
        <Text style={styles.title}>{photo ? t('check.selfieLookTitle') : t('check.selfieTitle')}</Text>
        <Text style={styles.sub}>{photo ? t('check.selfieLookSub') : t('check.selfieHelp')}</Text>
        <View
          style={[
            styles.oval,
            { borderColor: photo ? cameraColors.accent : cameraColors.text, borderStyle: photo ? 'solid' : 'dashed', backgroundColor: cameraColors.panel },
          ]}>
          {photo ? (
            <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} accessibilityLabel={t('check.selfieTitle')} />
          ) : (
            <CameraView ref={ref} style={StyleSheet.absoluteFill} facing="front" />
          )}
        </View>
        <View style={styles.flex} />
        {photo ? (
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={() => setPhoto(undefined)} style={[styles.retake]}>
              <Text style={styles.actionLabel}>{t('check.retake')}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => onDone(photo)} style={[styles.use]}>
              <Text style={styles.actionLabel}>{t('check.usePhoto')}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Pressable accessibilityRole="button" accessibilityLabel={t('check.takePhoto')} onPress={() => void take()} style={styles.shutter} />
            <Cancel onPress={onCancel} />
          </>
        )}
      </View>
    </PermissionGate>
  );
}

function ScanLine() {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: 16 + y.value * (BOX - 32 - 3) }] }));
  return <Animated.View pointerEvents="none" style={[styles.scanLine, style]} />;
}

/** Scans the QR code posted at the site entrance. The server validates its signature and time window. */
export function QrStep({ site, title, help, onScanned, onCancel }: { site?: string; title?: string; help?: string; onScanned: (payload: string) => void; onCancel: () => void }) {
  const { t } = useTranslation();
  const [torch, setTorch] = useState(false);
  const done = useRef(false);

  return (
    <PermissionGate onCancel={onCancel}>
      <View style={styles.screen}>
        <Text style={styles.title}>{title ?? t('check.qrTitle')}</Text>
        <Text style={styles.sub}>{help ?? t('check.qrHelpSite', { site: site ?? '' })}</Text>
        <View style={styles.scanBox}>
          <View style={styles.scanClip}>
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
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
          <ScanLine />
        </View>
        <Text style={styles.hold}>{t('check.qrHold')}</Text>
        <View style={styles.flex} />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: torch }}
          onPress={() => setTorch((v) => !v)}
          style={[styles.torch, { backgroundColor: torch ? cameraColors.text : 'transparent' }]}>
          <Text style={[styles.torchLabel, { color: torch ? cameraColors.bg : cameraColors.text }]}>☀ {torch ? t('check.torchOn') : t('check.torchOff')}</Text>
        </Pressable>
        <Cancel onPress={onCancel} />
      </View>
    </PermissionGate>
  );
}

const corner = { position: 'absolute' as const, width: BRACKET, height: BRACKET, borderColor: cameraColors.accent };

const styles = StyleSheet.create({
  flex: { flex: 1 },
  white: { color: cameraColors.text, textAlign: 'center' },
  gate: { flex: 1, justifyContent: 'center', gap: spacing.lg, padding: spacing.xl },
  screen: { flex: 1, alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.sm },
  title: { color: cameraColors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  sub: { color: cameraColors.sub, fontSize: 15, textAlign: 'center', marginTop: 6 },
  oval: { marginTop: 36, width: 250, height: 330, borderRadius: 165, borderWidth: 4, overflow: 'hidden' },
  shutter: { width: 84, height: 84, borderRadius: 42, borderWidth: 5, borderColor: cameraColors.text, backgroundColor: cameraColors.text, shadowColor: cameraColors.bg, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 0 } },
  actions: { flexDirection: 'row', gap: 12, width: '100%' },
  retake: { flex: 1, minHeight: 60, borderRadius: radius.row, borderWidth: 2, borderColor: cameraColors.text, alignItems: 'center', justifyContent: 'center' },
  use: { flex: 1, minHeight: 60, borderRadius: radius.row, backgroundColor: cameraColors.primary, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: cameraColors.text, fontSize: 17, fontWeight: '800' },
  cancel: { minHeight: 52, marginTop: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  cancelLabel: { color: cameraColors.sub, fontSize: 16, fontWeight: '700' },
  scanBox: { marginTop: 56, width: BOX, height: BOX, borderRadius: radius.lg, backgroundColor: cameraColors.panel },
  scanClip: { ...StyleSheet.absoluteFill, borderRadius: radius.lg, overflow: 'hidden' },
  corner,
  tl: { left: 0, top: 0, borderLeftWidth: 6, borderTopWidth: 6, borderTopLeftRadius: radius.lg },
  tr: { right: 0, top: 0, borderRightWidth: 6, borderTopWidth: 6, borderTopRightRadius: radius.lg },
  bl: { left: 0, bottom: 0, borderLeftWidth: 6, borderBottomWidth: 6, borderBottomLeftRadius: radius.lg },
  br: { right: 0, bottom: 0, borderRightWidth: 6, borderBottomWidth: 6, borderBottomRightRadius: radius.lg },
  scanLine: { position: 'absolute', left: 16, right: 16, top: 0, height: 3, backgroundColor: cameraColors.accent, shadowColor: cameraColors.accent, shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  hold: { color: cameraColors.sub, fontSize: 14, marginTop: 20 },
  torch: { minHeight: 60, paddingHorizontal: 28, borderRadius: 30, borderWidth: 2, borderColor: cameraColors.text, alignItems: 'center', justifyContent: 'center' },
  torchLabel: { fontSize: 17, fontWeight: '800' },
});
