# Changelog

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
