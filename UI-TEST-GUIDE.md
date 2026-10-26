# StaffSync: UI test guide (admin dashboard and mobile app)

Written for: you, testing the admin dashboard in a browser and the mobile app on a simulator or phone.

Nothing in the admin or mobile screens has been clicked through by anyone yet. The API behind them is covered by automated tests (list at the end), so when something fails the screen is the first suspect, then the matching request in the API terminal. Tick the boxes as you go. For each failure write down: the screen, what you did, what you expected, and the error text.

How to use this guide: do **0 Set up**, then the **15-minute smoke test**. After that work through Part A (admin), Part B (mobile) and Part C (flows that need both), in any order.

---

## 0. Set up

1. Clean start (wipes old data and device bindings):
   ```bash
   cd backend && make reset
   cd .. && ./scripts/dev.sh --seed --lan
   ```
   `--seed` loads the demo company, `--lan` lets the phone reach the API and writes `mobile/.env`. The script runs the migrations, the API (:8000), the worker and the dashboard (:3000). Keep the terminal visible: it shows every login code, invitation link and reset link.
2. Phone app (second terminal): `cd mobile && npx expo run:ios`. Use `run:ios` again whenever a package with native code was added; reloading JavaScript is not enough. Later runs: `npx expo start`.
3. **Time matters.** The seeded shifts run **08:00 to 17:00 in Douala (UTC+1)**. Outside those hours a check-in is "unscheduled" and goes to review (intended). For an all-day test, first create an all-day schedule (section A8).
4. **Simulator location:** Features > Location > Custom Location, `4.0511, 9.7679` (Bonanjo Tower). Akwa Warehouse is `4.0483, 9.7043`. Both have a 150 m circle.
5. **Codes and links:** until you put SMTP/Twilio keys in `backend/.env`, nothing is really sent. Look for `notify` lines in the terminal.
   - The seeded employees have **no e-mail address**, so their codes go out as SMS (a log line). To test the e-mail path, open an employee in the dashboard, add an e-mail address, save, and use that address to sign in.
   - Asking for a code twice within a minute is refused ("please wait").

### Logins

| Who | App | Login | Role |
| --- | --- | --- | --- |
| Owner "Claire Vasseur" | Admin | `owner@staffsync.app` / `staffsync-demo-1` | Super admin (everything) |
| Amina Nkodo | Mobile | phone `+2250712345678` | Employee |
| Joseph Ewane | Mobile | phone `+237670000002` | Employee |
| Paul Mbella | Mobile | phone `+237670000003` | Employee |
| Grace Tabi | Mobile | phone `+237670000004` | Employee |
| Karim Mbarga | Mobile | phone `+2250511223344` | Site manager |

Employees have **no password yet**: the first phone sign-in is the code alone, then the app asks them to create a password (details in B1). People you invite to the dashboard choose their password on the invitation page.

---

## Smoke test (15 minutes)

If any of these fails, stop and tell me before testing further.

- [ ] Dashboard: sign in as the owner, reload the page twice quickly: still signed in.
- [ ] Dashboard: Overview, Live board, Attendance, Employees, Sites, Schedules, Leave, Reports, Users & roles, Settings, Chat all open without an error page.
- [ ] Phone: opens (no crash), sign in as Amina (code only), create a password, finish setup, reach Home.
- [ ] Phone: Settings opens (Profile, gear icon) and the Language/Theme sheets work.
- [ ] Phone: check in at Bonanjo Tower (all-day schedule or inside 08:00-17:00): the Live board on the dashboard updates without reloading.
- [ ] Chat: Amina sends a message in the Bonanjo Tower group; it appears in the dashboard Chat page live.

---

## Part A: Admin dashboard

### A1. Sign-in, session and workspace

- [ ] Wrong password: error message and a counter of attempts; repeated failures lock the account for a few minutes.
- [ ] Correct password lands on the Overview. Reload: you stay signed in. Reload several times in a row: you stay signed in.
- [ ] Sign out, then open `/employees` directly: redirected to sign-in, and back to `/employees` after signing in.
- [ ] Workspace picker (`/workspaces`) lists "Demo Logistics"; choosing it opens the Overview. With one workspace you may skip the picker.
- [ ] Account menu (top right): language EN/FR, light/dark/system, my profile, sign out. The choices survive a reload.
- [ ] **Forgot password:** request a reset, take the link from the terminal, set a new password, sign in. Reuse of the old link is refused.
- [ ] **Single sign-on buttons** (Google, Microsoft): without keys they say single sign-on isn't set up. With `GOOGLE_CLIENT_ID/SECRET` in `backend/.env` and `PUBLIC_API_URL/api/v1/auth/sso/google/callback` registered at Google: signing in with an address that has a StaffSync account lands in the dashboard; an unknown address returns to sign-in with "no StaffSync account uses this address".
- [ ] **Two-factor:** see A14.

### A2. Overview (dashboard)

- [ ] KPI cards (expected, present, late, absent, on leave, flagged) show today's numbers; they change after a check-in on the phone.
- [ ] Live map card shows the sites with their counts. Trend, check-in methods and punctuality cards render with data (empty states when there is none).
- [ ] Activity feed and "needs attention" panel list recent events; items link to the right page.
- [ ] Date picker changes the numbers; the scope switcher (top bar) narrows everything to one branch or site.
- [ ] Notification bell lists in-app notifications; marking read works.
- [ ] Global search (top bar) finds an employee, a site, a page.

### A3. Live board

- [ ] Rows per site with each expected person and their status (not arrived, present, late, left, absent, on leave, flagged).
- [ ] **Realtime:** check in on the phone; the row changes within a few seconds **without** reloading, and the counters move.
- [ ] Pause/resume stops and restarts live updates.
- [ ] Check someone in or out on their behalf (needs a reason). A manager's note on a person shows on their row.
- [ ] Stop the worker and check in: the board no longer updates live (it falls back to polling). Start the worker: live updates resume.
- [ ] A check-in outside any shift (unscheduled) does not appear on the board, but creates an alert (A5).

### A4. Attendance

- [ ] Records list with filters (date range, site, branch, status, method, employee) and saved views.
- [ ] Open a record: map with the geofence and the check-in point, selfie placeholder, timeline, flags, notes, edit history.
- [ ] Edit check-in/out time with a reason: the history shows the change. Add a note.
- [ ] Add a manual record for someone who forgot. Delete a record, then restore it.
- [ ] Approve a flagged record. Mark selected people absent (bulk).
- [ ] Export CSV opens in a spreadsheet; names starting with `=` are neutralised.

### A5. Alerts

- [ ] Tabs: flagged check-ins, missing check-ins, unscheduled, uncovered interventions. Counts match the sidebar badge.
- [ ] Open an alert: details, previous check-ins, device, distance and accuracy. Add a note.
- [ ] Approve, reject (with the outcome), escalate, bulk resolve.
- [ ] Correction requests from employees appear; accept one and decline one with a reason.

### A6. Chat

- [ ] Sidebar "Chat" with an unread badge. The list shows each **site group** you can see and your direct conversations.
- [ ] The owner sees every site's group (the "write in every site chat group" permission) and can write in a group without being attached to it.
- [ ] New conversation (icon at the top of the list): search a colleague, send a message. Enter sends, Shift+Enter makes a new line.
- [ ] Attach a photo, a short video, an audio file and a PDF (up to 6 files). Photos show inline and open on click; video and audio play; PDFs download.
- [ ] Messages from the phone arrive live; the unread count drops when you open the conversation; "Show older messages" loads history.
- [ ] Reconnecting: stop the API for 20 seconds and start it: the header shows "reconnecting…" and then the thread catches up.
- [ ] A user whose role lacks the chat permission (invite an "HR / Viewer", A12) sees no site groups but can still message colleagues directly.

### A7. Employees

- [ ] List of employees with search and filters (branch, site, status, app status). More than 200 employees load completely (try a bigger CSV import).
- [ ] **Add** an employee with a smartphone (invite on): an invitation line appears in the terminal. **Add** one without a smartphone: the drawer says the badge and PIN are issued from the profile after saving.
- [ ] Row menu on an "invited" employee: **Resend invitation** works (new terminal line). On an installed employee: **Reset device** works (the phone must register again).
- [ ] Deactivate and reactivate. A deactivated person cannot sign in on the phone.
- [ ] **Import CSV:** upload `employees-template.csv` filled in, map columns, fix a bad row (errors are listed by row), import.
- [ ] **Profile page** tabs: overview, attendance (month calendar), schedule, leave, notes, device, activity.
  - Issue a **badge**: PIN and QR appear once; reload and they are gone.
  - Add a note; reset the device; see the activity trail.
- [ ] Erasing a person permanently has an API endpoint but no button yet (covered by tests); skip.

### A8. Schedules

- [ ] Weekly grid per site/person. Create a recurring schedule (days, start/end, break, grace, people or group). For an **all-day test shift** use the same start and end time with "crosses midnight".
- [ ] Validate shows conflicts (overlaps, leave); publish makes it visible on phones within a minute. Drafts are not visible on phones until published.
- [ ] Move a single shift to another person; cancel a single shift with a reason (the people are notified).
- [ ] Copy last week to this week. Edit and delete a schedule; restore it from the trash.

### A9. Sites and branches

- [ ] Sites list with headcounts. Counts update by themselves (every minute, and when the page opens) after check-ins.
- [ ] **New site:** draw a circle and a polygon, set address/timezone/rules (selfie, QR, registered device only, offline, minimum accuracy). Pick **managers** from the list of dashboard users and tick **employees**. Save, reopen: both lists are kept.
- [ ] Site detail: managers tab (add/remove), employees tab (assign), QR (show and rotate), overlaps with other sites.
- [ ] Branches: create, edit, archive (refused while it has active sites), restore.
- [ ] Deactivate/activate a site; delete then restore.

### A10. Leave

- [ ] Inbox of requests with filters; calendar of who is away; balances per person and type.
- [ ] Open a request: dates, balance, team coverage, affected shifts, approval trail, attachment shown as **"Attachment N"** with a download link.
- [ ] **Approve**, **reject** (reason required), **request changes**, **cancel** an approved request. The employee gets a notification on the phone.
- [ ] Bulk approve/reject several requests.
- [ ] **Site manager view** (invite a user with the Site manager role scoped to a site, A12): pending requests from that site show **Recommend approval / Advise against** instead of Approve/Reject. Send one with a comment; the owner then sees the recommendation above the decision buttons.
- [ ] Adjust a balance with a reason; add and remove a public holiday.

### A11. Reports

- [ ] Choose a report type, dates, grouping (employee/site/branch/day) and columns; preview the table with totals.
- [ ] Export **CSV, Excel and PDF**: all three download and open.
- [ ] Save a report, reopen it from the saved list, rename/delete it.
- [ ] Add a **weekly or monthly schedule** with recipient e-mails. The worker sends a download link by e-mail (a terminal line without SMTP) on Monday / the 1st, or at the next hourly run after that moment.

### A12. Users and roles

- [ ] Tabs: Users and Roles. User statuses: active, invited, revoked.
- [ ] **Invite** a user (e-mail, role, scope): the link appears in the terminal. Open it in a private window, choose a password, sign in. A used or expired link shows the "used/expired" message.
- [ ] Resend an invitation, revoke a user, **restore** a revoked user (pick a role), change a user's role.
- [ ] **Roles:** system roles listed; create a custom role, pick permissions and scope, duplicate, edit, delete and restore it. The "Chat" row grants writing in every site chat group.
- [ ] Preview a role (sidebar, pages and buttons change to that role). A user with a narrow role does not see menu items or buttons they cannot use.

### A13. Audit log

- [ ] Your actions appear (role created, record edited, leave decided, export…). Filter by date, actor, action, target type; export.

### A14. My profile, security and sessions

- [ ] Change name, language and theme; change password (the current password is required).
- [ ] **Two-factor:** turn it on (scan the QR with an authenticator app, confirm a code, keep the backup codes). Sign out and in: the code step appears. A backup code works once. Turn it off with your password.
- [ ] Sessions list: this browser is marked; revoke another session.

### A15. Settings

- [ ] **Company:** name, logo, timezone, formats (date, time, week start).
- [ ] **Attendance rules:** grace period, early-leave tolerance, missing check-out handling, selfie/QR defaults. Reload to confirm they persist; new check-ins use them.
- [ ] **Leave:** one or two approval levels (two levels: a site manager must recommend first), leave types (create, edit, delete, restore), accrual.
- [ ] **Notifications**, **API keys** (shown once; delete), **Webhooks** (create, see deliveries, retry).
- [ ] **Billing and plans:** plan list and current plan. Checkout and invoices say billing is not configured until Stripe keys are set.
- [ ] **Export all data:** the ZIP of CSV files downloads and a link is e-mailed (terminal line); asking again within an hour says to wait.
- [ ] **Danger zone:** scheduling company deletion needs the exact company name (do not confirm on data you want to keep).

### A16. Sign-up wizard (new company)

- [ ] In a private window open the sign-up/onboarding page: create an owner, enter the 6-digit code from the terminal.
- [ ] Walk the steps (company, first branch, first site, first employees, invite teammates, plan). The new owner lands in an empty workspace and can add an employee.

---

## Part B: Mobile app

### B0. Keyboard (try this on every screen with a field)

Screens with fields: sign-in, code entry, create password, check-in comment, new leave request (reason), leave detail (cancel reason), correction request, manager roster (search and note), leave recommendation, proxy check-in (PIN and note), new conversation (search), chat thread, and every bottom sheet with a field (country list search, notes).

- [ ] Tap a field: the keyboard opens and **the field and the main button are not hidden behind it** (the button rises above the keyboard; a field low on a long form scrolls into view).
- [ ] Tap **empty space** (not a button or field) anywhere on the screen: the keyboard closes.
- [ ] **Drag/scroll** a long form or the chat list: the keyboard closes (on iOS you can also pull it down by dragging).
- [ ] Tap a button or another field while the keyboard is open: that one tap works (the keyboard does not eat the first tap).
- [ ] Bottom sheets (country search on sign-in, roster note, leave reason): the whole sheet rises above the keyboard, and tapping the sheet's empty space closes the keyboard without closing the sheet.
- [ ] Chat: the message box stays just above the keyboard; tapping a message bubble or blank area closes the keyboard.
- [ ] Rotate or use a small phone (iPhone SE size) and a large text size: the field and button still fit above the keyboard.

### B1. First launch and sign-in

- [ ] The app opens (no crash). Onboarding slides, then the sign-in screen with a language toggle.
- [ ] **Employee, first time:** enter Amina's phone, leave the password **empty**, continue. The code (terminal) is accepted, then the **Create your password** screen asks for 10+ characters twice. Short or mismatching passwords are refused.
- [ ] Sign out and in again with the **same phone and the password**, then the code. A wrong password shows an error; repeated failures show a lock message. Signing in with an e-mail address works the same (switch the tab).
- [ ] Known gap: if you kill the app at the create-password screen, the account still has no password and the next sign-in can use the code alone. Tell me if that bothers you.
- [ ] **Country picker** (flag and code button next to the phone field): each row shows the flag, the country name and its calling code (+237…). Search by **name only** (accents and case ignored, names starting with your text first); typing digits like `237` finds nothing. The launch countries are pinned on top when the search is empty.
- [ ] Number not in the system: "not invited" screen. Deactivate an employee in the dashboard and try: "deactivated" screen. Airplane mode: "offline" screen.
- [ ] Code screen: a wrong code shows attempts left; 5 wrong codes lock; "resend" is available after 60 seconds.
- [ ] If the person belongs to several companies, the company picker appears.

### B2. Setup flow (first sign-in on a phone)

- [ ] **Location:** Allow. Choosing "approximate" (iOS: Precise Location off / Android: Approximate) is **not accepted**: the screen says precise location is needed and offers Settings. Denying shows how to enable it.
- [ ] **Notifications:** Allow or Not now. **Camera:** Allow or Maybe later.
- [ ] Device registration: this phone becomes the employee's device. A second phone for the same person is refused until the dashboard resets the device (A7).
- [ ] First-shift summary, then Home.

### B3. Home

- [ ] Today's shift card(s): site, time, status. The map card shows your position; it says "Finding your position…" and after 12 seconds a hint if there is no signal (set the simulator location).
- [ ] The big button: "Turn on precise location" when location is off (tapping it opens the prompt or Settings), "Waiting for GPS", "Outside site" with distance, or **Check in** when inside the geofence.
- [ ] Quick actions (schedule, leave, notifications). Week summary. Notification bell with unread count.
- [ ] Pull to refresh. Offline banner when the network is off.

### B4. Check in and check out

- [ ] Inside the site: Check in, confirm. Selfie/QR steps appear only when the site requires them (the site QR is shown in A9). Success screen.
- [ ] Check in again: "already checked in" (no duplicate).
- [ ] Set the simulator ~1 km away: the app says you are outside; "check in anyway" is possible and the record is flagged for review.
- [ ] Check out. Leaving the day open: the "forgotten check-out" flow offers to request a correction.
- [ ] Not scheduled today: the app offers "check in anyway" (flagged, appears under Alerts).

### B5. Map

- [ ] Full map from the Home card: site geofence, your dot, distance. **Recenter** zooms to your position (about 200 m across). The directions sheet opens the maps app.

### B6. Attendance tab

- [ ] Month list with status chips and a status filter; week summary.
- [ ] Open a record: times, worked hours, flags, map, comments.
- [ ] **Request a correction** (wrong time, forgot check-out, flagged by mistake) with a comment and an optional attachment (photo or PDF). It shows as pending, and as accepted/declined after the dashboard decides (A5).

### B7. Schedule and leave

- [ ] Schedule: list by week/day, open a shift for details; add to calendar (asks calendar permission only then).
- [ ] **New leave request:** pick type and dates; the preview shows days, balance and warnings (short notice, overlap, document required). Attach a file when a type requires one. Submit.
- [ ] Leave list and detail: status banner, approval timeline (submitted → recommended → approved…), edit a pending request (the attachment is kept if you don't pick a new file), cancel, request cancellation of an approved one.
- [ ] Balances per type. Public holidays show in the calendar.

### B8. Messages (chat)

- [ ] **Messages tab** with an unread badge. Your site's group appears (with "N people on this site"); direct conversations appear after the first message.
- [ ] Open the group, send text. Messages from the dashboard or colleagues arrive live. Opening a conversation clears its unread count.
- [ ] **New conversation** (pencil): search a colleague, send a direct message.
- [ ] **Attach** (paperclip): take a photo or video (the camera permission prompt appears the first time; refusing for good shows a Settings shortcut), choose from the gallery (several allowed), or pick a PDF/audio file. Attachments show as chips before sending; photos show in the thread and open on tap; video, audio and PDF open in the system viewer.
- [ ] Push: with the app in the background, a message from someone else produces a notification (needs `EXPO_PUSH_ENABLED=true` and notifications allowed on the phone).
- [ ] Network off: sending fails with a message (messages are not queued offline). The header says reconnecting; it catches up when the network returns.
- [ ] An employee not attached to a site does not see that site's group.

### B9. Profile and Settings

- [ ] Profile: name, title, branch, site(s), manager contact. **Camera icon** opens a sheet: take a photo / choose from gallery (square crop) / remove. The photo shows at once and is still there after you close and reopen the app. Refusing the camera permission shows the Settings shortcut.
- [ ] **Settings** (gear): **Language** and **Theme** are rows that open a bottom sheet; **Remind before** (15/30/60 min) also. Toggles for shift reminders, arrival prompt, leave updates.
- [ ] Offline queue section lists queued check-ins; "Sync now" sends them. Device card shows model, registered and last active (a dash when empty).
- [ ] Privacy and FAQ rows expand; Contact opens e-mail; About shows the version. **Log out** asks for confirmation and warns about unsynced items.

### B10. Notifications

- [ ] List by type (shift reminder, schedule change, leave decision, correction result, announcement…), swipe to delete, mark all read; tapping opens the related screen.

### B11. Site manager (sign in as Karim)

- [ ] The tab bar changes: **Manager** and **Roster** appear. Manager home shows the site summary (expected, present, late, absent).
- [ ] **Roster:** people with status and times; open a person for details; **add a note** (it shows back on the roster row and in the employee's notes in the dashboard).
- [ ] **Leave requests** inbox: open one, see coverage, **Recommend approval / Advise against** with a comment (works under one- and two-level approval).
- [ ] **Proxy check-in** (for people without a smartphone): pick from the roster or scan the badge QR; verify with the PIN (a wrong PIN shows attempts left; 5 wrong PINs lock the PIN and require a photo) or take a photo; confirm the location; success. A person not scheduled today gets "check in anyway".
- [ ] Offline proxy: with the network off, a proxy check-in **with a photo** is queued; when the network returns it syncs once, with no duplicate.

### B12. Offline behaviour and updates

- [ ] Airplane mode: check in at the site: "saved, will sync". The queued item shows in Settings.
- [ ] Network back: it syncs and the record appears in the dashboard with the original time. Do it twice in a row: no duplicates.
- [ ] Queue an item, force-quit the app, reopen: the item is still queued.
- [ ] Leave the app open past 15 minutes and use it: the session refreshes silently, no sign-out.
- [ ] Forced update: set `APP_VERSION_MIN=9.0.0` in `backend/.env`, restart the API, open the app: the blocking **Update required** screen appears. Remove the setting afterwards.

---

## Part C: Flows that need both apps

| # | Flow | What to check |
| --- | --- | --- |
| C1 | Check-in → live board → alert | A phone check-in appears on the board; an out-of-fence or unscheduled check-in creates an alert; approving it clears the flag on the phone record. |
| C2 | Schedule → phone | Publish a schedule in A8; the shift appears on the phone (pull to refresh). Move/cancel a shift: the phone is notified. |
| C3 | Leave round trip | Request on the phone → decide in the dashboard (A10) → notification and balance change on the phone. With two-level approval: Karim recommends first (B11), then the owner approves. |
| C4 | Correction round trip | Request on the phone (B6) → accept/decline in the dashboard (A5) → the result shows on the phone. |
| C5 | Chat both ways | Group and direct messages with attachments flow in both directions live; unread badges agree on both sides. |
| C6 | Proxy check-in | Create a no-smartphone employee in A7, issue the badge, schedule them, then do the B11 proxy check-in. It appears on the board as a proxy check-in. |
| C7 | Device reset | Reset an employee's device in A7; the phone must register again; a different phone is refused before that. |
| C8 | Invite → sign in | Invite a dashboard user (A12); open the link; sign in. Add an e-mail to an employee (A7) and sign in on the phone with it: the code arrives as an e-mail line in the terminal. |
| C9 | Roles at a glance | Compare what each person sees: Super admin (everything), Branch admin (own branches, no billing/roles), HR/Viewer (read-only, no site chat groups), Site manager (own sites, recommend only), Employee (own data). |
| C10 | Languages and theme | Walk the main screens of both apps in French and in dark mode: no English leftovers, nothing cut off, larger text sizes still fit. |

---

## Known limits (not bugs)

- E-mail, SMS and push are really sent only when their credentials are in `backend/.env` (see `backend/.env.example`); otherwise they appear in the terminal.
- Without `S3_BUCKET` files (selfies, attachments, chat media, photos, exports) are stored on the backend's disk in `backend/.storage`: fine for testing, not for production.
- **Not built:** iOS App Attest verification (Android Play Integrity is, but the app does not send attestation tokens yet), recording voice notes inside chat (audio files can be attached), editing or deleting chat messages, typing indicators, a dashboard button to erase a person (the API exists), Stripe checkout without your keys.
- Messages are not queued offline; check-ins, notes and proxy check-ins are.
- Geofences are circles or polygons on the server; the phone draws circles as polygons (looks only).
- Address search uses the public OpenStreetMap service and is rate-limited.
- Production needs the dashboard and the API on the same site (the refresh cookie is `SameSite=Strict`) and the dashboard's address in `CORS_ORIGINS`.

## What is already verified (automated, not by clicking)

- **Backend (the full test suite passes):** sign-in with password then code, create-password, lockout, token refresh (including a dropped refresh response), roles and scopes on every route, the check-in pipeline (geofence, flags, offline sync, idempotency), proxy check-in with PIN lockout, schedules (publish, move, cancel), leave (two levels, recommendation under one level, attachments kept on edit), corrections, alerts, reports (CSV, Excel, PDF, scheduled e-mails), company export, erasure, single sign-on with a faked provider, signed file upload and download, profile photos, chat rules and live delivery, push preferences, e-mail/SMS/push request shapes with faked providers, forced update (426), billing grace, French translations.
- **Admin:** type check, lint, English/French key checks, production build.
- **Mobile:** type check and 72 unit tests (mappers, offline queue, domain rules).
- **API walk-throughs against a seeded database:** the flows in Part C at the request level, including the WebSocket push on check-in.

**Most likely places to find problems** (never run for real): every visual screen in a browser, map drawing, the phone camera and QR scanning, permission prompts, push notifications, real GPS, airplane-mode behaviour, token refresh after 15 minutes on a device, French text in context, and any real e-mail, SMS or single sign-on provider.
