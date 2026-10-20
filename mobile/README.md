# StaffSync mobile

Expo SDK 58 / React Native app for employees and site managers. Behaviour is specified in `../Mobile App.md`, visuals in `../StaffSync mobile app design/`, and the future API contract in `../Backend API.md`.

## Run

```bash
npm install --legacy-peer-deps
npx expo run:ios        # or run:android. A dev build is required (react-native-maps), Expo Go is not enough
npm run typecheck
npm test
```

Mock login: `amina@staffsync.app` (employee, two companies) or `karim@staffsync.app` (site manager). OTP is `123456`. Proxy PINs: Joseph `4821`, Paul `1357`.

Google Maps on Android needs an API key in `app.json` (`android.config.googleMaps.apiKey`).

## Architecture

```
src/app/          expo-router routes only: each file re-exports a feature screen
src/features/     one folder per feature: screens, hooks, queries, schemas
src/domain/       pure TypeScript rules (status/lateness, geofence maths, leave day count). Unit-tested
src/data/         repository interfaces + in-memory mock backend + offline queue
src/core/         theme, i18n (EN/FR), settings, session, location, network, secure storage
src/ui/           design-system primitives (Button, Card, Pill, Calendar, SiteMap, ...)
```

Dependencies point inwards: screens → hooks → repositories (`data/index.ts`) → domain. To connect the real backend, implement the interfaces in `src/data/repositories/types.ts` over HTTP and swap them in `src/data/index.ts`; no screen changes.

## Security

- Tokens and device id live only in Keychain/Keystore (`core/security/secure-storage.ts`); AsyncStorage holds non-sensitive preferences and the offline queue (GPS points, no credentials).
- Identifiers entered at login are held in memory only, never in URLs or storage.
- Check-ins are never blocked for location reasons; mock location, low accuracy, clock tampering and unregistered device are recorded as flags (mirrors the server pipeline).
- Location is read on demand or while a map screen is open, never in the background.
- Check-ins carry a `clientEventId` for idempotent offline sync.
