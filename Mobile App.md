# StaffSync Mobile App Handbook

Oct 17, 2026 · @Raims Pires

## 1. Introduction

The StaffSync mobile app lets employees prove they are on site by checking in and out inside a site's GPS boundary, see their schedule and attendance, and request leave. Site managers use the same app to run their site's daily roster and check in colleagues who have no smartphone.

### Who uses the app

| User | What they do in the app |
| --- | --- |
| Employee | Check in and out, view schedule and attendance history, request leave, request corrections |
| Site manager | Everything an employee does, plus view the site roster, check employees in and out on their behalf, recommend leave decisions |

Admins work from the web dashboard, not the app. They create sites, schedules and employees, review flagged check-ins and give the final decision on leave.

### Key concepts

- **Company, branch, site**: a company has branches, and each branch has one or more job sites.
- **Geofence**: the virtual boundary around a site, drawn as a circle or polygon on the map. Check-in is only valid inside it.
- **Recurring schedule**: a regular shift, for example Monday to Friday, 08:00 to 17:00 at Site A.
- **Intervention**: a one-off assignment at a specific site, date and time window.
- **Grace period**: minutes allowed after the scheduled start before a check-in counts as late.
- **Flagged check-in**: a check-in that is recorded but could not be verified (for example outside the geofence). The admin reviews it.
- **Proxy check-in**: a check-in done by a site manager on behalf of an employee.

### Attendance statuses

| Status | Meaning |
| --- | --- |
| On time | Checked in before the end of the grace period |
| Late | Checked in after the grace period |
| Early leave | Checked out before the scheduled end, beyond the allowed tolerance |
| Overtime | Stayed beyond the scheduled end |
| Missing check-out | Checked in but never checked out |
| Absent | Scheduled but never checked in, with no approved leave |
| On leave | Covered by an approved leave request |
| Holiday | Public holiday on the branch calendar |
| Flagged | Recorded but awaiting admin review |

## 2. Getting started

A new user goes from download to first check-in in six steps, and only needs the phone number or email their admin registered.

1. **Install the app** from the App Store or Google Play using the link in the invitation SMS or email.
2. **Choose a language** (English or French) on first launch. It can be changed later in Settings.
3. **Go through the intro** (three slides, skippable) explaining check-in, schedule and leave.
4. **Log in**:
   - Enter the phone number or email the admin registered.
   - Enter the 6-digit code received by SMS or email. The code expires after a short delay and can be resent.
   - If the user belongs to several companies, they pick one.
   - A number not registered shows "Account not found, contact your admin". A deactivated account cannot log in.
5. **Grant permissions**:
   - **Location (precise)**: required. Used only to verify position at check-in and to show distance to the site.
   - **Notifications**: recommended, for shift reminders and leave decisions.
   - **Camera**: asked only if a site requires a selfie or QR scan.
   - If location is refused, check-in stays disabled and the app shows how to enable it in phone settings.
6. **Register the device**: the phone is linked to the account. If another phone is already registered, the user must ask the admin to reset the device binding.

The user then lands on Home with their next assignment.

## 3. Navigating the app

Everything is reachable from five bottom tabs, plus a Manager tab for site managers.

| Tab | What it holds |
| --- | --- |
| Home | Today's assignment, map, check-in/check-out button, quick actions |
| Schedule | Upcoming shifts, interventions and approved leave |
| Attendance | Attendance history, monthly summary, correction requests |
| Leave | Balances, new request, request history |
| Profile | Personal info and settings |
| Manager | Site roster, proxy check-in, leave recommendations (site managers only) |

A bell icon at the top of Home opens notifications. An offline banner appears at the top of every screen when there is no network.

### Home screen

- **Greeting and date**, with a sync indicator when offline actions are waiting.
- **Today's assignment card**: site name, address, scheduled time, type (regular shift or intervention) and status. Several assignments in one day show as swipeable cards. Days off show "No shift today" or "On leave today".
- **Map card**: the user's live position, the site boundary and the distance ("You are 350 m away" or "You are on site"), with a GPS accuracy indicator. Tapping opens the full map with directions.
- **Check-in button**, which changes state through the day:
  - *Waiting for GPS*: position not yet accurate enough.
  - *Outside site*: disabled, shows the distance and why.
  - *Check in*: active once inside the boundary.
  - *Check out*: after check-in, with a live timer ("On site for 2h 14m").
  - *Done for today*: summary of hours.
- **Quick actions**: Request leave, My schedule, My attendance.
- **This week**: days present, lates and hours worked.

### Full map

Shows the route to the site, distance and estimated travel time, and a "Get directions" button that opens Google Maps, Apple Maps or Waze. When the user enters the boundary, a prompt appears: "You've arrived at Site A, check in?".

## 4. Checking in and out

A check-in is valid only when the phone is inside the site boundary; any other attempt is still recorded, but flagged for the admin to review.

### Check-in steps

1. On arrival, the user opens Home (or taps the arrival prompt). The button turns to **Check in** once inside the boundary.
2. A confirmation sheet shows the site, the time and "Location verified".
3. If the site requires it, the user completes extra verification:
   - **Selfie**: front camera with a face outline, retake allowed.
   - **QR scan**: scan the code posted at the site entrance (torch available).
4. The success screen shows the time and status, for example "Checked in at 07:56, On time" or "Late by 12 min".

### Check-out steps

1. The user taps **Check out**. The same location and verification rules apply.
2. If leaving before the scheduled end, the app warns ("Leaving 45 min early") and lets the user add a note.
3. A summary shows check-in and check-out times, total hours and the status (on time, early leave or overtime).
4. If the user forgets, a reminder is sent. An unclosed record becomes **Missing check-out** and the admin is alerted.

### When a check-in is flagged

The check-in is saved, the admin is notified, and the user sees: "Your location could not be verified. Your check-in was recorded and your admin has been notified." The user can add a comment for the admin. Reasons include:

- Outside the boundary (with the distance, for example 420 m)
- Fake or mock location app detected
- GPS accuracy too low
- Phone time changed manually
- Not scheduled at this site (the user can cancel or check in anyway as flagged)
- Phone is not the registered device

The admin then approves the check-in as valid or rejects it. The user is notified of the outcome, and it appears on the attendance record.

### Offline check-in

With no network, the app still checks the position against the boundary, saves the check-in with its GPS point and time, and shows "Saved, will sync when you're online". It syncs automatically when the connection returns and is labelled "synced offline" for the admin. Pending items are listed in Settings with a "Sync now" button.

## 5. Schedule and attendance history

Employees see where they must be next in Schedule, and how they did in Attendance, where they can also contest a wrong record.

### Schedule tab

- Week view (day strip) or month view.
- Each day lists its assignments: site, time window and a badge for interventions. Approved leave shows in blue, public holidays are shaded.
- Tapping an assignment opens its detail: address, map preview, time, instructions and attachments for interventions, a button to call the site manager, directions, and "Add to phone calendar".
- When an admin changes a shift, the user gets a notification and the assignment shows "Updated by admin".

### Attendance tab

- Month selector with summary cards: days present, lates, absences, hours worked, leave days and overtime.
- Calendar with each day coloured by status (legend below), or a list view with date, site, times, hours, status and a flag icon.
- Filter by status.

### Attendance detail and corrections

The detail shows the scheduled and actual times, hours, status, method (self, QR, or "checked in by \[manager name\]"), a map snapshot, any flag and its outcome, and admin notes.

If something is wrong, the user taps **Request correction**, chooses the issue (forgot to check out, wrong time, flagged incorrectly), proposes the right time, adds a comment and an optional attachment. The request appears on the record as Pending, then Accepted or Declined once the admin decides.

## 6. Leave

Employees request leave from the Leave tab; the request goes to their approver on the web dashboard, and approved days automatically show as "On leave" instead of absent.

### Leave tab

- **Balance cards** per leave type (annual, sick, unpaid and others set by the company): days remaining, used and pending.
- **Request leave** button.
- **My requests**, split into Upcoming/Pending and Past, each with type, dates, duration and status.

### Requesting leave

1. Pick the leave type. Its remaining balance is shown.
2. Pick the dates on the calendar. Past dates are disabled, holidays and existing leave are marked. Toggle half-day (morning or afternoon) for the first or last day where the type allows it.
3. The app counts the days live, for example "3 days requested, 9 remaining".
4. Add a reason and, where required (such as sick leave), attach a photo or document.
5. The app warns if the request exceeds the balance, is shorter notice than the company requires, or overlaps a scheduled intervention.
6. Review the summary and submit. The confirmation names who will review it.

### Approval

- If the company uses two levels, the site manager first recommends approval or rejection, then the branch admin or HR decides. Otherwise the admin decides directly.
- The admin can **approve**, **reject** (with a reason) or **request changes** (with a comment).
- The employee gets a notification for each decision. The request detail shows the full timeline: who acted, when, and their comment.

### After a decision

| Status | What the employee can do |
| --- | --- |
| Pending | Edit or cancel the request |
| Changes requested | Edit and resubmit |
| Approved | Request cancellation, with a reason |
| Rejected | Read the reason, submit a new request |
| Cancelled | Nothing, kept for history |

Approved days appear in blue in Schedule and Attendance, the employee is removed from those days' site rosters, and the balance is updated.

## 7. Notifications, profile and settings

Notifications keep the user on schedule; Profile and Settings hold personal info and app preferences.

### Notifications

| Notification | When it is sent |
| --- | --- |
| Shift reminder | Before a scheduled shift or intervention |
| Arrival prompt | When the user enters a site boundary without having checked in |
| Check-out reminder | At the scheduled end, and again if the user forgot |
| Schedule change | When an admin adds, moves or removes an assignment |
| Check-in flagged / resolved | When a check-in is flagged, then approved or rejected |
| Leave decision | Approved, rejected or changes requested |
| Correction result | When a correction request is accepted or declined |
| Announcement | Message from the company |

The notifications screen groups them by Today and Earlier, marks unread ones, allows mark all as read and swipe to delete. Tapping one opens the related screen.

### Profile

Photo, name, employee ID, job title, branch, assigned sites and the manager's contact. Phone and email are read-only; changes go through the admin.

### Settings

- Language (English, French) and theme (light, dark, system)
- Notification preferences: shift reminders and how early, arrival prompt, leave updates
- Registered device information
- Offline data: pending items and "Sync now"
- Privacy: how and when location is used
- Help and support: FAQ, contact the admin
- App version, log out

## 8. Site manager mode

Users with the Site Manager role get a Manager tab to run their site's day; their own check-in still happens from Home like any employee.

### Manager home

- Site switcher at the top for managers covering several sites.
- Today's counters: expected, present, not arrived, left, absent, on leave, flagged.
- Alerts: late arrivals, flags at the site, missing check-outs, leave requests waiting for a recommendation.
- Quick actions: Check in an employee, View roster, Leave requests.

### Site roster

A live list of everyone expected at the site today, with photo, name, scheduled time, check-in and check-out times, status, and an icon for employees without a smartphone. Filters by status and search. Each row offers: check in on behalf, check out on behalf, call, add note, view today's record.

### Checking in an employee without a smartphone

1. Select the employee from the roster, or tap **Scan badge** and scan their QR badge card.
2. Verify identity: the employee types their 4-digit PIN on the manager's phone, and/or the manager takes their photo, depending on company rules.
3. The manager's own phone must be inside the site boundary; otherwise the action is disabled.
4. Confirm. The record is labelled "Proxy check-in by \[manager name\]" and can carry a note, for example "Arrived with company vehicle".
5. Errors: a wrong PIN shows the attempts left; an employee not scheduled at this site can be cancelled or checked in as flagged.

Check-out on behalf follows the same steps. Every proxy action is logged in the admin audit trail.

### Leave recommendations

When the company uses two-level approval, the manager sees leave requests from their site's employees, with the attachment, who else at the site is off on those dates and which shifts are affected. They recommend approval or rejection with a comment; the branch admin makes the final decision.

## 9. Troubleshooting and FAQ

Most problems come from location settings, a changed phone, or a forgotten check-out.

| Problem | What to do |
| --- | --- |
| Check-in button stays disabled on site | Turn on precise location, step outside a building for a better signal, wait for the accuracy indicator to turn green |
| "Outside site" although I'm at the entrance | The boundary may be smaller than the property. Move inside, or ask the site manager to check you in and report it to the admin |
| My check-in was flagged | Add a comment explaining why. The admin reviews it and you'll be notified |
| I changed or lost my phone | Ask the admin to reset your device, then log in on the new phone |
| I didn't receive the login code | Check the number or email, wait for the resend timer, then contact your admin |
| I forgot to check out | Open the record in Attendance and request a correction |
| No network on site | Check in anyway. It's saved and syncs later |
| My leave days are wrong | Check the balance details, then contact HR or your admin |
| I don't have a smartphone | Your site manager checks you in with your badge or PIN |

Is my location tracked all day? No. Location is read only to show distance on the map while the app is open, to send the arrival prompt if enabled, and at the moment of check-in or check-out.

## Appendix: running against the real backend (Oct 24, 2026)

- `mobile/.env` holds `EXPO_PUBLIC_API_URL` (the API on your computer's LAN address, ending in `/api/v1`) and `EXPO_PUBLIC_USE_MOCK` (`0` for the real API, `1` for built-in demo data). The file is not committed.
- Native modules are compiled into the app. After adding or upgrading a package that has native code (for example the date picker), rebuild with `npx expo run:ios`; reloading JavaScript is not enough and the app will crash on launch.
- Sign-in is e-mail or phone number plus password, then a one-time code sent to the account's e-mail address (by SMS when there is none). An account without a password signs in with the code alone once and is asked to create a password straight after.
- The Messages tab holds direct conversations with colleagues and the group of each site the person is assigned to, with photos, videos and PDFs, live over a WebSocket and by push notification.
- A `426` answer from the API shows a blocking "Update required" screen.
- Proxy check-ins carry one idempotency key per attempt, and queued ones reuse the queue id, so a retry never records twice.
- A check-in outside any shift gets `UNSCHEDULED`; the app offers "check in anyway" and sends it flagged for review.
- Leave and correction attachments upload through the API's upload endpoints; the push token is registered after the user allows notifications.
- Without `S3_BUCKET` the backend keeps uploaded files on its own disk (`LOCAL_STORAGE_DIR`), so they work in development; set the bucket in production.
