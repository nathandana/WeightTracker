# Journey Check-In

A personal weight tracking app for monitoring progress on a GLP-1 medication journey. Log daily weight, complete optional mood/activity check-ins, and visualize progress toward a goal weight.

## Features

- **Daily check-in** — log weight with a stepper, get personalized encouragement based on streak and progress
- **Optional survey** — track mood, activity level, and calorie adherence per day
- **Progress page** — weight chart, streak counter, goal ring, and check-in history with survey data
- **Profile page** — calculated BMI, TDEE, weekly loss estimate, and goal date
- **i18n** — English and Spanish support via label tokens
- **Offline-first** — all data stored in `localStorage`, no account required

## Tech Stack

- **React 19** + **Vite 6**
- **[@gtivr4/a1-design-system-react](https://github.com/gtivr4/a1-design-system)** — component library
- **PostCSS** with `postcss-custom-media` for design token expansion

## Getting Started

```bash
npm install
npm run dev
```

> **Note:** The design system package has a local patch applied on `postinstall` (see `scripts/patch-design-system.sh`). This copies a few files that were accidentally omitted from the published package and expands `@custom-media` queries in CSS that browsers don't support natively. The script expects the design system source to be at `~/Sites/A1DesignSystem/packages/react/src` — update the `LOCAL` path in the script if your setup differs.

## Project Structure

```
src/
├── views/
│   ├── CheckIn.jsx       # Daily weight + survey flow
│   ├── Progress.jsx      # Charts, stats, check-in history
│   ├── Profile.jsx       # User info, goal plan, reset
│   ├── Onboarding.jsx    # First-run profile setup
│   └── WelcomeResults.jsx
├── components/
│   ├── ProgressChart.jsx # SVG weight chart
│   └── WeightStepper.jsx # +/- weight input
├── store/
│   └── useStore.js       # localStorage-backed state
├── utils/
│   ├── calculations.js   # BMR, TDEE, BMI, goal plan
│   └── encouragement.js  # Streak/progress messages
├── dev/
│   └── mockScenarios.js  # Test data for development
└── labels/
    └── labels.json       # i18n label tokens
```

## Dev Tools

A scenario selector bar appears at the top of the app for quick testing. Switching scenarios loads mock data into memory without touching `localStorage` — your real data is always preserved and restored by selecting **↩ My Profile**.

| Scenario | What it tests |
|---|---|
| ↩ My Profile | Your real saved data |
| New Start (Day 1) | Empty state, no check-ins |
| Week 2 – Early Streak | 14 days in, modest progress |
| On Track – Good Progress | 60 days, consistent loss, survey history |
| Plateau – Weight Stalled | Was losing, then flat for 2 weeks |
| Near Goal – Almost There | 85%+ complete |
| Metric User (kg) | All-metric profile |
| Long Journey – 6 Months | 170 check-ins, full survey data |

## Data Model

All state is persisted to `localStorage` under the key `journey-checkin-v1`.

**Profile fields:** `name`, `startWeight`, `weightUnit`, `height`/`heightFeet`/`heightInches`, `heightUnit`, `age`, `sex`, `activityLevel`, `goalWeight`, `goalDate`, `meds`, `startDate`

**Check-in fields:** `date` (ISO), `weight`, `mood?`, `activity?`, `calories?`
