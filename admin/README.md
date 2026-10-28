# StaffSync Admin

The web dashboard for StaffSync, the attendance and workforce platform: live attendance, schedules, leave, employees, sites with geofences, reports, users and roles, audit log and settings. English and French, light and dark.

Built with Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict), Tailwind CSS v4, next-intl, next-themes, zustand, TanStack Query, Leaflet, Recharts and lucide-react. Geist is the typeface.

## Run it

```bash
yarn install
yarn dev            # http://localhost:3000
```

The dashboard talks to the StaffSync API. Start the backend first (`../scripts/dev.sh --seed` starts everything), then sign in with `admin@admin.com` / `admin12345`, pick a workspace, and you land on the Overview.

The API address comes from `NEXT_PUBLIC_API_URL` (default `http://localhost:8000/api/v1`; see `.env.local`). Each screen keeps its data in a store and reads and writes it through a `services/*.ts` module; `src/data/` now holds mostly constants and type tables (such as the live-board date helpers, alert and audit labels); any sample records left there are only the initial state before the API data loads.

Single sign-on buttons call the API, which answers "not configured" until Google or Microsoft credentials are set up. Live updates (the live board, dashboard feed) use the API's WebSocket.

| Script | What it does |
| --- | --- |
| `yarn lint` | ESLint over the whole project |
| `yarn typecheck` | Generates route types, then `tsc --noEmit` |
| `yarn i18n:check` | English and French have the same keys and the same placeholders |
| `yarn keys:check` | Every `t("…")` key used in `src/` exists in both languages (see the note below) |
| `yarn build` | Production build |

`keys:check` is static. It cannot see keys built from variables, or conditions that contain parentheses. Check those in the browser in both languages.

## How the dashboard works

**Who sees what.** A user has a *role* (admin, branch manager, site manager) and a *scope* (whole company, one branch, one site). The role decides which pages and buttons exist (`src/lib/permissions.ts`). The scope decides which data is shown: every list is filtered to the sites in scope (`src/lib/scope.ts`). The scope switcher in the top bar narrows the view inside what the role allows. A page the role cannot open shows a "no access" state (`PageGuard`).

**Flow.** Sign in (or accept an invitation, or create a company with the 8-step onboarding) → choose a workspace → Overview. `src/proxy.ts` sends signed-out visitors to the sign-in page.

**Pages.**

| Page | Purpose |
| --- | --- |
| Overview | KPIs, live site map, "needs attention" queue, punctuality, trends, activity stream |
| Live board | Who is in right now; check people in or out on their behalf |
| Attendance | Records with filters, saved views, edit, approve, export, and a full audit trail per record |
| Alerts | Flagged check-ins (outside the geofence, mock location, low accuracy) to review and resolve |
| Employees | List, CSV import, profile with seven tabs, badge and PIN for people without a smartphone |
| Branches & Sites | Branch tree, sites map, geofence editor (circle or polygon, overlap warning, satellite), QR codes. The geofence is the source of truth for mobile check-ins |
| Schedules | Week, day and month planner, recurring schedules and one-off interventions, conflict checks, publish |
| Leave | Request inbox with a two-step approval trail, team calendar, balances with adjustments |
| Reports | Nine report types, table or chart, scope, grouping, saved and scheduled reports, CSV / Excel / PDF export |
| Users & Roles | Dashboard users, invitations, roles with a permission matrix and scope tree |
| Audit log | Read-only record of who changed what, with before/after values |
| Settings | Company profile, attendance rules, leave policies, notifications, integrations, billing |
| Profile | Personal details, password, two-factor authentication, sessions, personal notifications |

## Project layout

```text
src/
  app/            routes: (auth) sign-in, invite, workspaces, onboarding; (admin) the 13 pages
  components/     ui/ (buttons, dialogs, tabs…), layout/ (shell), map/ (Leaflet)
  features/       one folder per module: screens, dialogs, model, helpers
  store/          zustand stores (session, data, leave, schedule, users, settings, …)
  data/           typed sample data
  services/       async functions the screens call (swap for a real API)
  lib/            permissions, scope, time, export, cookies, small hooks
  i18n/           next-intl request config and the language action
  types/          shared domain types
messages/         en.json and fr.json
docs/             KNOWN-LIMITATIONS.md
```

Language is stored in the `NEXT_LOCALE` cookie (no URL prefix). Theme is light, dark or system.

## Before connecting a real backend

`docs/KNOWN-LIMITATIONS.md` lists what is simulated today (sample data, invitations, integrations, 2FA, report figures, custom roles not enforced) and what to replace first.
