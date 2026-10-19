# Known limitations

Tracked so they can be solved later. Tick an item when it is fixed.

## Open
- [ ] **Report numbers are generated:** `features/reports/model.ts` derives every figure from a hash of the report type, row and dates (so they are stable but not real). Saved reports and email schedules live in `store/reports.ts`; nothing is ever emailed. Exports (CSV, Excel, PDF) do work on the generated rows.
- [ ] **Static key check blind spots:** `yarn keys:check` cannot see keys built from variables or conditions with parentheses; verify those in the browser in both languages.
- [ ] **Audit log content is English-only mock data:** targets, reasons and before/after values in `data/audit.ts` are free text (as a backend would return user-entered text). Action names, target types and UI are translated. The log is static: edits made elsewhere in the dashboard do not add entries.
- [ ] **Profile & security are simulated:** profile edits, password change, 2FA (any 6-digit code is accepted, backup codes are random) and sessions live in `store/profile.ts` only. The profile timezone and phone are not used elsewhere; only the language change is applied (via the locale cookie).
- [ ] **Settings are stored but not applied:** values in `store/settings.ts` (timezone, date format, grace period, overtime rule, leave types, …) do not yet drive the rest of the app. Leave types in Settings are separate from the fixed `LeaveType` union used by the Leave module.
- [ ] **Settings integrations are simulated:** API keys, webhooks, SSO test, payment card, plan changes, invoices and the data export / company deletion only update local state and show toasts.
- [ ] **Custom roles are not enforced:** roles and users edited in Users & Roles live in `store/users.ts`. The signed-in demo session still uses the fixed admin/branch/site permissions (`lib/permissions.ts`), so a new role does not change the sidebar or page access yet.
- [ ] **Role editor has no URL:** it opens as a state inside `/users` (no `/users/roles/[id]`), so it cannot be linked or restored on refresh.
- [ ] **Invites are not sent:** inviting, resending and revoking only update the in-memory list and show a toast.
- [ ] **Sites vs. the rest of the app:** sites created in the site editor live in their own store (`store/sites.ts`) and do not appear in attendance, the dashboard or role scopes (`data/org.ts` is static).
- [ ] **Employee profile state:** the schedule, documents and notes tabs reset when leaving the page (local state, not in a store).
- [ ] **Address search:** uses the public OpenStreetMap Nominatim service, which is rate-limited. Needs a proper geocoding provider or proxy for production.
- [ ] **French job titles:** a single form is used, with no gender agreement.
- [ ] **Mock data:** all data is in memory (`src/data`, zustand stores) and resets on refresh. Needs the real API behind `services/` and `lib/api.ts`.
- [ ] **Leave balances:** the "used" figures are derived from a hash of the employee name, not real data. Adjustments last for the session only.
- [ ] **Browser coverage is partial:** every page loads without console errors in EN and FR in headless Chrome, and the main flows of Users & Roles, Settings, Reports, Profile, Audit and Leave were clicked through. Dashboard, Live, Attendance, Alerts, Employees, Sites and Schedules interactions were only partly exercised, and nothing was checked visually (layout, dark mode, tablet width).
- [ ] **Route guard is a demo marker:** `src/proxy.ts` redirects signed-out visitors using a plain `ss_auth` cookie set on sign-in. Replace it with a verified, httpOnly session token when there is a backend.
- [ ] **Legacy `nextjs/` folder:** still present; remove once the migration is accepted.
