# Changelog

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
