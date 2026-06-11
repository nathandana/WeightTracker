export const TOTAL_STEPS = 4;
export const PROGRESS_TOTAL = 5;
export const STEP_TITLES = ['About You', 'Your Body', 'Your Habits', 'Your Goal'];
export const CONTINUE_LABELS = ['Next: Your Body', 'Next: Your Habits', 'Next: Your Goal', 'Start My Journey!'];

export const TIMELINE_PRESETS = [
  { value: '3mo',  label: '3 months',  months: 3,  icon: 'bolt' },
  { value: '6mo',  label: '6 months',  months: 6,  icon: 'trending_down' },
  { value: '1yr',  label: '1 year',    months: 12, icon: 'calendar_month' },
  { value: '18mo', label: '18 months', months: 18, icon: 'self_improvement' },
];

export const CALORIE_OPTIONS = [
  { value: '1200', label: '< 1,500 cal' },
  { value: '1750', label: '1,500 – 2,000 cal' },
  { value: '2250', label: '2,000 – 2,500 cal' },
  { value: '2750', label: '2,500+ cal' },
];

export const ACTIVITY_OPTIONS = (l) => [
  { value: 'sedentary', label: l('onboarding.activitySedentary'), subtext: l('onboarding.activitySedentarySub') },
  { value: 'light',     label: l('onboarding.activityLight'),     subtext: l('onboarding.activityLightSub') },
  { value: 'moderate',  label: l('onboarding.activityModerate'),  subtext: l('onboarding.activityModerateSub') },
  { value: 'active',    label: l('onboarding.activityActive'),    subtext: l('onboarding.activityActiveSub') },
];

export const MED_OPTIONS = (l) => [
  { value: 'none',       label: 'None' },
  { value: 'semaglutide', label: 'Semaglutide', subtext: 'Ozempic / Wegovy' },
  { value: 'tirzepatide', label: 'Tirzepatide', subtext: 'Mounjaro / Zepbound' },
  { value: 'other',       label: l('onboarding.medOther', 'Other') },
];

export function presetDate(months) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

export function missing(val) {
  return !val || Number(val) <= 0;
}

export function missingInches(val) {
  return val === '' || val === null || val === undefined;
}

export function formatDate(iso) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso)
    ? new Date(iso + 'T12:00:00')
    : new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function getTimelineSubtext(months, weightToLose, activityLevel, weightUnit, hasMeds) {
  const lossLbs = weightUnit === 'kg' ? weightToLose * 2.20462 : weightToLose;
  if (lossLbs <= 0) return null;
  const weeks = months * 4.33;
  const neededPerWeek = lossLbs / weeks;
  const basePotential = { sedentary: 0.75, light: 1.0, moderate: 1.25, active: 1.5 };
  const maxWeekly = (basePotential[activityLevel] ?? 1.0) * (hasMeds ? 1.3 : 1.0);
  if (neededPerWeek < 0.3)               return 'Very relaxed — ideal for long-term habits';
  if (neededPerWeek <= maxWeekly * 0.75) return 'Comfortable, sustainable pace';
  if (neededPerWeek <= maxWeekly)        return 'A great pace for your activity level';
  if (neededPerWeek <= maxWeekly * 1.4)  return 'Ambitious but achievable with consistency';
  return 'Very aggressive — consider a longer timeline';
}

export function computeSuggestedPreset(form) {
  const weightToLose = Number(form.startWeight) - Number(form.goalWeight);
  const hasMeds = (form.meds?.length ?? 0) > 0;
  const lossLbs = form.weightUnit === 'kg' ? weightToLose * 2.20462 : weightToLose;
  if (lossLbs <= 0) return TIMELINE_PRESETS[0];
  const basePotential = { sedentary: 0.75, light: 1.0, moderate: 1.25, active: 1.5 };
  const maxWeekly = (basePotential[form.activityLevel] ?? 1.0) * (hasMeds ? 1.3 : 1.0);
  for (const preset of TIMELINE_PRESETS) {
    const needed = lossLbs / (preset.months * 4.33);
    if (needed <= maxWeekly) return preset;
  }
  return TIMELINE_PRESETS[TIMELINE_PRESETS.length - 1];
}
