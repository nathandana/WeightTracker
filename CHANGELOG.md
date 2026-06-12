# Changelog

## [0.9.0] 2026-06-12

### Added
- **Favicon** — SVG geometric DownTrack mark at `public/favicon.svg`, wired into `index.html` with a `theme-color` (the site previously had no favicon)
- **i18n coverage for Onboarding & DataPage** — every rendered user-facing string now goes through the label system (en + es):
  - Onboarding step headings, "Next…" buttons, "Let's get going!", sign-in prompt, "Create your account" (new `onboarding.*` keys; component copy had diverged from the stale existing keys)
  - DataPage page title, empty state, tab labels, DataTable column headers + badge values (reusing `survey.*` keys), chart titles/subtitles, notes dialog
- **AuthPage / Onboarding now render in the active locale** — their `LabelsProvider` was hardcoded to `locale="en"`; switched to `store.locale` so translations actually appear

### Changed
- Bumped app version to 0.9.0
- "How are you feeling?" card opens to the summary step when the day's survey is already filled in (gated on survey answers, not the auto-saved weight)
- Onboarding create-account screen now has a working Back path; onboarding routes are individual URLs with browser back/forward support
- AuthPage uses `Section` + DS `Link` components instead of raw wrapper divs and styled `<button>`s

### Notes
- A11y: 26 axe checks pass with zero critical/serious violations. 2 SettingsPage edit-dialog tests remain failing as pre-existing fixture debt (they seed legacy localStorage and can't reach `/settings` under Supabase auth) — not a real violation.
- `src/views/Profile.jsx` and `src/views/Progress.jsx` contain untranslated strings but are dead code (not imported anywhere).
- iOS `apple-touch-icon` PNG still needed (no SVG rasterizer available locally to generate it).

## [Unreleased] 2026-06-11 (session 4)

### Added
- **Age default** — onboarding `age` field now defaults to `40` instead of empty
- **StickyActions in onboarding** — all five onboarding screens (Steps 1–4 + WelcomeResults) now pin their `StepTracker` + `ButtonContainer` to the bottom of the viewport via the new `StickyActions` DS component; `Section` content gets bottom padding so the last item isn't hidden behind the bar
- **Loading spinner** — `LoadingScreen` now shows an indeterminate `CircularProgress` (lg) instead of plain "Loading…" text

### Changed
- **App.jsx routing rewritten as an explicit `view` state machine** (`loading` / `onboarding` / `login` / `signup` / `app`) — fixes the race where signing in flashed Onboarding for one render. Rules: an authenticated user always lands on the app; the *only* path back to onboarding is an explicit in-app data reset (`reonboard` flag set by `handleResetData`). Sign-out returns to onboarding step 1.
- **useStore.js** — added a `settled` flag (true only after the first Supabase fetch completes for the current user) so routing never reacts to a stale `dataLoading=false`
- **SettingsPage.jsx** — "Reset All Data" now calls the App-provided `onResetData` (resets store **and** triggers re-onboarding) instead of `store.reset()` directly
- **CheckIn.jsx** — restored a "Head to Settings to finish setting up your profile" fallback for the edge case of an authenticated user with no profile

### Fixed
- **Cloud saves were silently failing** — the `profiles` and `weight_entries` tables had never been created in Supabase (only `delete_user()` had been run), so every fire-and-forget save errored to the console and `fetchProfile` returned null. Created the tables and their RLS policies; verified insert/upsert/read end-to-end against the live DB.
- **`weight_entries` RLS** — table had RLS enabled with **zero policies**, denying all writes (error 42501). Added the four `select/insert/update/delete` policies.
- **Upsert RLS** — both `profiles` and `weight_entries` update policies now include a `with check` clause (required for `INSERT … ON CONFLICT DO UPDATE` upserts to pass RLS)
- **schema.sql is now idempotent** — `drop policy/trigger if exists` before each create, so the script is safe to re-run

## [Unreleased] 2026-06-11 (session 3)

### Added
- **SettingsPage Account card** — dedicated card showing display name + email (via `DefinitionList`), Sign Out button, and Delete Account button with a confirmation `Dialog` (error status, loading + error states)
- **Delete account flow** — `deleteAccount()` in `AuthContext` calls `supabase.rpc('delete_user')` then signs out; `SECURITY DEFINER` stored procedure in `supabase/schema.sql` performs the deletion server-side with cascade
- **Labels** — `settings.email`, `settings.deleteAccount`, `settings.deleteAccountTitle`, `settings.deleteAccountBody`, `settings.deleteAccountConfirm`, `settings.deletingAccount` added to `labels.json` (en + es)

### Changed
- **App.jsx** — authenticated users with no profile (e.g. after "Reset All Data") now see Onboarding again instead of an empty main app; no forced login at that point
- **CheckIn.jsx** — removed the "Set up your profile in Settings to get started" fallback screen; routing now handles the no-profile case at the App level
- **useStore.js** — removed dev-only `loadMockData` and `restoreRealData` methods (unused after dev bar removal)
- **SettingsPage.jsx** — removed the `{onSignOut && ...}` Account section from the Data card; Account is now its own card; imports `useAuth` directly for `user.email` and `deleteAccount`

## [Unreleased] 2026-06-11 (continued)

### Added
- **User menu in TopHeader** — `actions` prop with `account_circle` icon; dropdown shows name/email header row and Sign Out (sm+ breakpoints)
- **Account dialog for xs** — 4th "Account" tab in `BottomDrawer` opens a `Dialog` with display name, email, and Sign Out; visible only at xs where TopHeader is hidden
- **"Already have an account? Sign in"** link below the "Let's get going!" button on Onboarding Step 1; wires back to Auth login via `onSignIn` prop passed through `Onboarding` → `Step1AboutYou`

### Changed
- **Auth flow** — Onboarding now precedes account creation; `pendingProfile` stored in `localStorage` survives email-confirmation redirects; `AuthPage` shown in signup mode after onboarding, login mode when user taps "Sign in"
- **Step1AboutYou** — "Goal is higher than start weight" Banner now deferred until both weight fields have been blurred (was showing while user was still typing)

## [Unreleased] 2026-06-11

### Added
- **Supabase Auth** — Email/password sign-up, login, log out, forgot-password reset flow via `src/lib/AuthContext.jsx` (`AuthProvider` + `useAuth` hook)
- **Supabase Postgres** — User data now persists in the cloud; `src/services/db.js` centralises all CRUD with snake_case ↔ camelCase conversion and local-time-safe date handling
- **AuthPage** (`src/views/auth/AuthPage.jsx`) — Login, sign-up, and forgot-password screens built with existing DS components (no Supabase prebuilt UI)
- **Database schema** (`supabase/schema.sql`) — `profiles` and `weight_entries` tables with RLS policies; unique constraint on `(user_id, entry_date)` enables upsert-by-date
- **localStorage migration banner** — on first login, if pre-auth data exists in `journey-checkin-v1`, a `SystemBanner` offers to import it into Supabase; sets `journey-checkin-migrated` flag on completion
- **Sign Out button** in `SettingsPage` (Account section) via new `onSignOut` prop
- **`settings.account` / `settings.signOut`** keys added to `labels.json` (en + es)
- **`.env.example`** — documents required env vars; real keys live in `.env.local` (gitignored via `*.local`)

### Changed
- **`src/store/useStore.js`** — completely rewritten; language preference stays localStorage, all other state syncs with Supabase; same public API so no view changes were needed; exports `LEGACY_STORAGE_KEY` for migration detection
- **`src/App.jsx`** — wraps auth guard (loading spinner → AuthPage → app); passes `onSignOut` to SettingsPage; dev toolbar shows current user email and a sign-out button
- **`src/main.jsx`** — wrapped in `<AuthProvider>` so `useAuth()` is available everywhere
- **`@supabase/supabase-js`** added to `dependencies`

## [0.7.0] 2026-06-11

### Fixed
- **i18n: Language switching now visibly changes UI text** — `SettingsPage.jsx` was using all hardcoded strings; rewrote it to call `l()` throughout (profile items, activity/sex/med display values, all dialog and button labels)
- **labels.json** — Added 25+ missing translation keys that active code referenced but fell back to English: `settings.*` namespace, `validation.*` namespace, `common.cancel/close/edit/years`, `onboarding.startDate`, `onboarding.changeDate`, `onboarding.targetDate`, `onboarding.quickTimelines`, `onboarding.chooseDate`, `onboarding.otherMed/otherMedPlaceholder`, `onboarding.startDateToday`, `onboarding.goalHigherWarning`, `onboarding.bmiTitle`
- **onboardingConfig.js** — `MED_OPTIONS` 'None' option now goes through `l('onboarding.medNone')` instead of hardcoded English

## [0.6.0] 2026-06-11

### Changed
- **index.html** — Google Fonts stylesheet loaded non-blocking (`media="print" onload="this.media='all'"`) with `<noscript>` fallback; removes fonts from critical render path
- **index.html** — Material Symbols Outlined axes narrowed from full variable range (`20..48,100..700,0..1,-50..200`) to fixed single values (`24,400,0,0`); significantly reduces font download size
- **App.jsx** — all four views (`Onboarding`, `CheckIn`, `DataPage`, `SettingsPage`) converted to `React.lazy` + `Suspense`; reduces initial JS bundle from 720 kB to 242 kB by deferring recharts/d3 (314 kB) until the Data page is visited
- **PastCheckinDialog.jsx** — removed `minDate` from Calendar; all past dates are now selectable, only future dates disabled via `maxDate`

## [0.5.0] 2026-06-11

### Added
- **PastCheckinDialog** (`src/components/PastCheckinDialog.jsx`) — new dialog to log historical weight entries: paginated single-month Calendar for date selection (capped at today, floored at profile start date), bold NumberField for weight, Accordion with optional feeling survey (mood, activity, calories, notes textarea with 500-char limit); buttons in Dialog footer
- **useStore.js** — `saveCheckinForDate(entry)`: upserts a check-in by date (replaces if same day exists), keeps checkins sorted chronologically
- **CheckIn.jsx** — "Log past" tertiary button in heading row opens PastCheckinDialog

### Changed
- **App.jsx** — replaced custom hand-rolled bottom nav with DS `BottomDrawer` component; `bottomNavItems` derived without `href` so BottomDrawer uses `<button onClick>` (prevents full-page reloads); `navItems` gains `id` on each entry
- **App.css** — xs breakpoint now hides `TopHeader` (`display: none`) and shows BottomDrawer; sm+ hides `.bottom-nav-ds`; TopHeader `navIconPosition` set to `{ xs: 'hidden', sm: 'above' }` so logo-only bar is suppressed entirely on mobile
- **CheckIn.jsx** — removed `checkins.length > 0` guard on main content section; weight stepper and check-in flow now always visible for any user with a profile (including first-time/zero-checkin state)
- **CheckIn.jsx** — removed `align="center"` from the inline check-in card Stack so textarea and ButtonContainer stretch full width like ChoiceGroup steps
- **@gtivr4/a1-design-system-react** — updated `0.8.0` → `0.10.0`

### Fixed
- **App.css** — CSS container query for `.boldInput`: `container-type: inline-size` and `container-name: bold-input` now correctly placed on `.boldInput` class (not on DS inner `.a1-field__control`); fixes zero-width field regression; `@container` query sets `font-size: 1.5em` at `max-width: 299px`

## [0.3.0] 2026-06-10

### Fixed
- **CheckIn.jsx** — Summary display now uses styled `Paragraph` components with color coding instead of non-existent Badge component; colors reflect status (success/warn/error/info) based on selection values

### Changed
- **App.css** — TopHeader now always visible on all breakpoints (removed `@media (max-width: 480px) { .a1-top-header { display: none } }`); bottom nav (56px) still shown on xs alongside TopHeader

## [Unreleased] 2026-06-10 (11)

### Changed
- **CheckIn.jsx** — check-in flow redesigned:
  - Added subheading "Optionally keep track of your daily details" on first step
  - Moved "Check In" button from Summary step to Notes step (Notes is now the final interactive step)
  - Summary redesigned: replaced `DefinitionList` with large `Badge` components with status colors (e.g., mood/activity "Amazing"/"Intense" → success badges, "Tough Day"/"Slightly over" → warn badges)
  - Button layout now shows: on choice steps → "Next", on Notes step → "Check In", on Summary → "Check In" (user can review but doesn't need to advance beyond Notes)

## [Unreleased] 2026-06-10 (10)

### Changed
- **SettingsPage.jsx** — Edit Profile dialog form now uses onboarding configurations: `NumberField`s have `suffix` (units), `inputMode`, `step`, and min/max values matching onboarding (e.g., startWeight min=20/max=700, heights min=3/max=8 feet, etc.); changed layout to use `FieldRow` for weight and height pairs; removed all `size="comfortable"` (using default form sizes); `ChoiceGroup`s for Activity Level and Medications now use `ACTIVITY_OPTIONS(l)` and `MED_OPTIONS(l)` from onboardingConfig (includes subtexts)

## [Unreleased] 2026-06-10 (9)

### Changed
- **App.jsx** — removed `SettingsMenu` overlay (top-right gear icon); import removed
- **CheckIn.jsx** — added "Your Profile" card at the top displaying all profile details (start/goal weight, height, age, sex, activity, medications, start/target dates) as a `DefinitionList` (same format as SettingsPage); added helper `fmtProfileDate()` for date formatting

## [Unreleased] 2026-06-10 (8)

### Added
- **SettingsPage.jsx** — full implementation with 2-card grid layout:
  - Card 1 ("Your Profile"): `DefinitionList` of all profile details (start/goal weight, height, age, sex, activity, meds, dates) + Edit button that opens a Dialog form with `NumberField`, `RadioGroup`, `ChoiceGroup` (multi for meds with "None" mutual-exclusion logic), and conditional `TextField` for "Other" med; saves via `store.saveProfile`
  - Card 2: Language `RadioGroup` (English/Español) wired to `store.setLocale`; Data section with destructive "Reset All Data" button that opens a confirmation Dialog calling `store.reset`
- **App.jsx** — `<SettingsPage store={store} />` now passes store (was `<SettingsPage />` with no props)

## [Unreleased] 2026-06-10 (7)

### Changed
- **ProgressChart.jsx** — weight line `strokeWidth` 2.5 → 4, dots r 3/5 → 5/7; goal reference line `strokeWidth` 2 → 3, dash pattern `6 3` → `10 4`, label font-size/weight increased for better visibility
- **DataPage.jsx** — BMI Trend line `strokeWidth` 2.5 → 4, dots r 3/5 → 5/7 to match; Habits chart removed; unused recharts imports (`BarChart`, `Bar`, `Legend`) removed

## [Unreleased] 2026-06-10 (6)

### Added
- **CheckIn.jsx** — stat cards (Lost, To Go, Streak, Progress) and `ProgressChart` restored above the recent check-ins table; chart data uses `liveCheckins` so it tracks live weight changes

### Fixed
- **useStore.js** — `addCheckin` now merges with the existing today entry (`{ ...existing, ...entry }`) instead of replacing it; weight-only debounce saves no longer erase notes/mood/activity/calories
- **CheckIn.jsx** — `liveCheckins` synthetic today entry spreads `todayCheckin` fields so notes/mood/etc stay visible in the table while the weight column shows the live value

## [Unreleased] 2026-06-10 (5)

### Added
- **App.css** — dark mode fix: `@media (prefers-color-scheme: dark) { html.a1-theme-fresh { ... } }` block added with all design-system dark token overrides; resolves specificity conflict where `html.a1-theme-fresh` (0,1,1) was beating the `:root` dark query (0,1,0); page background uses `#0a1f1a` (dark teal) to preserve the fresh-theme mint character

### Changed
- **App.jsx** — history-API routing added: page state driven by `window.location.pathname`, `navigate()` uses `pushState`, `popstate` listener syncs back/forward; bottom nav and `TopHeader` both use real hrefs; `logoHref="/checkin"` set
- **App.jsx** — URL-based dev profiles: `?scenario=<id>` query param read on mount (DEV only), applied via `store.loadMockData()`; dev bar shows active scenario hint; param persists across page navigations
- **DataPage.jsx** — tab state synced to URL: `?tab=charts` set via `replaceState` on tab switch, read on mount so direct links land on the right tab
- **DataPage.jsx** — `variant="sytem"` typo fixed → `variant="system"` in all three notice banners
- **CheckIn.jsx** — DataTable now uses `liveCheckins` (not `checkins`) so weight row updates immediately when + / − is tapped, before the 600 ms debounce fires

## [Unreleased] 2026-06-10 (4)

### Added
- **CheckIn.jsx** — 4th notes step (`TextareaField`) added to check-in dialog; `DefinitionList` replaces the plain-Stack summary screen; notes shown truncated in table with view-full dialog (`Dialog`)
- **DataPage.jsx** — notes column and per-row view-notes `Dialog` added to the full data table
- **App.jsx / App.css** — bottom tab bar on xs (≤480px) replaces top header for mobile navigation; `TopHeader` and `SettingsMenu` overlay hidden on xs; `#root` gets 56px bottom padding to clear the nav bar
- **Step1AboutYou.jsx** — warning `Banner` shown when goal weight is higher than start weight
- **WelcomeResults.jsx** — BMI card `heroColor` and icon now reflect BMI category (success/warn/error); `MessageBadge` status likewise updated

### Changed
- **WeightStepper.jsx** — weight display replaced with editable `NumberField` + `boldInput` class; changes commit on blur, typed values are validated and clamped
- **Step1AboutYou.jsx** — start-date section updated to match Step4 horizontal layout (`justify="between"`, `variant="tertiary"` button)
- **Step3YourHabits.jsx** — selecting "None" deselects all other meds; selecting any med deselects "None"
- **Onboarding.jsx** — form defaults pre-populated: `startWeight: 180`, `goalWeight: 160`, `heightFeet: 5`, `heightInches: 7`
- **App.css** — removed unused side-nav CSS; TopHeader hide breakpoint corrected from 1024px to 480px (xs only)
- All stale instructional/TODO comments and commented-out code blocks removed across `CheckIn.jsx`, `WelcomeResults.jsx`, `Step1AboutYou.jsx`, `Step2YourBody.jsx`, `onboardingConfig.js`

## [Unreleased] 2026-06-10 (3)

### Changed
- Bumped `@gtivr4/a1-design-system-react` to `0.6.2` (pinned exact; 0.6.2 includes fresh theme fix)
- Applied "fresh" theme: `data-theme="fresh"` on `<html>` in `index.html` + `document.documentElement.setAttribute('data-theme', 'fresh')` in `main.jsx` as runtime guarantee; loaded Nunito + Libre Baskerville from Google Fonts

## [Unreleased] 2026-06-10 (2)

### Added
- `StepProgress` component (`src/components/StepProgress.jsx`): shared step progress bar + "Step X of Y" counter used across the onboarding + All Set flow

### Changed
- **Onboarding flow**: "All Set" screen is now step 5 of 5 inside `Onboarding.jsx` (rendered via `WelcomeResults`) so the Back button on that screen returns to step 4 without losing form state; `onComplete` is only called once the user confirms "Start My Journey!" on step 5
- **Onboarding step bar**: `StepProgress` shown at top of steps 1–4 (5 total including All Set)
- **Onboarding step 2**: inches field is now required; `missingInches` check added to `isStepValid` (allows 0 for e.g. 5′0″)
- **Onboarding step 4**: quick timeline presets auto-select the best pace when entering the step for the first time; each option now has a Material icon (`bolt`, `trending_down`, `calendar_month`, `self_improvement`)
- **Onboarding calendar fix**: goal-date `Calendar` now receives `initialMonth={goalDateObj}` so it opens to the preset's month, not today
- **WelcomeResults**: accepts `onBack`, `currentStep`, `totalSteps` props; `StepProgress` shown at top (step 5 of 5); Back + "Start My Journey!" share a `ButtonContainer`; stat cards now have icons (`restaurant`, `trending_down`, `bolt`, `flag`); target date abbreviated to 3-letter month
- **BmiRangeChart**: rewritten using stacked `BarChart` + `Bar` components — fixes invisible chart caused by recharts not establishing a coordinate system with `ReferenceArea`-only `ComposedChart`
- **App.jsx**: removed `showWelcome` state and separate `WelcomeResults` rendering; `handleOnboardingComplete` now just saves profile and goes straight to CheckIn

## [Unreleased] 2026-06-10

### Added
- `BmiRangeChart` component (`src/components/BmiRangeChart.jsx`): horizontal recharts gauge showing Underweight / Healthy / Overweight / Obese bands with a marker at the user's current BMI value
- `WelcomeResults`: BMI range chart added inside the "Your BMI" card beneath the number and badge
- `WelcomeResults`: "Days to Goal" stat card replaced with a "Target Date" card showing the goal date prominently and days-to-go as a secondary figure
- `Onboarding` step 4: quick timeline presets now show dynamic subtext computed from the user's weight-to-lose, activity level, and medication status, guiding toward a sustainable pace
- `labels.json`: added `onboarding.daysToGoLabel` ("days to go") with Spanish translation

## [Unreleased] 2026-06-09 (2)

### Changed
- `WeightStepper`: step reduced from 1 → 0.5; display now shows one decimal place (`toFixed(1)`); clamp rounds to nearest 0.1 to prevent floating-point drift

## [Unreleased] 2026-06-09

### Added
- **recharts** dependency (`^3.8.1`) — replaces hand-drawn SVG chart
- `ProgressChart.jsx` rewritten with recharts (`LineChart`, `ResponsiveContainer`, `ReferenceLine` for goal line, custom tooltip styled with design system CSS vars)
- `CHANGELOG.md` — this file
- `CLAUDE.md` and `AGENTS.md` — AI agent entry points pointing to `ai/GUIDANCE.md`
- `ai/GUIDANCE.md` — canonical project guidance for AI agents (stack, architecture decisions, file map, conventions, changelog instructions)

### Changed
- **Onboarding Step 1** — Goal Weight field added alongside Current Weight; both required to advance
- **Onboarding Step 1** — Start Date row added: defaults to "Today", optional Calendar picker (`variant="paginated"`, `maxDate=today`) toggles inline; button icon switches between `calendar_today` and `close` based on open state
- **Onboarding Step 2** — Biological Sex input changed from `RadioGroup` (inline) to `ChoiceGroup` (2 columns) for visual consistency
- **Onboarding Step 3** — "Other" medication text field appears when user selects "Other" in the medications ChoiceGroup (`form.otherMed`)
- **Onboarding Step 4** — Goal Weight field removed (moved to Step 1); step now only asks for timeline/target date
- **Onboarding validation** — Step 1 now requires both `startWeight` and `goalWeight`; Step 4 only requires `goalDate`
- `handleFinishAttempt` now uses `form.startDate` if set, falling back to today

## [0.1.0] — Earlier sessions

### Added
- Initial DownTrack SPA: React 19 + Vite 6 + `@gtivr4/a1-design-system-react` v0.6.0
- 4-step Onboarding flow (About You, Your Body, Your Habits, Your Goal) with validation-on-attempt pattern
- Imperial/Metric SegmentedControl with live unit conversion
- `CheckIn` view: WeightStepper (hold-to-repeat), auto-save (600ms debounce), live stats
- 4 stat cards + CircularProgress summary + ProgressChart + DataTable of recent check-ins
- `WelcomeResults`: BMI card, stat grid, feasibility Banner, medication Banner
- `SettingsMenu`: fixed-overlay settings icon → Menu → language RadioGroup + Reset All Data Dialog (`status="error"`)
- `useStore` localStorage-backed state with `addCheckin` upsert, `saveProfile`, `reset`, `setLocale`
- Dev toolbar with mock scenario switcher (`src/dev/mockScenarios.js`)
- `scripts/patch-design-system.sh` for patching unpublished DS features post-install
