export const SPACING_KEYS = [0, 1, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 64, 96, 128];

export function resolveSpacing(value) {
  if (value == null) return undefined;
  if (value === "none") return "0";

  const n = Number(value);
  return SPACING_KEYS.includes(n) ? `var(--base-spacing-${n})` : undefined;
}
