# StaffSync admin: Next.js + TypeScript + Tailwind

All 31 screens of the prototype (`src/screens/`), ported to Next.js (App Router). The prototype's `StaffSync.dc.html` shell/Screens menu is replaced by real routes + `screen-host.tsx`.

```bash
npm install
npm run dev      # http://localhost:3000
```

## Stack
- **Next.js 15 / React 19 / TypeScript**
- **Tailwind CSS 3**: colours are the prototype's CSS variables (`bg-surface`, `text-text-2`, `bg-ok-bg`, `border-border-strong`), so light/dark follows `data-theme`. Preflight is off on purpose (the design relies on browser defaults).
- **next-intl**: EN/FR, locale stored in the `NEXT_LOCALE` cookie (`src/i18n`). Messages in `messages/en.json` and `messages/fr.json`, one namespace per screen.
- **next-themes**: `data-theme` on `<html>`.
- **class-variance-authority + clsx + tailwind-merge**: variants for the UI kit.

## Routes
| URL | Screen |
|---|---|
| `/sign-in`, `/invite`, `/workspaces`, `/onboarding?step=N` | access flow |
| `/admin/{dashboard,live,attendance,alerts,employees,sites,schedules,leave,reports,users,audit,settings,profile}` | admin shell + page |

`src/components/screen-host.tsx` maps the prototype's `onNavigate(target, opts)` to the router and passes theme/locale. Screens render client-side only (they use timers, `window`, `localStorage`).

## Layout
```
messages/            en.json, fr.json, UNTRANSLATED_FR.txt
src/app/             routes, layout, globals.css (tokens + keyframes)
src/components/ui/   Button, Chip, Card, Modal, Drawer, ConfirmDialog, Toast, Tabs, Segmented, Switch, Avatar, Spinner, EmptyState, Field/Input/Select
src/components/      screen-host, searchable-selects (any <select> with 7+ options gets a search popover)
src/screens/         one file per prototype screen (Admin.tsx holds the shell + shared admin logic)
src/i18n/            request config, locale server action
src/lib/             dc-logic (base class), routes, utils
```

## How the screens were ported
Each prototype screen became one `.tsx` file: its original controller (state, handlers, `renderVals()`) kept as a class, plus the template converted to JSX. Static inline styles became Tailwind classes (`hover:`/`focus:` variants included). Styles that depend on runtime values stay as `style={{}}`. Static template text moved to `messages/*.json` and is read with `tr('key')`.

## Known limits (read before building on it)
1. **Screens are `// @ts-nocheck`.** The logic is untyped JS ported as-is. The shared layer (`ui/`, hosts, i18n, routes) is strictly typed. Next step: type the data (employees, records, sites) and drop the pragma screen by screen.
2. **Screens don't use `components/ui/` yet.** The kit is ready, but the screens still hold their own markup. Replace repeated patterns (chips, modals, drawers, toasts, tabs) as you touch each screen.
3. **Bilingual strings built in logic** (`['Sign out','Se déconnecter']` pairs) still switch on the `lang` prop, which now comes from next-intl. Move them into `messages/` over time.
4. **FR coverage:** 167 of 795 extracted template strings were matched to existing French pairs. The rest fall back to English, listed in `messages/UNTRANSLATED_FR.txt`.
5. Sample data, SVG map, pseudo-QR and chart visuals are still placeholders (see `HANDOFF.md`). Swap in real APIs and a map SDK.
6. Theme and role toggles inside screens stay local. Language toggles call the locale action. Role is read from `sessionStorage` after the workspace switcher.
7. Not run through `next build` here. JSX/TSX of every file was syntax-checked, so expect a few type or lint fixes on first build.
