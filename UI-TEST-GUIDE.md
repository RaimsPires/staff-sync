# StaffSync: what to test yourself in the UI

Written for: you, running the admin dashboard in a browser and the mobile app on a simulator or phone.

I could not click through either UI from my side. What I did check is listed at the end, so you know what is already covered and where to look first if something breaks. Tick the boxes as you go. When something fails, note the screen, what you did, and the error text; the API log (`backend` terminal) shows the matching request.

## 0. Set up

1. Start from a clean database so old test data and device bindings are gone:
   ```bash
   cd backend && make reset      # wipes the dev database
   cd .. && ./scripts/dev.sh --seed --lan
   ```
   `--lan` lets the phone reach the API and rewrites `mobile/.env` with your computer's address. Run `ifconfig`/System Settings if you want to check the address it picked.
2. Mobile (second terminal): `cd mobile && npx expo run:ios` the first time, or after any package with native code was added. Later: `npx expo start`. If the app closes on launch, rebuild with `run:ios`; reloading JavaScript does not fix a missing native module.
3. Time matters. The seed's shifts run **08:00 to 17:00 in Douala (UTC+1)**. Outside those hours a check-in is "unscheduled" and goes to review (this is intended). Easiest: in the admin, create an all-day schedule (section 7) before testing check-ins.
4. Codes and links are not emailed or texted. Look for `notify` lines in the API terminal: login codes (`Your StaffSync code is 123456`), invitation links, password reset links, verification codes.

Logins from the seed

| Who | Where | Login |
| --- | --- | --- |
| Owner (admin) | Admin | `owner@staffsync.app` / `staffsync-demo-1` |
| Amina Nkodo | Mobile, employee | phone `+2250712345678` |
| Joseph Ewane | Mobile, employee | phone `+237670000002` |
| Paul Mbella | Mobile, employee | phone `+237670000003` |
| Grace Tabi | Mobile, employee | phone `+237670000004` |
| Karim Mbarga | Mobile, site manager | phone `+2250511223344` |

Sites: Bonanjo Tower (9.7679, 4.0511) and Akwa Warehouse (9.7043, 4.0483), 150 m circles. On the simulator set a location: Features > Location > Custom Location, `4.0511, 9.7679`. Requesting a code twice within a minute is rate limited ("please wait").

## 1. Admin: sign-in and organisation

- [ ] Sign in with the owner login. You land on the Overview. Wrong password shows an error and counts attempts; refresh keeps you signed in.
- [ ] Sign out, then open a deep link such as `/employees`: you are sent to sign-in and returned afterwards.
- [ ] Workspace picker shows "Demo Logistics".
- [ ] Switch language EN/FR and light/dark from the account menu; the choice survives a refresh.
- [ ] Sites page: both sites are listed with a headcount; open one, check the map, QR, managers and employees tabs.
- [ ] Create a branch, then a site in it (draw a circle and a polygon). Pick a manager and tick some employees in the editor, save, and reopen: the manager and employees are still there (this was newly wired).
- [ ] Edit a site and change the manager list; the list on the site page updates. Archive then restore a branch (a branch with active sites cannot be archived: expected message).
- [ ] Sites headcounts change after a check-in without reloading (they refresh every minute while a sites screen is open).

## 2. Employees

- [ ] List shows the five seeded people. Search and filters work. More than 200 employees load fully (try the CSV import below with a bigger file if you want to check).
- [ ] Add an employee **with** a smartphone: leave "send invite" on. The API log shows an invite. Add one **without** a smartphone: the drawer explains that the badge and PIN are issued from the profile after saving.
- [ ] Open that profile and issue the badge: PIN and QR appear once. Reload: the PIN is not shown again.
- [ ] Row menu on an employee with status "invited": **Resend invitation** shows a success message and a new `notify` line appears in the API log.
- [ ] Row menu on an installed employee: **Reset device** succeeds. On the phone, that person must register the device again on next login.
- [ ] Deactivate and reactivate an employee. A deactivated person cannot log in on mobile.
- [ ] Import CSV: upload, map columns, fix a bad row, import. Rows with problems are reported by row.
- [ ] Profile tabs: overview, attendance, schedule, leave, notes, device, activity all open without errors.

## 3. Mobile: login, device, check-in

- [ ] Onboarding screens, then sign in with Amina's phone number. Her account has no password yet: leave the password empty, the code arrives (API log, or her e-mail once SMTP is set). After the code the app asks you to **create a password** (10 characters minimum). Sign out and sign in again: now the password field is required, then the code. A wrong password shows an error and repeated failures lock the account for a few minutes.
- [ ] Try signing in with the e-mail address instead of the phone number: same result. The code goes to the e-mail address when the account has one, otherwise by SMS.
- [ ] Setup: location permission, notification permission (the push token is registered after you allow notifications). The app opens on Today.
- [ ] Today shows the shift (if inside 08:00 to 17:00 or you created an all-day schedule). Check in with the simulator location at the site: success, status on time or late.
- [ ] Check in again: it says you are already checked in (no duplicate).
- [ ] Set the location about 1 km away and check out: the record is flagged, but the check-out is still accepted.
- [ ] Turn on a fake location (real phone with a mock-location app) and check in: flagged as mock location.
- [ ] Log out and log in as Joseph on the same simulator. I have not checked what the server does when a second person uses a device already registered to someone else; note the result (a "device already bound" message is the likely, intended one).

## 4. Live board and realtime

Open Admin > Live board and the mobile app side by side.

- [ ] Amina or Joseph checks in on the phone: the live board row updates within a few seconds without reloading, and the counters change.
- [ ] The Overview feed and the "needs attention" queue show the event.
- [ ] Stop the worker (`make worker` terminal) and check in: the board does not update live. Restart the worker; events resume. This confirms the board depends on the worker.
- [ ] A check-in outside any shift (unscheduled) does not appear on the board, but it creates an alert (section 6).

## 5. Attendance edits (admin)

- [ ] Attendance page lists today's records. Filter by site, status, date.
- [ ] Open a record: map, selfie placeholder, timeline, notes. Edit the check-in time with a reason: the history shows the change.
- [ ] Add a note. Add a manual record for someone who forgot. Delete then restore a record.
- [ ] Approve a flagged record. Mark someone absent (bulk).
- [ ] Export CSV downloads a file.

## 6. Alerts and corrections

- [ ] Alerts tab shows the flagged or unscheduled check-ins. Open one, add a note, approve or reject, escalate.
- [ ] On the phone, open a past record and request a correction (wrong time or forgot check-out), with an attachment picked from photos. The attachment upload works (the dev server does not keep the file, see "Known limits").
- [ ] In the admin, the correction appears; accept one and decline one. The employee gets a notification on the phone.

## 7. Schedules

- [ ] Create a recurring schedule for one site and several people (for an all-day test: start and end the same time, "crosses midnight" on). Validate shows conflicts if any. Publish.
- [ ] The phone shows the new shift under Schedule within a minute (pull to refresh).
- [ ] Reassign a single shift to someone else; cancel a single shift with a reason. The affected people are notified.
- [ ] Copy last week's schedule to this week.
- [ ] Draft schedules do not show on the phone until published.

## 8. Proxy check-in (site manager)

This is for people without a smartphone.

- [ ] Admin: create an employee without a smartphone, assign them to Bonanjo Tower, schedule them, issue the badge and note the PIN.
- [ ] Phone: log in as Karim (site manager). The manager tabs appear: roster, leave inbox, proxy.
- [ ] Proxy > pick the person (or scan the badge QR from the profile). Enter the PIN: success. Enter a wrong PIN: error with attempts left; after 5 wrong PINs the PIN locks and the photo option is required.
- [ ] Complete the check-in. It appears on the admin live board marked as a proxy check-in; check out the same way.
- [ ] Try a person who is not scheduled today: the app offers "check in anyway" and the record is flagged for review.
- [ ] Add a note to a person from the roster. It shows under their row afterwards (newly wired) and in the employee's notes in the admin.
- [ ] Put the phone in airplane mode and do a proxy check-in with a photo instead of a PIN: it is queued. Turn the network back on: the queue syncs once and no duplicate record appears.

## 9. Leave round trip

- [ ] Phone (Amina): new request, pick dates; the preview shows days, balance and warnings (short notice, overlaps, document required). Attach a file for a type that needs one. Submit.
- [ ] Edit the pending request without picking a new file: the old attachment is kept (fixed this session).
- [ ] Admin > Leave: the request shows in the inbox and the calendar. Open the drawer: balance, team coverage, trail. The attachment shows as "Attachment 1" with a download link (the link will not open real content in dev).
- [ ] Recommend as Karim on the phone (leave inbox), then approve in the admin. Also try request changes, reject (needs a reason) and cancel.
- [ ] The phone gets a notification for each decision, and the balance on the phone changes (pending, then used).
- [ ] Adjust a balance from the admin with a reason. Add and remove a holiday.

## 10. Offline sync (phone)

- [ ] Airplane mode, check in at the site: "saved, will sync". The settings screen shows the queued item.
- [ ] Network back on: it syncs, the record appears in the admin with the original time. Do it twice quickly to check nothing duplicates.
- [ ] Queue a check-in, then force-quit the app and reopen it: the queued item is still there.
- [ ] Leave the app idle until the access token expires (15 minutes) and use it: it refreshes silently and does not log you out.

## 11. Settings, users and roles, reports, audit, billing

- [ ] Settings: change attendance rules (grace period, selfie, offline), leave policy (one or two approval levels), notification settings. Reload to confirm they persist. A second level of approval changes how a leave request moves (site recommend, then HR approve).
- [ ] Users and roles: invite a user (the link is in the API log). Open it in a private window, set a password, sign in. Resend an invitation, revoke a user, then **Restore** (pick a role) a revoked user. Create a custom role, edit its permissions, delete it, restore it. A user with a narrow role should not see menu items they cannot use.
- [ ] Reports: preview each type, export CSV, save a report and reopen it. PDF and scheduled emails are not built yet.
- [ ] Audit log: your actions appear (role created, record edited, and so on); filter and export.
- [ ] Billing: plans list shows; the checkout and invoices pages say billing is not configured (no Stripe keys). That is expected.
- [ ] API keys and webhooks: create a key (shown once), delete it.

## 12. Profile, MFA, sign-up and recovery

- [ ] Profile: change name, language, theme, password (the old password is required). Sessions list shows this browser; revoke another one.
- [ ] Turn on two-factor: scan the QR with an authenticator app, enter the code, save the backup codes. Sign out and in again: the code step appears. Turn it off with your password.
- [ ] Sign-up wizard (private window): create a company. The verification code is in the API log. Finish the steps: company, first branch and site, first employee, invite a teammate. The new owner lands in an empty workspace.
- [ ] Forgot password: request a reset, open the link from the API log, set a new password, sign in. The old link no longer works.
- [ ] Invitation page: open an invitation after it has been used or after it expired; you should see the "used" or "expired" message, not the form.
- [ ] Single sign-on buttons (Google, Microsoft): expect "Single sign-on isn't available yet". Not configured.

## 13. Chat (admin and phone)

Set up: the seeded employees are attached to a site, so each sees that site's group. Open the dashboard as the owner and Amina or Joseph on the phone.

- [ ] Phone: the Messages tab shows the group of your site ("N people on this site"). Open it, send a text: it appears at once on the dashboard (Chat in the sidebar) without reloading, and the sidebar badge counts unread messages.
- [ ] Dashboard: send a message in that site's group as the owner, who is not attached to the site (the owner has the "write in every site chat group" permission). The phone receives it live, and a push notification arrives when the app is in the background (needs `EXPO_PUSH_ENABLED=true`).
- [ ] Phone: attach a photo from the gallery, a photo or video from the camera (the camera permission prompt appears the first time; if you refuse permanently the sheet sends you to Settings), and a PDF. They appear in the thread; tapping a photo opens it. On the dashboard, attach a photo and a PDF the same way.
- [ ] New conversation (pencil on the phone, button at the top of the dashboard list): pick a colleague and send a direct message; it appears for them live, and the unread count goes away once they open it.
- [ ] A person not attached to a site does not see that site's group. A dashboard user whose role lacks the chat permission (for example the HR / Viewer role) sees no site groups, but can still send direct messages.
- [ ] Users and roles: the role editor has a new "Chat" row that grants writing in every site group. Create a role with it, give it to someone, and check they now see all site groups in their scope.
- [ ] Kill the phone's network, send nothing, restore it: the thread catches up. Messages sent while offline are not queued (the send fails with a message).

## 14. Leave recommendation by a site manager

- [ ] With the default one-level approval, sign in to the dashboard as a user who has the Site manager role (invite one, scope: a site). Open a pending leave request from that site: "Recommend approval" and "Advise against" appear instead of Approve/Reject. Send one with a comment.
- [ ] As the owner, open the same request: the recommendation and comment show above the decision buttons. Approve or reject as usual.
- [ ] Phone, as Karim (site manager): the leave inbox recommend and advise-against buttons now work under one-level approval too.

## 15. Profile photo and single sign-on

- [ ] Phone: profile, camera icon, "Choose from gallery" or "Take a photo". The photo shows at once and is still there after you close and reopen the app. "Remove photo" works.
- [ ] Dashboard sign-in page: Google and Microsoft buttons. Without credentials they say single sign-on isn't set up. With `GOOGLE_CLIENT_ID/SECRET` set (and `PUBLIC_API_URL` registered as the redirect address at Google), signing in with an address that belongs to an existing user lands in the dashboard; an unknown address returns to sign-in with "no StaffSync account uses this address".
- [ ] Refresh the dashboard while signed in (and a few times quickly): you stay signed in.

## 16. Data and reports

- [ ] Reports: export to PDF, CSV and XLSX; all three download and open. Save a report with a weekly schedule and recipient e-mails; the worker sends it on Monday (or on the next run after the period starts) as a download link.
- [ ] Settings, "Export all data": the ZIP of CSV files downloads and the link is e-mailed to you; asking again within an hour says to wait.
- [ ] Erasing a person permanently has an API endpoint (`POST /employees/{id}/erase`, asks for the administrator's password) but no button in the dashboard yet; it is covered by an automated test.

## 17. Languages and theme

- [ ] Walk the main screens in French on both admin and phone: no English leftovers and no overflowing buttons.
- [ ] Dark mode on both. Dynamic text size larger on the phone: layouts still fit.

## Known limits (not bugs)

- E-mail, SMS and push really send only when their credentials are set in `backend/.env` (see `.env.example`); without them everything appears in the API log.
- Without `S3_BUCKET` uploaded files are kept on the backend's own disk (`backend/.storage`), which is fine for testing but not for production.
- Not built: iOS App Attest verification (Android Play Integrity is, but the app does not send attestation tokens yet), voice-note recording in chat (audio files can be attached), message editing and deleting, typing indicators, and Stripe checkout needs your keys.
- Geofences are circles or polygons on the server; the phone draws circles as polygons, which only affects how they look.
- Production needs the dashboard and the API on the same site (the refresh cookie is `SameSite=Strict`) and the dashboard's address in `CORS_ORIGINS`.

## What I already verified (API level, against a fresh seeded database, plus automated tests)

- Admin sign-in, token refresh, 35 read endpoints, org tree, sites, employees including the first 200+ pagination loop.
- Mobile login by code, device registration, push token, scheduled and unscheduled check-in, idempotent replay, check-out, offline sync batch.
- Live counters and the WebSocket event on check-in (received within seconds).
- Proxy check-in with PIN, wrong PIN, idempotent replay, badge lookup, roster, manager note, proxy check-out.
- Schedules: create, validate, publish, reassign, cancel, copy week. Corrections: create and accept. Leave: preview, create, edit (attachments kept), approve.
- Users: invite, accept, login, resend, revoke, restore, change role. Password reset, two-factor setup and login, password change. Sign-up and email verification, onboarding branch and site.
- Reports preview, export and saved reports; audit log and export; settings writes; API keys; CSV import upload.
- Chat rules and live delivery, sign-in with password then code, single sign-on (with a faked provider), file upload and download through signed links, profile photos, company export, erasure, PDF and scheduled reports, e-mail/SMS/push request shapes (with faked providers), leave recommendations: all covered by backend tests.
- Admin production build compiles; mobile type check and 70 unit tests pass; the full backend test suite passes.

Not verified by me, so these are the most likely places to find problems: every visual screen in the browser, drag and drop and map drawing, the phone camera, QR scanning, permission prompts, push notifications, real GPS, airplane-mode behaviour, token refresh after 15 minutes on a device, and the French translations in context.
