# Pre-Push Checklist — DownTrack

Run this checklist before pushing any branch. Items marked **ALWAYS** must be resolved before pushing. Items marked **WARN** should be noted and either fixed or documented as a known issue.

---

## ALWAYS — Must Pass

### 1. Heading Order
- Every page has exactly **one `<h1>`** (rendered via `<Heading as="h1">` or `type="display"` as the first heading in a `<Section>`).
- Headings do not skip levels (e.g. h1 → h3 with no h2 in between).
- Pages: `CheckIn`, `DataPage`, `SettingsPage`, `Onboarding` steps, `WelcomeResults`.
- Check that card/section sub-headings use `h2`–`h4` in logical order beneath the page h1.

### 2. Landmark Regions
- Page content is wrapped in a `<Section>` (renders `<section>`) or appropriate DS layout component — not bare `<div>`.
- Navigation is in a `<nav>` with `aria-label` (the bottom nav in `App.jsx` already has `aria-label="Main navigation"`).
- Each dialog has a visible title (passed via the `title` prop on `<Dialog>`).
- No landmark nesting violations (e.g. `<nav>` inside `<nav>`, `<main>` inside `<main>`).

### 3. Labels & i18n — No Hardcoded User-Facing Strings
- **All** user-visible strings must use `useLabel` / `l('key', 'fallback')` or come from the DS component's own label system.
- Run a quick grep before pushing:
  ```
  grep -rn '"[A-Z][a-z]' src/views/ src/components/ | grep -v '\.test\.' | grep -v '//'
  ```
  Any plain English string in JSX that a user will read is a candidate for the label system.
- Spanish translations (`locale.es`) must exist for every new label key added to `src/labels/labels.json`.
- Exceptions: dev-only UI (the dev scenario bar), placeholder/hint text that is intentionally English-only for now — document these with a `// i18n-todo` comment.

### 4. Dark Mode
- Open the app in a browser with OS dark mode enabled (or use DevTools → Rendering → "Emulate CSS prefers-color-scheme: dark").
- Check each page:
  - No white/light backgrounds bleeding through on dark surfaces.
  - Text is legible (no near-white text on white background).
  - Charts use CSS variable colors (e.g. `var(--semantic-color-action-background)`) not hardcoded hex.
  - Any inline `style` with color values uses semantic tokens.
- The dark mode override block in `src/App.css` (`@media (prefers-color-scheme: dark) { html.a1-theme-fresh { ... } }`) covers all tokens used. If you add a new hardcoded color, add the corresponding dark override.

### 5. Axe Accessibility Scan
- Run the automated axe scan against all routes:
  ```
  npm run test:a11y
  ```
- **Zero critical or serious violations** before pushing.
- Moderate/minor violations are logged to console — fix when possible, otherwise note as known issues.
- For the full HTML report: `npm run test:a11y:report`
- See [`ai/AXE_SCAN.md`](AXE_SCAN.md) for full details on coverage, severity levels, and adding new tests.

---

## WARN — Review and Document

### 6. Button Labels in Context
- Every `<Button>` or `<IconButton>` must make sense when read in isolation (screen reader announces only the button label, not the surrounding text).
- Common failure: icon-only buttons without `aria-label`. The DS `<IconButton>` should always receive an `aria-label`.
- Check: back buttons say "Back" not just contain an arrow icon; "Edit" buttons near a heading should include context (e.g. `aria-label="Edit profile"` not just `"Edit"`).
- Generate a list of all icon-only or short-label buttons and verify each one.

### 7. Horizontal Scrolling at 320px
- Set DevTools viewport to **320px wide** and scroll each page horizontally.
- Any page that triggers a horizontal scrollbar is a failure worth flagging.
- Common causes: fixed-width containers, `min-width` on `<Stack direction="row">` children, wide DataTable columns.
- Note instances found; minor overflows are WARN not blocking.

### 8. Custom Local Styling
- Run:
  ```
  grep -rn 'style={{' src/views/ src/components/ | wc -l
  ```
  and
  ```
  grep -rn 'style={{' src/views/ src/components/
  ```
- Report the count and list each instance. For each one, note whether:
  - It can be replaced by a DS prop (e.g. `gap`, `align`, `justify` on `<Stack>`).
  - It's a layout shim with no DS equivalent (acceptable, note it).
  - It's a color/typography override — these are **strongly discouraged** and should be proposed as DS component additions.
- Also scan `src/App.css` for any class-based overrides beyond the existing `boldInput` and dark-mode block.

---

## Quick Reference — How to Run Checks

| Check | Command / Method |
|---|---|
| Hardcoded strings | `grep -rn '"[A-Z]' src/views/ src/components/` |
| Inline styles count | `grep -rn 'style={{' src/views/ src/components/ \| wc -l` |
| Inline styles list | `grep -rn 'style={{' src/views/ src/components/` |
| Dark mode | DevTools → Rendering → prefers-color-scheme: dark |
| 320px viewport | DevTools → Responsive → set width to 320 |
| Axe scan | `npm run test:a11y` |

---

## After the Checklist

- Update `CHANGELOG.md` with any fixes made during this checklist pass.
- If WARN items are not fixed, add a comment in the relevant file: `// pre-push-warn: <short description>`.
