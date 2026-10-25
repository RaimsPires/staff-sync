# StaffSync mobile

Expo SDK 58 / React Native app for employees and site managers. Behaviour is specified in `../Mobile App.md`, visuals in `../StaffSync mobile app design/`, and the API contract in `../Backend API.md`.

## Run

```bash
npm install --legacy-peer-deps
npx expo run:ios        # or run:android. A dev build is required (react-native-maps), Expo Go is not enough
npm run typecheck
npm test
```

## Backend

`mobile/.env` (not committed) chooses the data source:

```
EXPO_PUBLIC_API_URL=http://<your computer's LAN address>:8000/api/v1
EXPO_PUBLIC_USE_MOCK=0        # 0 = real API, 1 = built-in demo data
```

`../scripts/dev.sh --lan --seed` starts the backend on the LAN and writes this file for you. With the real API, log in with the seeded e-mail or phone number. Seeded employees have no password yet, so the first sign-in uses the one-time code alone (printed in the API server log when e-mail is not configured) and then asks you to create a password; after that every sign-in is identifier + password + code. The seed's shifts run 08:00-17:00 in Douala, so a check-in outside those hours is "unscheduled" and goes for review.

Native packages are compiled into the app. After adding or upgrading one (for example `@react-native-community/datetimepicker`), run `npx expo run:ios` again; reloading JavaScript is not enough and the app will crash on launch.

With `EXPO_PUBLIC_USE_MOCK=1`: mock login (OTP `123456`): phone `+225 07 12 34 56 78` or `amina@staffsync.app` (employee in three companies), phone `+225 05 11 22 33 44` or `karim@staffsync.app` (site manager). `disabled@staffsync.app` shows the deactivated screen, any unknown number or email the "not invited" screen, and airplane mode the offline screen. Proxy PINs: Joseph `4821`, Paul `1357`.

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

Dependencies point inwards: screens → hooks → repositories (`data/index.ts`) → domain. `src/data/repositories/http/` implements the interfaces over the API (client in `src/data/http/`, with token refresh, a 426 "update required" screen and a WebSocket for the manager roster); `src/data/mock/` is the offline demo backend. `EXPO_PUBLIC_USE_MOCK` picks one.

## Security

- Tokens and device id live only in Keychain/Keystore (`core/security/secure-storage.ts`); AsyncStorage holds non-sensitive preferences and the offline queue (GPS points, no credentials).
- Identifiers entered at login are held in memory only, never in URLs or storage.
- Check-ins are never blocked for location reasons; mock location, low accuracy, clock tampering and unregistered device are recorded as flags (mirrors the server pipeline).
- Location is read on demand or while a map screen is open, never in the background.
- Check-ins carry a `clientEventId` for idempotent offline sync.
