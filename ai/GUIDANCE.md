# AI Agent Guidance — DownTrack

This file is the canonical reference for AI agents (Claude Code, Copilot, etc.) working in this repo. Read it at the start of any session. Update the changelog whenever you make changes.

---

## Project Overview

**DownTrack** is a React 19 SPA for personal GLP-1 weight loss tracking. No backend — all state lives in `localStorage`. Deployed to Netlify.

- **Stack:** React 19, Vite 6, recharts, `@gtivr4/a1-design-system-react` v0.6.0
- **Entry:** `src/App.jsx`
- **State:** `src/store/useStore.js` (localStorage-backed, `addCheckin` is an upsert by date)
- **i18n:** `src/labels/labels.json` + `LabelsProvider` / `useLabel` from the design system

---

## Key Architecture Decisions

### Design System Patches
`scripts/patch-design-system.sh` runs on `postinstall` to patch unpublished features into `node_modules/@gtivr4/a1-design-system-react`. Patches are vendored in `scripts/vendor/`. **Do not bypass this script.**

Patched components: `structure-utils.js`, `maskUtils.js`, `FieldsetContext.js`, `DefinitionList`, `Icon` (size/color), `Dialog` (status/hero), `TopHeader` (endSlot — vendor-only).

### Vite Pre-bundling Cache
Vite caches `node_modules` at startup. If a patch isn't being picked up, clear `.vite/` inside `node_modules/.vite` or restart with `--force`. **Do not fight the cache by trying to hot-patch and reload** — either confirm the patch lands before the dev server starts, or use the fixed-overlay pattern (see SettingsMenu).

### Fixed-Overlay Pattern (SettingsMenu)
`SettingsMenu` is rendered as a `position: fixed` div at the App level rather than injected into `TopHeader`. Uses CSS vars `--component-top-header-height` and `--component-top-header-z-index` to align. Reason: TopHeader patch for `endSlot` was blocked by Vite cache.

### Single-Page Layout
There is no router. `App.jsx` shows one of three views sequentially:
1. `Onboarding` — 4-step form, stores profile to `localStorage`
2. `WelcomeResults` — post-onboarding summary
3. `CheckIn` — the main app (weight stepper + live stats + chart)

### Validation Pattern (Onboarding)
Never disable the Continue button. Use an `attempted` state (set on Continue click) that gates an `e` errors object. Errors clear reactively as fields are filled. See `Onboarding.jsx`.

### Auto-Save (CheckIn)
Weight debounces 600ms via `useEffect` with an `isDirty` ref that skips the initial render. Live stats are computed from a synthetic checkins array that injects the current (unsaved) weight.

---

## File Map

| Path | Purpose |
|---|---|
| `src/App.jsx` | Root — view routing, SettingsMenu overlay |
| `src/store/useStore.js` | localStorage state (profile, checkins, locale) |
| `src/views/Onboarding.jsx` | 4-step onboarding form |
| `src/views/WelcomeResults.jsx` | Post-onboarding results page |
| `src/views/CheckIn.jsx` | Main app — weight stepper, stats, chart, table |
| `src/components/ProgressChart.jsx` | recharts line chart with goal reference line |
| `src/components/WeightStepper.jsx` | +/− weight input with hold-to-repeat |
| `src/components/SettingsMenu.jsx` | Fixed-overlay settings icon → menu → language + reset |
| `src/utils/calculations.js` | BMI, TDEE, goal plan, unit conversions, progress stats |
| `src/labels/labels.json` | i18n strings (en/es) |
| `scripts/patch-design-system.sh` | DS patch runner (postinstall) |

---

## Design System Component Notes

- `Section` — use `contentWidth` (`xs`, `sm`, `md`, `lg`) to constrain width. Use `surface` for background.
- `SegmentedControl` — use `aria-label` not `label` (avoids spreading to DOM). Set `style={{ width: 'fit-content' }}` to prevent full-width stretch.
- `ChoiceGroup` — supports `multiple` for multi-select. Use `columns={2}` for grid layout.
- `Calendar` — supports `variant="paginated"` (month-by-month), `selectable`, `todayButton`, `maxDate`/`minDate`, controlled via `selectedDate` + `onChange`.
- `Banner` — use instead of informational Cards. Supports `status` (`success`, `warn`, `info`, `error`) and `icon`.
- `Dialog` — supports `status="error"` for destructive confirmations.

---

## Dev Toolbar

In dev mode (`import.meta.env.DEV`), a scenario switcher bar renders at the top. Mock scenarios live in `src/dev/mockScenarios.js`. They load synthetic profile + checkin data into the store without modifying real localStorage.

---

## Conventions

- **No router** — don't add one unless the user explicitly requests it.
- **No comments** unless the WHY is non-obvious.
- **No disabled buttons** in forms — show inline errors instead (see validation pattern).
- **Unit conversions** always happen in `handleUnitChange` in Onboarding, which converts all stored values when the user switches Imperial ↔ Metric.
- **Recharts** is the charting library. Use `ResponsiveContainer` + design system CSS vars for theming. Do not use the hand-drawn SVG approach.
- **Do not create `.md` documentation files** unless the user asks (except CHANGELOG.md, which you must update on every change).

---

## Updating the Changelog

After every set of changes in a session, prepend an entry to `CHANGELOG.md` in this format:

```
## [Unreleased] YYYY-MM-DD

### Added / Changed / Fixed
- Short description of what changed and why
```

Use today's date. Group related changes into one entry per session. Be specific about files changed.
