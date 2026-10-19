# StaffSync admin — handoff summary

## Product
B2B SaaS for attendance at physical job sites. Company → Branches → Sites (GPS + circle/polygon geofence). Employees check in/out from a mobile app inside the geofence; managers can check in on their behalf; out-of-fence or spoofed check-ins are flagged. Access = permissions × scope (company / branches / own branch / sites / own site / self). Desktop-first 1440px, tablet responsive, light/dark, EN/FR.

## File structure (rule in CLAUDE.md)
- **One Design Component per screen** (template + its own `class Component extends DCLogic` in the same `.dc.html`). `support.js` is the shared runtime only; don't edit it.
  - `StaffSync.dc.html` — router/shell: Screens menu, route `<sc-if>` + `<dc-import dc-props=...>` per screen, tweak props.
  - `SignIn.dc.html` (`si`), `Invite.dc.html` (`iv`), `Workspaces.dc.html` (`ws`), `Onboarding.dc.html` (`ob`), `Admin.dc.html` (`ad`) — each returns its vals under its namespace key.
  - `Admin.dc.html` holds the admin shell (sidebar, header, modals, toasts) and the shared admin logic. Admin pages are template-only components receiving the `ad` prop: `AdminDashboard`, `AdminLive`, `AdminAttendance`, `AdminLeave`, `AdminProfile` (personal profile: details, role & access, password, 2FA, sessions, my notifications; opened from the account menu, separate from company settings), `AdminSettings` (settings area with left sub-nav: company, attendance rules, leave policies, notifications, integrations, billing, danger zone; read-only details, each group edited in a modal, toggles save instantly; self-contained), `AdminAuditLog` (read-only audit log: filters, expandable before/after diff, export; self-contained), `AdminRoleEditor` (full-page role editor: permission matrix, data-scope tree, live preview, unsaved-changes guard; opened from AdminUsers), `AdminUsers` (users & roles: dashboard users, roles, invite / change-role / role editor; self-contained), `AdminReports` (report library, builder with chart/table preview, export, save, scheduled email; self-contained), `AdminLeaveCalendar` + `AdminLeaveBalances` (Calendar / Balances views of the Leave page, switched from the AdminLeaveInbox header; balances has the adjust modal), `AdminLeaveDrawer` (leave request detail drawer opened by clicking an inbox row: balance, coverage check, approval trail, decisions), `AdminLeaveInbox` (leave requests inbox on the Leave page; replaces AdminLeave, which is now unused), `AdminScheduleModal` (create schedule modal: recurring + one-off intervention, conflict check, draft/publish; opened from AdminSchedules "New schedule"), `AdminSchedules` (schedules planner: day/week/month, drag & drop, conflicts, publish; self-contained), `AdminSiteDetail` (6-tab site detail, opened from AdminSites View), `AdminSiteEditor` (full-page create/edit site with map geofence editor, opened from AdminSites; replaces the old site modal), `AdminSites` (sites map/list, mounted inside AdminBranches via its Branches/Sites switch), `AdminBranches` (branches screen on the `sites` page: list, detail, add/edit modal, archive/delete with reassign), `AdminEmployeeProfile` (7-tab employee profile, replaces the list in AdminEmployees when open), `AdminEmployeeForm` (add/edit employee drawer, opened from AdminEmployees), `AdminEmployees` (employees list + CSV import wizard, self-contained), `AdminAlerts` (fraud & alerts center, self-contained logic + data),`AdminOther`, `AdminDrawer` (record detail drawer, `ad.d`). Sub-objects: `ad.lb` live board, `ad.ar` attendance records.
  - New screen = new `Name.dc.html`, a route in `StaffSync.dc.html`, and a Screens menu entry.
- `_orig.bak` is the pre-split single file (safe to delete).
- `assets/staffsync-logo.png` is the logo. The attached design system project is empty, so the visual tokens are defined in the page (CSS variables under `[data-theme=light|dark]`).

## Visual system
Geist + Geist Mono. Accent #0B67DD (dark mode #3B8BFF). Semantic colours: ok = green (on time), warn = amber (late / early leave), bad = red (absent / flagged), info = blue (on leave), orange (missing check-out), violet (overtime), neutral = grey (scheduled / holiday). Inline styles only. 12px card radius, 9px controls, status chips with a dot.

## Screens built
- **Sign in:** split layout, SSO, EN/FR, states: loading / wrong / locked countdown / deactivated / offline. Password "staffsync" goes to the workspace switcher.
- **Accept invitation:** valid / expired / already used.
- **Workspace switcher:** company cards, search, ended-trial card, create new company.
- **Onboarding wizard:** 8 steps + finish (account, verify code, company, branch, site with map pin + radius, hours + grace period, invite team / CSV, plan).
- **Admin app shell:** collapsible sidebar, permission-filtered navigation, plan usage, scope switcher, global search, notifications, help and user menus, tablet layout with hamburger.
- **Overview dashboard, Live attendance board, Leave requests.**
- **Attendance records list:** saved views, full filter bar, sortable table, column visibility, pagination, bulk actions, CSV/Excel/PDF export, empty and no-results states.
- **Record detail drawer:** scheduled vs actual, mini-map, GPS/device info, selfies, timeline, edit history with before/after, notes, edit times / change status (reason required), flag approve/reject, delete with confirmation.
- **Add manual record modal:** employee search, site, date, times, status (auto), required reason, evidence files, overlap check.

## Tweaks (props)
startScreen, showSwitcher, sidebar, layout, role (admin / branch / site), theme, lang, dashState, recordsState, signinState, inviteState, onboardingStep.

## Shared behaviours & reusable pieces
There is no component library: each screen is self-contained, and these patterns are repeated by convention. Reuse them when adding a screen.

### Global behaviours (in `StaffSync.dc.html`, apply to every screen)
- **Searchable selects** (`searchableSelects()`): any native `<select>` with **7 or more options** opens a floating panel with a search box instead of the browser list. Typing filters, arrows move, Enter picks, Esc or an outside click closes, and the panel flips upward when space below is short. Picking sets the value and fires a normal `change` event, so existing `onChange` handlers work unchanged. Selects with 6 options or fewer stay native. The threshold is `MIN` in that function. Nothing to add per screen: use a plain `<select>`. Multi-selects use their own inline search boxes.
- **Theme / language / role**: set by tweak props on the shell. Colours come from CSS variables (`--surface`, `--text`, `--accent`, `--ok-bg`…), so use the variables, never hex, and dark mode works.
- **Persistence**: the shell stores route and admin page, and restores them on load (`persist()`, `pageChange`).

### Child component contract (`<dc-import>`)
- Mount with `<dc-import name="AdminX" prop="{{ val }}" hint-size="100%,800px"></dc-import>`. Kebab-case attributes become camelCase props (`on-open="…"` → `props.onOpen`).
- Data goes **down as props**, events go **up as function props** (`onOpen`, `onOpenSettings`, `onBack`). A screen never imports a sibling's state.
- Each screen returns its template values under one namespace key (`a`, `p`, `c`…) from `renderVals()`. Holes are dotted paths only, so compute everything in JS.
- Admin pages that need shell state (record drawer, toasts, permissions) receive the `ad` prop from `Admin.dc.html`. Self-contained screens keep their own `state`.

### Patterns used in most screens
- **Permission gating**: `Admin.dc.html` builds a permissions object `P` from the role, so nav items and pages are filtered. `P.admin || P.settings` gates company settings. A page the role can't use renders the "no access" state (`noAccess`). Own profile is always allowed.
- **Data scope**: `SN` is the sample site map (id → name, branch). Screens filter people and records by branch/site through it. Replace with API data later.
- **Toast**: `say(msg)` sets `state.toast` and clears it after ~2.6 s (timer cleared in `componentWillUnmount`). Rendered as a fixed bottom-centre pill.
- **Confirm dialog**: `state.c = {title, msg, noL, okL, act}`. A fixed overlay shows it, `cOk` runs `act`, `cNo` clears it. Used for destructive actions (delete, turn off 2FA, discard changes).
- **Edit modal**: `state.m = {kind, d, tried}` where `d` is the draft and `tried` turns on validation messages. Fields are generated from a spec list. Save validates, merges the draft into the data, then shows a toast. Used by AdminSettings and AdminProfile.
- **Unsaved-changes guard**: compare `JSON.stringify(state.v)` with `state.base`. If different, show a sticky Save/Discard bar, and a confirm dialog when leaving the tab or screen.
- **Drawer**: fixed right panel with an overlay, Esc to close, sticky header and footer actions (AdminDrawer, AdminLeaveDrawer, site/employee drawers).
- **Filter bar**: selects + search input + "Clear filters" shown only when a filter is active, with a result count above the list.
- **List table**: grid columns inside `overflow-x:auto` with a `min-width`, a sticky header, a row action menu, an empty state and a "Show N more" pager.
- **Expandable row**: click toggles `state.open = id`, rotating the chevron (AdminAuditLog, AdminAlerts).
- **Tabs / segmented switch**: `state.tab` + buttons with a 2 px accent underline, or a pill group for view switches (month/quarter, map/list, by site/by branch).
- **Chips**: status/severity pills use `--{tone}-bg` with `--{tone}` text, tones ok / warn / bad / info / orange / violet / neutral.
- **Export**: builds a Blob from the filtered rows (CSV, or tab-separated `.xls`) and clicks a temporary `<a download>`.
- **Map / geofence**: SVG-based sample map in AdminSiteEditor (circle with radius, or polygon with draggable vertices; area and perimeter computed) and mini-maps in the record drawer and alerts. Swap for a real map SDK in production.
- **Pseudo-QR**: a seeded 21×21 grid of `<rect>`s (site QR, 2FA setup, badges). Placeholder only; generate real codes server-side.
- **Drag and drop**: AdminSchedules (employees/interventions onto cells, resize handles) uses native pointer/drag events with a `state.drag` object and conflict detection recomputed on each render.

### Reusable screen-level pieces
- `AdminRoleEditor` — permission matrix + scope tree + preview. Mount from Users & roles with a role object, get `onSave` / `onCancel`.
- `AdminScheduleModal` — create schedule (recurring / one-off). Opened from AdminSchedules.
- `AdminLeaveDrawer` — leave request detail. Open it with a request id. The leave calendar and inbox both do.
- `AdminLeaveCalendar` / `AdminLeaveBalances` — props `items`, `people`, `onOpen`; switched from the leave inbox header.
- `AdminProfile` — props `tab`, `roleName`, `scope`, `canSettings`, `onOpenSettings`.
- `AdminAuditLog` — no props. Entries come from the `L` array, shape `{day, time, actor, action, type, target, site, reason, diff:[[field, before, after]]}`. Add entries there, or load from the API with the same shape.

## Not built yet / known gaps
- All admin screens are built (Overview, Live, Attendance, Alerts, Employees, Branches & Sites, Schedules, Leave, Reports, Users & Roles, Audit log, Settings, My profile). Remaining stubs: help-menu items (Help center, Shortcuts, What's new, Contact, Mobile app) only show a toast.
- The onboarding wizard is English only.
- The dashboard shows "Batiplus Group" whichever workspace you open.
- Selfies are placeholder tiles.
- Data is made up; sample history covers 1–15 Oct 2026.
- Admin logic is still one large controller in `Admin.dc.html`.
- Custom roles made in Users & roles are not wired into the admin shell's permission object yet (only the three sample roles are).
- Map, QR and chart visuals are placeholders (see patterns above).
