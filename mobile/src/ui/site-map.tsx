import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import MapView, { Circle, Marker, Polygon } from 'react-native-maps';

import { useTheme } from '@/core/theme/theme-provider';
import { radius } from '@/core/theme/tokens';
import type { LatLng, Site } from '@/domain';

type Props = {
  site: Site;
  user?: LatLng;
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
};

const toCoord = (p: LatLng) => ({ latitude: p.lat, longitude: p.lng });

/** Region that comfortably contains the geofence and (when known) the user. */
function regionFor(site: Site, user?: LatLng) {
  const radiusM = site.geofence.kind === 'circle' ? site.geofence.radiusM : 150;
  const pts: LatLng[] = [site.center, ...(user ? [user] : [])];
  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);
  const pad = Math.max(radiusM * 3, 250) / 111_000;
  return {
    latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
    longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    latitudeDelta: Math.max(Math.max(...lats) - Math.min(...lats), 0.0005) + pad,
    longitudeDelta: Math.max(Math.max(...lngs) - Math.min(...lngs), 0.0005) + pad,
  };
}

export function SiteMap({ site, user, interactive = false, style }: Props) {
  const { colors, isDark } = useTheme();
  const fill = `${colors.primary}33`;
  const key = `${site.id}-${user ? 'u' : 'n'}`;

  return (
    <View style={[styles.wrap, { borderColor: colors.line }, style]}>
      <MapView
        key={key}
        style={StyleSheet.absoluteFill}
        initialRegion={regionFor(site, user)}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation
        toolbarEnabled={false}
        accessibilityLabel={site.name}>
        {site.geofence.kind === 'circle' ? (
          <Circle center={toCoord(site.geofence.center)} radius={site.geofence.radiusM} strokeColor={colors.primary} fillColor={fill} strokeWidth={2} />
        ) : (
          <Polygon
            coordinates={site.geofence.points.map(toCoord)}
            strokeColor={colors.primary}
            fillColor={fill}
            strokeWidth={2}
          />
        )}
        <Marker coordinate={toCoord(site.center)} title={site.name} />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', borderRadius: radius.lg, borderWidth: 1, minHeight: 160 },
});
