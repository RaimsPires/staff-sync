# Known limitations (admin dashboard)

Things that are true today and worth knowing. Tick or delete an item when it is fixed.

## Open
- [ ] **Not tested in a browser by the author:** the screens type-check, build and are covered by the API tests behind them, but every page still needs a click-through in EN and FR, light and dark, desktop and tablet width. `../UI-TEST-GUIDE.md` at the repository root lists what to check.
- [ ] **Static key check blind spots:** `yarn keys:check` cannot see keys built from variables or conditions with parentheses; verify those in both languages in the browser.
- [ ] **Route guard is only a hint:** `src/proxy.ts` redirects signed-out visitors using a plain `ss_auth` cookie that the browser sets after sign-in. It is a convenience, not security: the real session is the API's httpOnly refresh cookie plus the access token in memory, and every API call is checked by the server.
- [ ] **Address search:** uses the public OpenStreetMap Nominatim service, which is rate-limited. Use a proper geocoding provider or a proxy for production.
- [ ] **French job titles:** a single form is used, with no gender agreement.
- [ ] **Some settings are informational:** the overtime rule and approval, mock-location blocking, max sync delay, branch holiday calendars and the payroll export format are stored but not enforced by the backend yet.
- [ ] **Sample data left in `src/data`:** a few demo constants remain (for example the sites and tables used before the API data loads, and the live-board date helpers). They are replaced as soon as the API answers.
- [ ] **No dashboard button to erase a person:** the API has `POST /employees/{id}/erase`; the screen for it is not built.
- [ ] **Motion coverage:** modals, drawers, menus, the sidebar backdrop and page changes animate in and out (`lib/use-presence.ts`, `.ss-*` classes in `globals.css`, reduced motion respected). The global search panel and toasts only animate in. A new conditionally rendered modal needs `<KeepMounted show={…}>` around it to animate out.

## Fixed
- [x] Everything below used to be simulated and now runs on the API: sign-in (with two-factor, reset and invitations), organisation, employees (with CSV import), attendance, alerts, live board, schedules, leave, settings, users and roles, reports (CSV, Excel, PDF, scheduled e-mails), audit log, billing, profile, onboarding and chat.
