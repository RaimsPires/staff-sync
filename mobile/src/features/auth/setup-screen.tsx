import { Camera } from 'expo-camera';
import * as Notifications from 'expo-notifications';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, View } from 'react-native';

import { useLocationPermission } from '@/core/location/use-site-proximity';
import { getOrCreateDeviceId, useSession } from '@/core/session/session-store';
import { spacing } from '@/core/theme/tokens';
import { AppError, repos } from '@/data';
import { Button, Card, Icon, Pill, Screen, Text, type IconName } from '@/ui';

type RowProps = {
  icon: IconName;
  title: string;
  why: string;
  granted: boolean;
  onAllow: () => void;
};

function PermissionRow({ icon, title, why, granted, onAllow }: RowProps) {
  const { t } = useTranslation();
  return (
    <Card>
      <View style={styles.rowHead}>
        <Icon name={icon} tone="primary" />
        <Text variant="subheading" style={styles.flex}>
          {title}
        </Text>
        {granted ? <Pill tone="success" label={t('setup.granted')} /> : null}
      </View>
      <Text tone="muted" variant="caption">
        {why}
      </Text>
      {!granted ? <Button variant="secondary" label={t('setup.allow')} onPress={onAllow} /> : null}
    </Card>
  );
}

export function SetupScreen() {
  const { t } = useTranslation();
  const completeSetup = useSession((s) => s.completeSetup);
  const location = useLocationPermission();
  const [notifications, setNotifications] = useState(false);
  const [camera, setCamera] = useState(false);
  const [deviceBusy, setDeviceBusy] = useState(false);
  const [deviceError, setDeviceError] = useState(false);

  const finish = async () => {
    setDeviceBusy(true);
    setDeviceError(false);
    try {
      await repos.auth.registerDevice(await getOrCreateDeviceId());
      completeSetup();
    } catch (e) {
      setDeviceError(e instanceof AppError && e.code === 'DEVICE_BOUND');
    } finally {
      setDeviceBusy(false);
    }
  };

  return (
    <Screen
      footer={
        <Button
          label={t('setup.register')}
          onPress={() => void finish()}
          loading={deviceBusy}
          disabled={location.state !== 'granted'}
        />
      }>
      <View style={styles.header}>
        <Text variant="title">{t('setup.title')}</Text>
        <Text tone="muted">{t('setup.subtitle')}</Text>
      </View>

      <PermissionRow
        icon="location"
        title={t('setup.location')}
        why={t('setup.locationWhy')}
        granted={location.state === 'granted'}
        onAllow={() => void location.request()}
      />
      {location.state === 'denied' ? (
        <Card>
          <Text tone="danger" variant="caption">
            {t('setup.locationDenied')}
          </Text>
          <Button variant="secondary" label={t('setup.openSettings')} onPress={() => void Linking.openSettings()} />
        </Card>
      ) : null}

      <PermissionRow
        icon="notifications"
        title={t('setup.notifications')}
        why={t('setup.notificationsWhy')}
        granted={notifications}
        onAllow={() => void Notifications.requestPermissionsAsync().then((p) => setNotifications(p.granted))}
      />
      <PermissionRow
        icon="camera"
        title={t('setup.camera')}
        why={t('setup.cameraWhy')}
        granted={camera}
        onAllow={() => void Camera.requestCameraPermissionsAsync().then((p) => setCamera(p.granted))}
      />

      <Card>
        <View style={styles.rowHead}>
          <Icon name="phone-portrait" tone="primary" />
          <Text variant="subheading">{t('setup.deviceTitle')}</Text>
        </View>
        <Text tone="muted" variant="caption">
          {t('setup.deviceBody')}
        </Text>
        {deviceError ? (
          <Text tone="danger" variant="caption" accessibilityRole="alert">
            {t('setup.deviceBusy')}
          </Text>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, paddingTop: spacing.xxl },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
});
