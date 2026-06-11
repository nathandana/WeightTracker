# Axe Accessibility Scan — DownTrack

Automated a11y scanning using [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright) against a running dev server.

---

## Running the Scans

```sh
# Run all a11y tests (requires dev server or starts one automatically)
npm run test:a11y

# Run and open HTML report in browser
npm run test:a11y:report

# Run a single describe block
npx playwright test tests/a11y.spec.js --grep "SettingsPage"

# Run in headed mode to watch the browser
npx playwright test tests/a11y.spec.js --headed
```

Tests start the Vite dev server automatically (`localhost:5173`) if it isn't already running.

---

## Test Coverage

| Test | Route | State |
|---|---|---|
| Onboarding step 1 | `/checkin` | No profile (fresh) |
| CheckIn — default | `/checkin` | Profile + 55 checkins |
| CheckIn — check-in dialog open | `/checkin` | Profile + 55 checkins |
| CheckIn — new user (empty) | `/checkin` | Profile, no checkins |
| DataPage — data tab | `/data` | Profile + 55 checkins |
| DataPage — charts tab | `/data?tab=charts` | Profile + 55 checkins |
| DataPage — empty state | `/data` | Profile, no checkins |
| SettingsPage | `/settings` | Profile + 55 checkins |
| SettingsPage — edit dialog open | `/settings` | Profile + 55 checkins |
| Full report (all pages) | all above | all above |

---

## Severity Levels

| Impact | Behaviour |
|---|---|
| **critical** | Test fails — must fix before push |
| **serious** | Test fails — must fix before push |
| **moderate** | Logged to console — WARN, should fix |
| **minor** | Logged to console — WARN, fix when convenient |

The "Full axe report" describe block always runs all pages and logs a structured summary to the console regardless of pass/fail, so you get counts even on a green run.

---

## How State Is Injected

Tests use `page.addInitScript` to seed `localStorage` before the page loads, so React picks up the profile and checkins on first render. No mock server needed.

The `STORAGE_KEY` is `journey-checkin-v1` (matches `src/store/useStore.js`).

---

## Axe Rule Tags Used

Tests run against: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `best-practice`.

This covers:
- WCAG 2.0 Level A and AA
- WCAG 2.1 Level A and AA additions
- Deque best-practice rules (beyond the standard, but useful catches)

---

## Adding New Tests

When adding a new page or significant interactive state, add a corresponding test block to `tests/a11y.spec.js`:

```js
test.describe('MyNewPage', () => {
  test.beforeEach(async ({ page }) => {
    await seedState(page, STATE_WITH_DATA);
  });

  test('default view has no critical/serious violations', async ({ page }) => {
    await page.goto('/my-new-route');
    await page.waitForLoadState('networkidle');

    const results = await runAxe(page);
    const blocking = results.violations.filter(v => ['critical', 'serious'].includes(v.impact));
    expect(blocking, formatViolations(blocking)).toHaveLength(0);
  });
});
```

Also add a row to the "Full axe report" `pages` array so it appears in the full summary.

---

## Known Issues (excluded from blocking)

| Rule | Impact | Source | Notes |
|---|---|---|---|
| `color-contrast` | serious | Design system badge/status components | DS uses amber/orange status backgrounds with white text that fail 4.5:1 ratio. Excluded via `disableRules`. Report to DS maintainers. |

## Moderate Violations (non-blocking, logged only)

These appear consistently on all pages and come from the design system's structural patterns:

| Rule | Cause |
|---|---|
| `landmark-banner-is-top-level` | DS `TopHeader` renders a `<header>` inside `PageLayout` which is itself inside a `<div>` — DS structural issue |
| `landmark-no-duplicate-banner` | Same root cause as above |
| `landmark-unique` | Multiple `<section>` elements with no distinguishing label |
| `region` | Some content outside landmark regions — DS layout gaps |
| `heading-order` | Some pages have heading level jumps inside DS Card components |
| `landmark-one-main` | Onboarding lacks a `<main>` — DS issue in Onboarding layout |

These should be fixed in the design system. Until then they are logged to console on each run.

## HTML Report

After running `npm run test:a11y:report`, Playwright opens an HTML report at `playwright-report/index.html`. Each failed assertion includes the axe violation details, affected DOM nodes, and a link to the Deque rule documentation.
