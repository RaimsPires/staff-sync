# StaffSync integration status

Living tracker for linking **backend** (FastAPI), **admin** (Next.js) and **mobile** (Expo) end to end.
Plan: `~/.claude/plans/study-the-admin-peppy-wadler.md`. Update this file whenever a gap is found, fixed or a step finishes.

Legend: `[x]` done · `[ ]` open · **NEW** = found after the first write-up.

## 1. Progress by phase

| Phase | Scope | State |
| --- | --- | --- |
| 0 | Dev environment + seed (`make seed`, `backend/scripts/seed_dev.py`) | Done |
| 1 | Mobile HTTP layer: client, auth, profile, schedule, attendance, leave, notifications, manager | Done in code, **not run on a device** |
| 2 | Admin sign-in, session restore, `/me`, workspace picker, sign-out | Done in code, **not tested in a browser** |
| 3a | Admin: branches, sites, employees on the API | Done in code, API calls verified with curl |
| 3b | Admin: attendance, live board, alerts, dashboard | **Done in code** (not tested in a browser): live board, attendance page, alerts page and dashboard (KPIs, map, trend, methods, punctuality, activity, attention panel) on the API. Leave-related dashboard parts wait for phase 3c |
| 3c | Admin: schedules and leave | **Done in code** (API calls verified with curl; not tested in a browser) |
| 3d | Admin: settings, users and roles, reports, audit, billing, employee profile | **In progress**: settings, users & roles, reports, audit log, billing/plans and my-profile done and verified with curl; sign-in extras (two-factor code step, forgot/reset password, invitation page) and the sign-up wizard done and verified with curl; employee profile and site detail done; CSV import still to do |
| 4 | Realtime (WebSocket) on the admin live board | Done in code; push verified with a Python client against the live API; **not tested in a browser**. Mobile manager roster on WebSocket too |
| 5 | Cleanup: remove mocks, docs, one-command dev script | Not started |

## 2. Open gaps

### Blockers for real-device testing
- [x] Demo DB fake device bindings removed: DB wiped and re-seeded (no device registered for anyone).
- [x] Test data (leave request, check-in) removed by the re-seed.
- [x] Seed re-run from scratch after the role fix; completes cleanly. Verified: Karim logs in as `site_manager` and sees his site.
- [ ] **NEW** Nothing has been run on a simulator/phone (mobile) or in a browser (admin).

### Backend
- [x] Tests added for the site-manager role grant/removal and branch archive/restore.
- [ ] **NEW** `_sync_manager_role` skips users who already have any other role row, so such a user never gets site-manager.
- [x] Pre-existing failing i18n test fixed (Admin test helper now merges per-call headers). Full backend suite green.
- [x] E-mail (SMTP), SMS (Twilio / Africa's Talking) and push (Expo) providers are built and switch on from `backend/.env`; without credentials they only log (OTP and verify codes appear in the server log). Request shapes are tested with faked providers; **not tried against a real account**.
- [x] Built: Google Play Integrity verification (needs keys), Google/Microsoft SSO (needs keys), report PDFs, scheduled report e-mails, company data export, employee erasure endpoint. Still open: iOS App Attest verification, billing needs Stripe keys, selfie retention cleanup deletes the database references but not yet the stored files.
- [x] Uploads are really stored: S3-compatible when `S3_BUCKET` is set, otherwise on local disk (`LOCAL_STORAGE_DIR`) behind signed URLs.
- [x] `Backend API.md` / `Mobile App.md` compared with the OpenAPI schema; appendices added (only `POST /employees/{id}/erase` is documented but not built).
- [ ] **NEW** CORS allows only `http://localhost:3000`; refresh cookie is `SameSite=Strict`, so admin and API must share a site in production.
- [x] Site managers get the `site_manager` role scoped to their sites (fixed).
- [x] Archived branches can be restored (fixed).

### Mobile
- [ ] Offline queue, selfie upload and token refresh untested on a device.
- [x] Leave and correction attachments upload (done).
- [ ] Dev selfie/proxy-photo uploads are skipped (no object store); server gets a placeholder key.
- [x] Left as is: geofences arrive as polygons (cosmetic; the server decides pass/fail on the exact circle).
- [x] Manager notes now show on the roster (falls back to today's employee note).
- [ ] **NEW** Push token is never registered (`PUT /devices/me/push-token`).
- [x] 426 force-update: client flags it and the root layout shows a blocking update screen (EN/FR).
- [x] Proxy checks keep one `client_event_id` per attempt; queued replays use the queue id.
- [ ] **NEW** `UNSCHEDULED` error mapping unverified; unknown sync errors become a generic validation error.
- [x] Badge scan of an unscheduled employee shows "not scheduled at this site" instead of a blank time.
- [x] Not an issue: mobile users always have a smartphone, and web-only admins have no employee record so never reach the app.
- [x] `mobile/.env` is now gitignored.

### Admin
- [x] MFA sign-in code step exists (`mfa-step.tsx`).
- [ ] Still demo-only: SSO buttons, forgot password, sign-up/onboarding, invite page, profile (password/2FA/sessions), settings, plans/billing, users and roles, audit, reports, alerts, dashboard, live, attendance, schedules, leave.
- [x] Site editor sends real manager user ids and assigned employees (`PUT /sites/{id}/managers|employees`).
- [x] Site headcounts now come from `GET /attendance/live` counters (best effort; stays 0 without attendance permission).
- [ ] CSV employee import, badge and PIN not wired.
- [ ] **NEW** Static demo data (alerts, live feed, reports, users, audit) may still show next to real data.
- [ ] **NEW** Branch admins appear as "admin" in the workspace picker (login brief does not distinguish them).
- [ ] **NEW** Login lockout counter is client-side and separate from the server lockout.
- [ ] **NEW** Employee `access` always "employee", attendance rate 0, plan limit hardcoded 20, "invited"/resend invite never calls the API, PIN lost on edit.
- [ ] **NEW** Not saved: site break minutes, branch holidays/workflow/admins.
- [ ] **NEW** Employee list capped at 200 (no pagination).
- [ ] **NEW** No `If-Match` ETag, so concurrent edits are last-write-wins.
- [ ] **NEW** A failed background save reloads everything, dropping other unsaved edits.
- [ ] **NEW** Unverified: whether deactivated sites appear in `GET /sites`.
- [ ] `ss_auth` cookie is only a presence marker for `proxy.ts`; the real check is the client gate.

### Realtime findings
- [x] **NEW (backend bug, fixed)** The ARQ worker registered all six jobs under one name (`_job.<locals>.run`), so only the retention job ever ran: the outbox relay never published live events, webhooks never sent, absences and missing check-outs were never detected. Fixed in `workers/settings.py` with a regression test.
- [ ] **NEW** Live pushes need the worker running (`make worker` in `backend`); `make dev` starts only the API. Relay runs every 5 s, so a push arrives up to ~5 s after the action.
- [x] Mobile manager roster, summary and leave inbox refresh from the WebSocket (`mobile/src/data/http/realtime.ts`, `useManagerLive`); 9 s polling only while the socket is down. Verified with a manager token: only his own site's events arrive. Not run on a device.
- [ ] **NEW** The WebSocket only reloads today's board; leave pushes (`type: "leave"`) are received but ignored until the leave module is wired.
- [ ] **NEW** WebSocket reconnect/backoff and the paused state were not exercised in a browser.
- [ ] **NEW** The e2e runs left more test data (several employees checked in/out today, Amina's device bound). Re-seed before real-phone testing.

### Employee profile and site detail findings
- [x] Employee profile (`services/employee-profile.ts`): month attendance, device (and reset), activity log, notes, leave balances/history/adjustment, weekly schedules (add/edit/remove for single-person schedules), upcoming interventions from the planner, new badge with one-time PIN and QR, resend invitation. The fake generated data (attendance, devices, leave history, documents, seeded notes) is gone, and the profile uses the real calendar instead of October 2026. Verified with curl: month, device, activity, notes, badge, schedules, device reset.
- [x] Site detail: today's roster, history, weekly schedule and the four stat cards come from real records and planner shifts; assigning/removing employees (`PUT /sites/{id}/employees`) and site managers (`PUT /sites/{id}/managers`) now save to the server, and the proxy check-in on the roster is a real proxy check-in.
- [ ] **NEW** Employee documents (contracts, IDs...) have no backend; the tab says so and offers no upload.
- [ ] **NEW** A schedule shared by several people can't be edited from one person's profile (it points to the planner); the "login history" list on the device tab is gone (the server keeps none).
- [ ] **NEW** Site detail: the map shows people around the site at a fixed distance (their real positions aren't in the board data); managers who have no dashboard account can't be removed from the page; the site "arrival time" is the average check-in over the loaded month.
- [ ] **NEW** Issuing a badge switches an employee to "no smartphone" mode on the server (invitation no longer possible until they are given a phone again).

### Sign-in, invitation and sign-up findings
- [x] Sign-in: the two-factor code step (with "trust this device"), "Forgot password" emails a reset link, and a new `/reset-password` page sets the new password; a new `/invite/[token]` page shows the real invitation (company, inviter, role, email), expired and already-used links, and accepting signs the person in. Verified with curl: 2FA login with a real code, wrong code, invitation preview/accept/accept-again, forgot + reset.
- [x] Sign-up wizard (`services/onboarding.ts`): each step saves on the server (account → email code → company → first branch → first site with its geofence → opening hours and grace period → team → finish). Team members become employees (invited by SMS/email) or dashboard users for manager roles, and get a published "Default hours" schedule. Verified by replaying the wizard's exact requests.
- [x] **Backend bug found and fixed:** signing up with a phone number that another account already has returned a 500; it now answers `409 PHONE_TAKEN` (with a test and a French message).
- [x] Removed demo rules from the wizard: personal email addresses (Gmail...) are no longer rejected, `000000` is no longer always "wrong", and the password rule is 10 characters like the server.
- [ ] **NEW** Single sign-on (Google/Microsoft) buttons on sign-in, sign-up and the invitation page show "not available yet" (the server has none configured).
- [ ] **NEW** CSV import in the wizard's team step doesn't import anything (the file isn't kept); use Employees → Import once the workspace is open. The old demo page at `/invite` (with `?state=`) still exists and shows a sample invitation.
- [ ] **NEW** The wizard's plan step only records the choice; the 30-day trial starts automatically and checkout happens later in Settings → Plans. The wizard can't resume if the browser is closed halfway (the progress is in memory; the account itself exists, so signing in continues).
- [ ] **NEW** The sign-in form's lockout display still counts attempts in the browser; the server's own lockout is reported as "locked".

### Reports, audit, billing and profile findings
- [x] Reports (`services/reports.ts`): the numbers come from `POST /reports/preview` (columns are the server's: records, hours, overtime, late count/minutes, absences, flags, proxy); saved reports and their schedule are stored on the server; date presets (this month, last month, 7 days, last quarter) are computed from today. Backend: the report definition now also takes `branch_ids`, `employee_ids` and `range_key` (with a test). CSV/Excel/PDF export still happens in the browser from the loaded rows.
- [ ] **NEW** The "Leave" report type is gone (the server has no leave report); the leave screens have their own calendar and balances.
- [ ] **NEW** Scheduled report emails are stored but never sent (no worker job); the "next delivery" date is only computed in the browser.
- [x] Audit log (`services/audit.ts`): real entries from `GET /audit-logs` (date range on the server, up to 500 newest entries; actor, action and type filtered in the browser). Server actions are grouped into the screen's categories; ones without a category show their own text.
- [ ] **NEW** The audit log has no per-site data, so the branch and site filters were removed, "scope" always reads "Company", and the "open target" link is still a toast. Different actors' "devices" are derived from the browser's user agent.
- [x] Billing/plans: subscription, trial end, seat usage and seat limits come from `GET /billing` and `/billing/plans`; "change plan" starts a Stripe checkout, "Manage payment" opens the Stripe portal, invoices come from Stripe; the fake card form is gone; "Export data" and "Delete company" call the server (the export is only queued, see backend stubs).
- [ ] **NEW** Billing needs Stripe keys and prices. Without them the screens say billing isn't set up (verified: checkout answers `PRICE_NOT_CONFIGURED`, portal/invoices `BILLING_NOT_CONFIGURED`). The plan cards' names/prices/features are still the admin's own copy; only seat limits come from the server (UI "Business" = server "growth", "Enterprise" = "scale"). Yearly vs monthly is not read back from the server.
- [x] My profile (`services/profile.ts`): name and language save to the server; password change (wrong current password is reported); two-factor setup with a real QR/secret, code check and one-time backup codes, turning it off with the password; active sessions list and sign-out; notification choices are saved and read back (backend: `/me` now returns `notification_prefs`). Verified with curl including a real TOTP code.
- [ ] **NEW** Email, phone and time zone in "Edit details" don't persist (no server field on `/me`); backup codes can't be regenerated without turning two-factor off and on again.

### Users & roles findings
- [x] Users & roles on the API (`services/users.ts`): roles (create/edit/delete custom roles, built-in roles read-only), dashboard users (invite, change role and scope, revoke). Verified with curl, including the permission round trip and that system roles can't be deleted.
- [x] **Permission model aligned (behaviour change):** the role editor's matrix now only offers what the server can grant (e.g. attendance view/edit, employees view/edit, leave view/approve, users & roles "edit"); "create/delete" are part of "edit". The mapping lives in `lib/access-catalog.ts` (`BACKEND_PERMS`). The admin's page and button gating now comes from the real permission list in `/me` (`permissionsFromBackend`), not from a role label, so e.g. an HR/Viewer sees only what they may use.
- [ ] **NEW** Revoking removes the person's roles, so they disappear from the users list instead of showing as "revoked", and "Restore" cannot work (it reports that the person must be invited again).
- [ ] **NEW** "Resend invitation" is still only a toast (no endpoint); invitation emails are console-only in dev. The invited person's name is derived from the email address.
- [ ] **NEW** A custom role has no stored scope: the scope picked in the role editor is not saved, scope is chosen per assignment. Server permissions with no counterpart in the editor (e.g. "recommend leave") are hidden.
- [ ] **NEW** The built-in "Employee" role is hidden from the dashboard; the old demo roles (HR manager, payroll...) are gone with the demo data.
- [ ] **NEW** "Roles preview" in the editor stays client-side (the server's preview endpoint isn't used).

### Settings findings
- [x] Settings on the API (`services/settings.ts`): company name/timezone/language, attendance rules (grace, early leave, auto check-out, GPS accuracy, block mock location, default selfie/QR, offline, max sync delay), approval levels, notification rules, leave types (create/edit/delete), API keys (secret shown once), webhooks (create/enable/delete). Changes apply immediately and roll back with a toast if the server refuses. The client's late/early rules now use the server's grace period instead of a local default.
- [x] Verified against a scratch API: company, attendance, leave policy and notification PATCHes, leave type create/edit/delete, API key create/revoke, webhook create/toggle/delete all succeeded with the exact bodies the admin sends.
- [ ] **NEW** No server field for: company address, date/time format, week start, overtime rules, "ignore missing check-out", payroll export, SSO, holiday calendar per city, or the SMS-channel roles beyond the five listed; those stay local and reset on reload. The webhook event "schedule published" has no server event and is dropped.
- [ ] **NEW** Server rules that differ from the screen: "Missing check-out: ignore" is saved as "flag for review"; the max sync delay and accuracy limits must be whole numbers within what the server accepts (errors show as a toast).
- [ ] **NEW** The Settings "Billing" and "Danger zone" cards are still demo (billing and company deletion are not wired).

### Leave findings
- [x] Leave on the API (`services/leave.ts`): requests inbox (all statuses), approve / reject / request changes / cancel approved (single and bulk), approval trail and rejection reason (loaded when a request is opened), real "shifts affected" from the coverage endpoint, balances per employee/type/year with adjustments, leave types, public holidays. Approved leave and holidays now feed the planner's conflict checks. Verified with curl: approve, reject (comment in timeline), request changes, bulk, cancel, adjust.
- [ ] **NEW** Leave types and the allowances in Settings are read from the server, but creating/editing them in Settings is still local (settings module not wired).
- [ ] **NEW** The "notify the employee" switch in the leave drawer is not sent anywhere (the server decides).
- [ ] **NEW** Attachments: the drawer's document viewer is still a mock; there is no admin endpoint to fetch a presigned download for a leave attachment.
- [ ] **NEW** The approval stage shown ("awaiting site manager" vs "HR") is inferred from status and levels; "stage date" and "cancelled on" are not available from the list endpoint.
- [ ] **NEW** The demo DB has no holiday calendar, so no holidays show. Balances are loaded for this year and next, and per year when you browse the balances view. The inbox is limited to the latest 200 requests.
- [ ] **NEW** Half days: only the start half (morning/afternoon) is shown.
- [ ] **NEW** The employee profile's leave tab and the employee workspace are still demo data.
- [ ] **NEW** Planner leave conflicts use a module-level calendar rebuilt when leave changes; fine for display, but a request approved elsewhere shows only after the next reload (no live push for leave yet; the WebSocket sends leave events that nothing reads).
- [ ] **NEW** The e2e leave test left Amina with approved/rejected/cancelled/changes-requested requests and a balance adjustment (+2); re-seed before the real-phone test.

### Schedules findings
- [x] **Backend (new):** draft schedules now generate `draft` shifts that only the planner sees (employees, the live board, the manager screens, leave logic and check-in ignore them via `LIVE_SHIFT`); publishing flips them live; `PATCH /shifts/{id}` can reassign employee/site (refused once the shift has a check-in); `DELETE /shifts/{id}` cancels one occurrence; the planner endpoint returns titles and hides cancelled shifts; copy-week keeps drafts as drafts. 3 new tests; French catalogue updated.
- [x] Admin planner on the API (`services/schedule.ts`): week/day/month grids read the real shifts (two weeks back to five ahead of the current week), create schedule (recurring, rotation, intervention) in one call, drag/resize/reassign/delete a shift, publish, copy previous week, assign an open intervention. Verified with curl.
- [ ] **NEW** Publishing always sends `confirm_conflicts: true`, so leave/holiday/overlap conflicts the server detects are published silently; the publish dialog should call `/schedules/validate` and show them first.
- [x] The "New schedule" form's conflict preview and the planner now use approved leave and holidays from the leave module (still not the server's `validate` result).
- [ ] **NEW** Overnight shifts show cut at midnight; moving keeps their length, resizing them is ignored.
- [ ] **NEW** A shift cannot be unassigned (the server needs an employee); the planner shows an error and rolls back. Employee groups do not exist on the server, so "group" mode is empty.
- [ ] **NEW** Approved leave that overlaps a draft shift is not applied when the schedule is published (the shift stays "scheduled" instead of "on leave").
- [ ] **NEW** The planner loads one fixed window when you sign in; navigating beyond it, or other admins' changes, do not appear until reload. No live updates for schedules yet.
- [ ] **NEW** The planner identifies people by name, so two employees with the same name would be confused.
- [ ] **NEW** `fr/LC_MESSAGES/messages.mo` is now compiled in the tree (untracked); `tests/test_security_matrix.py` has an old import-order lint error.

### Dashboard findings
- [x] Dashboard on real data: KPIs, map, punctuality, methods and the activity list are counted from the day's records (today = live board, other days of the month = loaded history); trend and the "vs yesterday" change come from `GET /dashboard/overview`; the "updated N s ago" indicator and pause use the real feed; the simulated event stream (`use-live-feed.ts`) is gone.
- [x] Attention panel: dismiss flag → alert approve; set check-out → record edit to the scheduled end; unscheduled check-ins and uncovered interventions come from alerts (approve/reject on the server).
- [x] Pending-leave KPI and the leave items in the attention panel now read the real leave requests.
- [ ] **NEW** "Remind" (missing check-out) and "notify" (uncovered) in the attention panel only hide the item locally; no backend call exists for them.
- [ ] **NEW** Trend shows only days that have data; on a fresh DB that is just today, so the chart and its change are nearly empty until history builds up. Other KPI "vs yesterday" changes are flat (only expected/present come from the API).
- [ ] **NEW** Past days only cover the current month and only rows that exist as records; a day whose absences were never recorded shows too few "expected".
- [ ] **NEW** The Sites page headcounts (expected/present/late...) are filled once at sign-in and go stale; they are not refreshed by the live feed.
- [ ] **NEW** `data/live.ts` still holds unused demo exports (`UNSCHEDULED`, `UNCOVERED`, `STREAM_POOL`, `BOARD_EVENTS`, `METHOD_SPLIT`, `QR_RECORD_IDS`) (no code reads them any more except their own definitions); remove in the cleanup phase. Fixed: attendance and live board no longer label records 5 and 11 as QR check-ins (a demo rule).

### Alerts findings
- [x] Alerts page on the API (`services/alerts.ts`): list, lazy detail (evidence, device, notes), approve/reject, bulk resolve, notes, escalate. Verified with curl: a mock-location, out-of-fence check-in raised a high alert; list, detail, note, escalate and approve all worked.
- [ ] **NEW** Escalation targets come from `GET /users` (needs the users permission); without it the Escalate button is hidden.
- [ ] **NEW** Alert reject has one outcome on the server ("absent" vs "invalid" in the UI is kept locally only); "resolved by" is not returned by the API, so the resolved banner has no name after a reload.
- [ ] **NEW** Alert list shows distance-based wording only after the detail is opened (the list endpoint has no distance); previous-check-ins history is empty (API gives only a count of past flags); selfie images are not displayed (URLs not used yet); the map pin is placed from distance with a made-up bearing, not the real check-in point.
- [ ] **NEW** Uncovered-intervention alerts have no title/slot text from the API, only the reasons.
- [ ] **NEW** Call/message buttons on an alert are still toasts.
- [ ] **NEW** The e2e alert test deleted and re-created Amina's check-in today (flagged, then approved); Amina is bound to device `e2e-device-0001`.

### Step 3b findings
- [ ] **NEW** The e2e check just run left test data again: Amina is bound to device `e2e-device-0001` and has a check-in today; Joseph has a proxy check-in. Re-seed (`make reset && make seed`) before testing on a real phone.
- [x] Live board now updates by WebSocket (`services/realtime.ts`, `features/auth/live-feed.tsx`): a push triggers a debounced reload; reconnects with a fresh ticket and backoff; falls back to 10 s polling while disconnected. Pausing the board stops reloads. (User note in `OTADD.md`: live services should use WebSocket.)
- [x] Flag toast restored: `loadToday` reports rows that became flagged between reads.
- [ ] **NEW** Live board clock uses the first site's time zone for every site.
- [ ] **NEW** Live board "remind" bulk action is still a toast only; row "call" shows a made-up number (`phone + 10 + id`).
- [ ] **NEW** `DEMO_TODAY/MONTH/YEAR` now follow the real date, but the screens still work on a day-of-month number inside the current month (breaks across month ends) and the dashboard's other-day figures are still fabricated (`dayFactor`).
- [ ] **NEW** Proxy check-ins made from the dashboard are stored with method `admin`, so they show as "admin", not "proxy".
- [ ] **NEW** Job titles are mapped from the employee's title to the board's job list best-effort (default "site technician").
- [x] Attendance page on the API (`services/attendance.ts`): past days of the current month (`loadHistory`), edit times/status (PATCH, or a manual record when the row has none yet), delete, notes, manual record, flag approve/reject (via the record's alert), bulk absent. Verified with curl: edit, note, manual create, list, delete.
- [ ] **NEW** Approving a non-flagged record does nothing on the server: `POST /attendance/bulk {action: approve}` returned `processed: 0`. The "approved by" state exists only in the UI; the success toast still shows. Needs a decision (backend support for record approval, or remove the UI action).
- [ ] **NEW** Flag review (`reviewFlag`) was not exercised: no flagged record existed to test with.
- [ ] **NEW** Record drawer notes and edit history only show for the current session; they are not read back from the server.
- [ ] **NEW** The attendance page only covers the current month (one-month day-number model); earlier months are not reachable. Export still uses the loaded rows only.
- [ ] **NEW** "Add record" can only pick employees who have a shift today (it lists today's board rows); attachments (evidence files) are not uploaded.
- [ ] **NEW** Saved views and the "Paris late" default view are demo data; the filters still offer demo branch codes.
- [ ] **NEW** Dashboard "attention panel" actions (clear flag, close missing check-out, remind, unscheduled, uncovered) still change local state only.

### Design findings (step 3b)
- [ ] **NEW** Attendance, live board, alerts and dashboard screens are built on a fixed demo date (`DEMO_TODAY = 15 Oct 2026` in `data/live.ts`), a simulated clock starting at 10:42, numeric record/employee ids and a "day of October" `date` field. They can't just be fed API data; each needs its data layer reworked (real dates, string ids). Approach: start with the live board (rows match `/attendance/live`), then dashboard, then attendance table/drawer, then alerts.

### Housekeeping
- [ ] **NEW** `.vscode/settings.json` shows as modified (not by me).
- [ ] **NEW** Background API (`:8000`, log `/tmp/api.log`) and Docker containers are left running.
- [ ] Nothing is committed.

## 3. Next steps, in order
1. **Unblock device testing:** reset the two fake device bindings, re-run the seed from scratch, confirm it end to end.
2. ~~Admin 3b~~ done in code: live board, attendance page, alerts, dashboard.
3. ~~Realtime (4)~~ done for the admin live board and the mobile manager roster.
4. **Run it for real:** open the admin in a browser and the mobile app on a simulator; walk the check-in → admin-sees-it flow; fix what breaks.
5. ~~Schedules and leave (3c)~~ done in code; next **settings, users/roles, reports, audit, billing, employee profile (3d)**.
6. **Close mobile gaps:** attachment uploads, push token, 426 handling, idempotent proxy replay.
7. **Admin gaps:** MFA step, onboarding/sign-up, invite, profile, ETag handling, pagination.
8. **Backend tests** for the new role logic; compare the two spec docs with the code.
9. **Cleanup (5):** remove mocks, update docs/READMEs, add a one-command dev script, review `.gitignore`.

## 4. Change log
- Phase 0: seed script, `make seed`, env files.
- Phase 1: mobile HTTP client + all repositories; `siteId` on proxy flow; mapper tests.
- Backend: site-manager role grant; branch un-archive.
- Phase 2: admin sign-in, `/me`, session gate, workspace picker, sign-out.
- Phase 3a: admin branches/sites/employees read and write through the API; demo stores cleared on sign-in.
- Step 1: DB wiped and re-seeded; manager role verified. Site headcounts from `/attendance/live`.
- Phase 4: WebSocket live feed in the admin; fixed the worker job-name bug (outbox relay was not running); `make worker`.
- Mobile manager screens use the shared WebSocket (one socket for all manager screens).
- Reports, audit log, billing/plans and my-profile on the API.
- Users & roles on the API (roles, users, invite, assign, revoke); permission catalogue aligned with the server; UI gating from `/me` permissions.
- Settings on the API (company, attendance rules, approval levels, notifications, leave types, API keys, webhooks); verified with curl.
- Leave on the API (inbox, decisions, balances, types, holidays, coverage); planner conflicts use real leave.
- Schedules: backend draft shifts, reassign and cancel; admin planner on the API.
- Dashboard on real data (records, overview endpoint, attention panel via alerts); simulated live stream removed.
- Alerts page on the API (list, detail, resolve, bulk, notes, escalate).
- Attendance page on the API: history, edit, delete, notes, manual record, flag review, bulk actions.
- Step 3b (part): `services/attendance.ts` loads today's board, proxy check-in and mark-absent via the API; 10 s poller; live board clock is real; verified with an employee check-in + proxy check-in against the live API.
- Employees CSV import creates employees one row at a time through `upsert` (phones need a country code, e.g. +237…); failed rows are reported, others still import.
- Plain-record approval: backend appends an `approval` entry to `edit_history` on bulk approve and exposes `approved_by/approved_at` on live rows; admin shows it in the record drawer.
- Revoked dashboard users stay listed with status "revoked" (`GET /users`) and can be restored with `POST /users/{id}/restore` (needs a role and scope). Admin restores them read-only (viewer, company scope); change the role afterwards. Test: `test_a_revoked_dashboard_user_stays_listed_and_can_be_restored`.
- Still open: "Resend invitation" for dashboard users, employees pagination above 200, leave attachment viewer, mobile attachment upload and push token registration, SSO stub.
- Resend invitation for dashboard users: `POST /users/{id}/resend-invite` expires earlier links and emails a fresh 7-day one with the same role; admin "Resend invitation" calls it and toasts on success or failure. Test: `test_resending_an_invitation_replaces_the_old_link`.
- Mobile attachments: leave requests and corrections now upload the picked file (`leave-attachment` / `correction-attachment`) and send the key; push token is registered with `PUT /devices/me/push-token` when notifications are allowed in setup. Typecheck and 68 jest tests pass. Untested on a device; dev backend hands out placeholder upload URLs, which are skipped.
- Gap: editing a pending leave request without picking a new file sends no `attachment_keys`, and the API defaults that to an empty list, so the old attachment may be dropped. Needs a decision: keep existing keys on the server when the field is omitted.

- Leave edit: `PATCH /me/leave/requests/{id}` keeps existing `attachment_keys` when the field is omitted (test added). Test helper `Employee.patch` added.
- Admin employees: `loadOrg` pages through `/employees` (200 per page) until a short page, so no cap.
- Leave attachment viewer: `GET /leave/requests/{id}` now returns `attachments: [{key,url}]` (presigned, 5 min); the drawer shows download links instead of the fake preview (dev storage URLs are placeholders). Removed unused preview strings.
- Cleanup: removed unused demo exports (STREAM_POOL, BOARD_EVENTS, METHOD_SPLIT, QR_RECORD_IDS), the demo `/invite` page, scratch API/worker and the `staffsync_scratch` database. Backend suite, ruff, admin typecheck/i18n/keys pass.
- API sequential test (fresh scratch DB + seed, scratch API on :8001, torn down after): owner login; 35-endpoint read sweep clean (400s only for missing required params; billing invoices 503 without Stripe keys); mobile OTP login, device register, push token, scheduled check-in (late, shift linked), live counters, unscheduled check-in needs `accept_unscheduled` (flagged, not on the live board by design), check-out, record edit + note, alerts list/detail, leave preview/create/edit/approve with mobile reading it back, role create/delete, audit, dashboard, billing plans. No backend bugs found. Seed shifts are 08:00-17:00 Douala, so outside those hours check-ins are unscheduled.
- **Not covered by this test** (needs a browser/phone): all admin screens, mobile UI, offline queue replay, WebSocket in the browser, proxy check-in with PIN, MFA, sign-up wizard, invite/reset flows in the UI.
- Mobile: 426 update screen, proxy idempotency key, `UNSCHEDULED` now mapped for proxy checks (was falling to a generic error), manager add-note mapping verified against the API (body field, `employees.view` held by site managers). tsc clean, 70 jest tests pass. ESLint config fails to load in this environment (pre-existing), not run.
- Admin: employee list Resend invitation and Reset device now call the API (were toasts only). Form no longer invents a badge PIN client-side (it was never sent); the badge/PIN is issued from the profile and shown once, with a hint in the drawer. Typecheck, i18n and keys checks pass.
- Backend: tests for site-manager role sync and branch restore; fixed the `test_security_matrix.py` import order. Suite green, ruff clean.
- Still open: SSO, sites headcount refresh, site managers/employee assignment from the site form, `_sync_manager_role` skipping users with another role (by design), Backend API.md / Mobile App.md comparison, French check of restore/resend text, CORS/cookie for production, README/docs and a root dev script, `hasSmartphone` hardcode and web-only admin role label on mobile.
- Mobile iOS crash on launch (EXC_BAD_ACCESS in RCTThirdPartyComponentsProvider): the installed build was missing the RNDateTimePicker pod (package present, pod never installed), so NSClassFromString returned nil inside an NSDictionary literal. Fix: regenerate native project and rebuild (`npx expo prebuild --platform ios` was run; user must run `npx expo run:ios`). The ios/ folder is gitignored; Pods and build output were regenerated.
- Session 2026-10-24: scratch-stack API test of WebSocket push, proxy with PIN (incl. replay), schedules, corrections, invite/accept/reset, MFA, sign-up, import, reports, settings: all pass. Admin production build compiles.
- Admin: site editor now saves managers and employees; headcounts refresh on open and every minute; SSO buttons call the API and say it is not configured (no fake redirect). Mobile: unscheduled badge text. Backend: roster note fallback + test. Root `scripts/dev.sh` (`--seed`, `--lan`), root and package READMEs rewritten, `UI-TEST-GUIDE.md` written.
- Still open: SSO (needs provider credentials), company data export, report PDFs/scheduled emails, real object storage, email/SMS/push providers, attestation, permanent erasure endpoint, mobile ESLint config does not load, and the whole UI walkthrough in `UI-TEST-GUIDE.md`.

## Session 2026-10-25
- Admin refresh logged people out: refresh-token reuse detection treated a refresh whose response the browser dropped (reload, hot reload) as theft. A token rotated in the last 30 s is now accepted once more; later replays still revoke the session. Test updated.
- Site managers could not act on leave under one-level approval (the default): `recommend` is now allowed as advice (request stays pending, approver sees it), and the admin leave drawer has Recommend / Advise against for users who can recommend but not approve.
- Mobile sign-in is now identifier (e-mail or phone) + password, then a one-time code sent to the account's e-mail (SMS if none). Accounts without a password sign in with the code once and create one (`POST /me/password/initial`). Mobile: password field, create-password screen.
- In-app chat: direct conversations between company members and one group per site (attached members, plus anyone with the new `chat.sites` permission, which the Super admin and Branch admin roles have). Live over the WebSocket, push notifications, photos/videos/PDFs. Backend (`modules/chat`, migration 0003), admin page + sidebar badge + role-editor row, mobile Messages tab / thread / new-chat screens. Tests: `tests/test_chat.py`.
- Real file storage, profile photos (`/uploads/avatar`, `PATCH /me`), providers, SSO, PDFs and scheduled reports, company export, erasure, Play Integrity: see `Backend API.md` section 18. Credentials all live in `backend/.env.example`.
- Test fixes: helper no longer schedules a shift on yesterday just after midnight; absence test uses an explicit clock.
- Still open: iOS App Attest verification and the app sending attestation tokens; voice-note recording in chat; message edit/delete; an admin button for erasing a person; admin and mobile screens for chat were type-checked and built but **not run in a browser or on a device**; real provider accounts untested.

## Cleanup 2026-10-25
- Removed (nothing referenced them): admin `module-page`, `ui/card`, `ui/field`, `data/workspaces`, demo constants (`ALERTS` and its helper, `SEED_BRANCHES`, `COMPANY_EMPLOYEES`, `INVOICES`), 14 unused admin functions/types, 4 unused mobile functions, the Expo template `reset-project` script (it would have wiped `src/` if run), 11 unused backend enums, 8 unused backend helpers, and 5 unused Python packages (`authlib`, `firebase-admin`, `pillow`, `python-magic`, `prometheus-fastapi-instrumentator`). `google-auth` and `requests` are now declared explicitly because Play Integrity uses them.
- Found two finished features that were never connected, and connected them: the forced-update check (`APP_VERSION_MIN` now really answers 426 to old mobile builds) and the billing grace job (past-due companies become read-only after `BILLING_GRACE_DAYS`, daily at 04:00). Tests added for both.
- Rewrote `admin/docs/KNOWN-LIMITATIONS.md`, which still described the mock-data era.
- Left alone on purpose: `OTADD.md` (your own notes), `greenlet` and `python-multipart` (needed at runtime although never imported by name).
- Mobile keyboard handling: `Screen` and `BottomSheet` now lift their content (footer buttons included) above the keyboard, dismiss it on tap-outside and on drag, and scroll a focused field into view; the correction sheet, chat thread and country list got the same. Type check and jest pass; **not tried on a device** (see UI-TEST-GUIDE B0).
