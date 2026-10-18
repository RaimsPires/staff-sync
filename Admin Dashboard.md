# StaffSync Admin Dashboard Handbook

Oct 18, 2026 · @Raims Pires

## 1. Introduction

The StaffSync admin dashboard is the web app where companies set up their branches, sites, employees and schedules, watch attendance live, review flagged check-ins and approve leave. Employees and site managers use the mobile app, described in the Mobile App tab.

### Who uses the dashboard

| Role | Typical use | Default scope |
| --- | --- | --- |
| Company owner / Super admin | Everything, including billing and roles | Whole company |
| Branch admin | Manage employees, sites, schedules, leave and alerts | Assigned branches |
| Site manager | Live board and proxy check-in for their sites (mostly on mobile) | Assigned sites |
| HR / Viewer | Reports, attendance, optionally leave approval | Configurable |

### Permissions and scope

Access has two independent parts:

- **Permissions** decide what a user can do: view attendance, check in on behalf of others, edit or approve records, manage employees, sites, schedules, leave, roles, reports, exports, settings and billing.
- **Scope** decides where: whole company, selected branches, own branch, selected sites, own site, or self only.

Every screen only shows data inside the user's scope, and buttons for actions they lack permission for are hidden. A branch admin of Branch A never sees Branch B's employees, even in search or reports.

## 2. Getting started

A company owner creates the workspace through an eight-step wizard; everyone else joins by invitation.

### Company sign-up wizard

1. **Create account**: name, work email, password, phone, accept terms, or sign up with Google or Microsoft.
2. **Verify email** with a code.
3. **Company details**: name, logo, industry, size, country, default timezone and language.
4. **First branch**: name and address.
5. **First site**: name, address, drop a pin on the map and set the geofence radius.
6. **Working hours**: default days, start and end time, lateness grace period.
7. **Invite team**: add employees one by one or upload a CSV (template provided). Can be skipped.
8. **Choose a plan**: free trial or a paid tier by employee count, monthly or yearly.

The wizard can be paused and resumed. It ends with a setup checklist: download the mobile app, invite site managers, create schedules.

### Signing in

- Email and password, or Google / Microsoft sign-in. "Remember me" keeps the session.
- **Two-factor authentication**: a 6-digit code from an authenticator app or SMS. A device can be trusted for 30 days. Backup codes work if the phone is lost.
- **Forgot password**: a reset link is emailed; the new password must meet the strength rules.
- Too many wrong attempts lock the account temporarily. Deactivated accounts cannot sign in.

### Invitations and workspaces

Invited users open the email link, see who invited them and their role, set a password and land in the dashboard. Expired links show a message to ask for a new invite. Users who belong to several companies pick one from the workspace switcher and can change it from the avatar menu.

## 3. Navigating the dashboard

A left sidebar lists the modules and a top bar sets which part of the company you are looking at.

### Sidebar

Overview, Live board, Attendance, Alerts (with a count badge), Employees, Branches & Sites, Schedules, Leave (with a count badge), Reports, Users & Roles, Audit log, Settings. Modules the user has no permission for are hidden. The bottom shows plan usage, for example 84 of 100 employees. The sidebar collapses to icons, and becomes a menu on tablets.

### Top bar

- **Scope switcher**: a tree of Company, Branches and Sites. Picking a level filters every screen to it. Only scopes the user can access are listed.
- **Global search**: employees, sites and branches, grouped by type.
- **Date and timezone** indicator.
- **Notifications bell**: fraud flags, leave requests, missing check-outs and uncovered interventions, with mark as read and a link to view all.
- **Avatar menu**: my profile, security (password, 2FA, sessions), language, theme (light, dark, system), switch workspace, sign out.

## 4. Overview and live attendance board

The Overview answers "how is attendance today and what needs my attention"; the Live board shows each site's roster minute by minute.

### Overview

- **KPI cards**: expected today, present now, late, absent, on leave, flagged, pending leave requests, each compared with yesterday. Clicking a card opens the matching filtered list.
- **Live map**: every site in scope as a pin showing present versus expected. Clicking a pin shows the site manager and counts, with a link to the site.
- **Charts**: attendance rate over 7, 30 or 90 days; punctuality by branch or site; split of check-in methods (self, proxy, QR).
- **Needs attention**: fraud flags, missing check-outs, unscheduled check-ins, pending leave and interventions with nobody assigned, each with a quick action.
- **Activity stream**: who just checked in or out, where, how and with what status.

A new company with no sites or employees sees a setup checklist instead.

### Live board

- Pick a site or all sites in scope. Counters show expected, present, not arrived, left, absent and on leave.
- Each site lists its employees with scheduled time, check-in and check-out times, status, method icon, distance from the site at check-in, and any flag.
- Row actions: check in or out on behalf of the employee (a reason is required), view the record, call the employee.
- New check-ins appear live; a toast pops up for each new flag.
- Bulk actions: mark selected employees absent or send them a reminder.

## 5. Attendance records and fraud alerts

Every check-in becomes a record admins can search, correct and audit; anything suspicious lands in the Alerts center for a decision.

### Attendance records

- **Filters**: date range, branch, site, employee, status, check-in method, flagged only, synced offline. Filters can be saved as views.
- **Table**: date, employee, site, scheduled time, check-in, check-out, hours, status, method, flag, last edited by. Sort, show or hide columns, paginate.
- **Bulk actions**: approve, mark absent, export selected. The whole filtered list exports to CSV, Excel or PDF.

### Record detail

Clicking a row opens a side panel with scheduled versus actual times, status, a mini-map with the site boundary and the check-in and check-out points, GPS accuracy, device, method (including "proxy by \[name\]"), selfies, offline-sync label, a timeline of events and a notes thread.

Admins can edit times or status (a reason is mandatory), approve or reject a flag, or delete the record after confirming. Every change is kept in the edit history with before and after values.

### Manual records

**Add manual record** creates a record for an employee who could not check in at all: employee, site, date, times, status, a mandatory reason and optional evidence. Overlapping records are blocked.

### Correction requests

When an employee requests a correction from the mobile app (forgot to check out, wrong time, wrongly flagged), it appears on the record and in Needs attention. The admin accepts it, which updates the record, or declines it with a reason.

### Fraud and alerts center

| Tab | What it lists |
| --- | --- |
| Flagged check-ins | Check-ins outside the boundary, with mock location, low GPS accuracy, changed phone time, an unregistered device or at an unassigned site |
| Missing check-outs | Records never closed |
| Unscheduled check-ins | Employees who checked in where they were not expected |
| Uncovered interventions | Interventions with nobody assigned, for example after approved leave |
| Resolved | Everything already decided |

Each flagged item shows the map with the boundary and the real position, the distance, accuracy, device, selfie, the employee's comment and their past flag count. The admin can **approve as valid** (with a reason), **reject** (the day becomes absent or invalid), contact the employee, add a note or escalate. The employee is notified of the outcome.

## 6. Employees

Employees are added one by one or by CSV import, then invited to the mobile app or given a badge and PIN if they have no smartphone.

### Employees list

- Filters: branch, site, role, status (active, invited, deactivated), has smartphone, search by name, ID or phone.
- Columns: name, employee ID, branch, sites, role, phone, app status (installed, invited, no smartphone), attendance rate this month, status.
- Row actions: view profile, edit, resend invite, reset device, deactivate.

### CSV import

1. Download the template.
2. Upload the filled file.
3. Map file columns to StaffSync fields.
4. Review the preview; rows with errors are highlighted with the reason.
5. Import and read the summary (created, skipped, failed).

### Add or edit an employee

- **Personal**: photo, name, employee ID, phone, email.
- **Employment**: branch, job title, role, scope if needed, start date, contract type.
- **Sites**: one or more assigned sites and a default site.
- **Attendance**: has-smartphone switch. Without a smartphone, StaffSync generates a QR badge and a 4-digit PIN for proxy check-in, with a print button. Selfie requirement can be set per employee.
- **Leave**: leave policy and starting balances.
- **Invitation**: send the app invite by SMS or email.

A warning appears when adding the employee would exceed the plan limit.

### Employee profile

| Tab | Contents |
| --- | --- |
| Overview | This month's attendance rate, lates, absences, hours, overtime, assigned sites, upcoming schedule |
| Attendance | Colour-coded calendar and record list |
| Schedule | Recurring schedules and upcoming interventions, editable |
| Leave | Balances, request history, balance adjustment with reason |
| Device & access | Registered phone, last seen, app version, reset device, login history |
| Documents & notes | Files and admin notes |
| Activity | Audit trail for this employee |

## 7. Branches and sites

Branches group sites; each site's geofence is what the mobile app checks every check-in against, so drawing it accurately matters most.

### Branches

A branch list or tree on the left; the selected branch shows its address, timezone, branch admins, today's present versus expected, its sites and employee counts. Creating a branch asks for name, code, address, timezone, branch admins, holiday calendar and, optionally, its own leave approval workflow. A branch with sites or employees can only be archived after they are reassigned.

### Sites list

Switch between a **map view** (pins with boundary outlines, clustered when zoomed out) and a **list view** (name, branch, address, boundary size, managers, employees, present today, verification methods, status). Actions: add, view, edit, print QR code, deactivate.

### Creating a site and its geofence

1. Fill the form: name, code, branch, address search, timezone, site managers, assigned employees, default working hours.
2. Set verification rules: require selfie, require QR scan, registered device only, allow offline check-in, minimum GPS accuracy in meters.
3. On the map, place the pin and choose the boundary shape:
   - **Circle**: set the radius with the slider or by typing meters.
   - **Polygon**: click to add corners, drag to adjust. Useful for long or irregular sites.
4. Check satellite view to make sure entrances and parking are inside.
5. Save. A warning shows if the boundary overlaps another site.
6. Download or print the site QR code and post it at the entrance if QR scan is required.

### Site detail

Map with the boundary and today's check-in points, and tabs for Today (live roster with proxy check-in), Employees, Schedule, Attendance history, Managers and Settings. Stats: attendance rate, average arrival time, lates and flags this month.

## 8. Schedules

Schedules tell StaffSync who is expected where and when, which is what makes a check-in on time, late or missing.

### Planner

- Day, week or month view, rows grouped by employee or by site.
- Filters: branch, site, employee, schedule type.
- Shift blocks show site, time and a type icon. Approved leave appears in blue, holidays are shaded.
- Drag and drop employees onto days and sites, drag a block's edge to change its time, click an empty cell to create, copy a week.
- Changes stay as drafts until **Publish**, with an option to notify employees.
- A side panel lists unassigned interventions to drag into place.

### Recurring schedule

Name, employees, site, days of the week, start and end time, crosses-midnight switch for night shifts, break duration, lateness grace period, early-leave tolerance, start date and optional end date, and an optional rotation pattern (for example two weeks of days, then two weeks of nights).

### One-off intervention

Title, site, date, start and end time, assigned employees, instructions, attachments, priority and a notify switch. Employees see it in their mobile Schedule tab with the instructions.

### Conflicts

Before saving or publishing, StaffSync checks for an employee booked at two sites at overlapping times, or scheduled during approved leave or a holiday. Conflicts are outlined in red with an explanation and must be resolved or confirmed.

## 9. Leave management

Leave requests sent from the mobile app arrive in the Leave inbox, where the approver checks balance and site coverage before deciding.

### Requests inbox

- Tabs: Pending, Approved, Rejected, Cancelled, All.
- Filters: branch, site, leave type, dates, employee, waiting on me.
- Each row: employee, type, dates, duration, balance left after approval, attachment icon, approval stage (for example "Recommended by site manager"), submitted date, and a warning icon if it overlaps scheduled work.
- Approve or reject from the row, or select several for a bulk decision with one shared reason.

### Reviewing a request

1. Open the request: type, dates, half-days, reason and attachment preview.
2. Check the balance: before, requested and after, with a warning if it goes negative.
3. Check coverage: who else at the same site or branch is off on those dates, and which schedules or interventions are affected (with links to reassign).
4. Read the approval trail, including the site manager's recommendation if the company uses two levels.
5. Decide: **approve**, **reject** (reason required) or **request changes** (comment). The employee is notified at once.

An approved request can later be cancelled by the admin, with a reason. Approved days become "On leave" in attendance, the employee leaves those days' rosters, and any intervention left with nobody is flagged as uncovered.

### Leave calendar

Month or quarter view, one row per employee grouped by site or branch, coloured bars per leave type, pending requests hatched, holidays highlighted. Clicking a bar opens the request.

### Balances

A table of employees by leave type with entitled, used, pending and remaining days, per year. Admins can adjust a balance up or down with a reason; every adjustment is logged. Exportable.

## 10. Reports and audit log

Reports turn attendance into timesheets and trends for payroll and management; the audit log records who changed what.

### Reports

- Ready-made reports: timesheet, hours worked, lateness, absences, overtime, leave taken, flagged check-ins, site attendance summary, proxy check-ins.
- Builder: choose the report, date range, scope (branches, sites, employees), grouping (employee, site, branch, day) and columns.
- Preview with a chart, a table and totals.
- Export to CSV, Excel or PDF, save the report, or schedule it by email (frequency, recipients, format).
- Saved and scheduled reports are listed for editing or deletion.

### Audit log

A read-only list of every manual record edit, proxy check-in, flag decision, leave decision, balance adjustment, role change, employee deactivation and settings change. Each entry shows time, who did it and their role, the action, the target, scope and IP or device; expanding it shows before and after values and the reason given. Filterable and exportable, never editable.

## 11. Users, roles and permissions

Admins decide who can use the dashboard, what each role can do, and which branches or sites it covers.

### Users

A list of everyone with dashboard access: name, email, role, scope summary (for example "2 branches"), last active and status. **Invite user** asks for email, role, scope and an optional message. Row actions: change role, resend invite, revoke access.

### Roles

Default roles (Super admin, Branch admin, Site manager, HR / Viewer, Employee) and custom roles, each with its user count. Roles can be created, duplicated, edited, or deleted when no user holds them.

### Role editor

1. Name and describe the role.
2. Tick permissions in a matrix grouped by module (attendance, proxy check-in, alerts, employees, sites, branches, schedules, leave approval, leave settings, reports, export, users and roles, audit log, settings, billing), with View, Create, Edit, Delete and Approve columns where relevant.
3. Set the scope: whole company, selected branches (tree with checkboxes), own branch, selected sites, own site, or self only.
4. Check the preview panel, which summarises what users with this role will see.
5. Save. Leaving with unsaved changes asks for confirmation.

Example: an "Operations lead" role with attendance, alerts and schedule permissions, scoped to Branch A and Branch B only.

## 12. Settings

Settings hold the company-wide rules that every site, schedule and leave request follows unless overridden.

| Section | What it controls |
| --- | --- |
| Company profile | Name, logo, address, default timezone and language, date/time format, week start |
| Attendance rules | Grace period, early-leave tolerance, auto check-out time, missing check-out handling, overtime rules, minimum GPS accuracy, mock-location blocking, default selfie/QR requirement, offline check-in and maximum sync delay |
| Leave policies | Leave types (name, colour, paid or unpaid, yearly allowance, document required, minimum notice, half-days, carry-over limit), one- or two-level approval, public holidays per branch |
| Notifications | Which events (fraud flag, no-show after grace period, missing check-out, new leave request, leave decision, uncovered intervention) go to which roles, by in-app, push, email or SMS |
| Integrations | Payroll export format, API keys, webhooks, single sign-on |
| Billing | Current plan, employee usage, invoices, payment method, upgrade or downgrade |
| My account | Profile, password, two-factor setup and backup codes, active sessions |
| Danger zone | Export all company data, delete the company (typed confirmation) |

## 13. Troubleshooting and FAQ

Most admin questions are about flags, devices, scope and schedules.

| Question or problem | What to do |
| --- | --- |
| Many valid check-ins at one site are flagged | The geofence is probably too small or misplaced. Edit the site and widen the radius or redraw the polygon |
| An employee changed phone | Open their profile, Device & access, and reset the device. They log in again on the new phone |
| An employee has no smartphone | Switch off "has smartphone" on their profile, print the QR badge and give them their PIN |
| A colleague can't see some employees | Check their role's scope in Users & Roles |
| A shift shows absent but the employee was on leave | Check the leave was approved, not still pending. Approved leave turns the day to On leave automatically |
| Night shift records split across two days | Turn on "crosses midnight" in the recurring schedule |
| An employee forgot to check out | Accept their correction request, or edit the record with a reason |
| I need hours for payroll | Reports, Timesheet, set the period and export to Excel, or schedule it monthly |
| I reached the plan's employee limit | Deactivate former employees or upgrade in Billing |
| Who changed a record? | Open the record's edit history, or filter the audit log by that employee |
