export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

export function lbsToKg(lbs) { return lbs * 0.453592; }
export function kgToLbs(kg) { return kg * 2.20462; }
export function feetInchesToCm(feet, inches) { return (Number(feet) * 12 + Number(inches)) * 2.54; }
export function cmToFeetInches(cm) {
  const totalInches = cm / 2.54;
  return { feet: Math.floor(totalInches / 12), inches: Math.round(totalInches % 12) };
}

export function toKg(value, unit) {
  return unit === 'kg' ? Number(value) : lbsToKg(Number(value));
}

export function fromKg(kg, unit) {
  return unit === 'kg' ? kg : kgToLbs(kg);
}

// BMI: weight in kg, height in meters
export function calculateBMI(weightKg, heightM) {
  if (!weightKg || !heightM) return null;
  const value = weightKg / (heightM * heightM);
  let category;
  if (value < 18.5) category = 'underweight';
  else if (value < 25) category = 'normal';
  else if (value < 30) category = 'overweight';
  else category = 'obese';
  return { value: Math.round(value * 10) / 10, category };
}

// Mifflin-St Jeor BMR
export function calculateBMR(weightKg, heightCm, age, sex) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calculateTDEE(bmr, activityLevel) {
  return Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.2));
}

export function calculateGoalPlan(profile) {
  const {
    startWeight, weightUnit,
    goalWeight,
    goalDate,
    heightUnit, height, heightFeet, heightInches,
    age, sex, activityLevel,
  } = profile;

  const weightKg = toKg(startWeight, weightUnit);
  const goalKg = toKg(goalWeight, weightUnit);

  const heightCm = heightUnit === 'cm'
    ? Number(height)
    : feetInchesToCm(heightFeet, heightInches);

  const bmr = calculateBMR(weightKg, heightCm, Number(age), sex);
  const tdee = calculateTDEE(bmr, activityLevel);
  const bmi = calculateBMI(weightKg, heightCm / 100);

  const weightDiffKg = weightKg - goalKg; // positive = losing
  const totalCalorieDeficit = weightDiffKg * 7700; // ~7700 kcal per kg of fat

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(goalDate);
  target.setHours(0, 0, 0, 0);
  const daysRemaining = Math.max(1, Math.ceil((target - today) / 86400000));

  const dailyDeficit = totalCalorieDeficit / daysRemaining;
  const targetDailyCalories = Math.max(1200, Math.round(tdee - dailyDeficit));
  const actualDeficit = tdee - targetDailyCalories;

  // Weekly loss in the display unit
  const weeklyLossKg = (actualDeficit * 7) / 7700;
  const weeklyLoss = weightUnit === 'kg'
    ? Math.round(weeklyLossKg * 10) / 10
    : Math.round(kgToLbs(weeklyLossKg) * 10) / 10;

  return {
    bmr: Math.round(bmr),
    tdee,
    bmi,
    dailyDeficit: Math.round(actualDeficit),
    targetDailyCalories,
    weeklyLoss,
    daysRemaining,
    isFeasible: actualDeficit <= 1000,
  };
}

export function getProgressStats(profile, checkins) {
  if (!profile) return null;

  const { startWeight, goalWeight, weightUnit } = profile;
  const start = Number(startWeight);
  const goal = Number(goalWeight);

  const sorted = [...checkins].sort((a, b) => new Date(a.date) - new Date(b.date));
  const current = sorted.length > 0 ? sorted[sorted.length - 1].weight : start;

  const totalToLose = start - goal;
  const lost = start - current;
  const toGo = current - goal;
  const percent = totalToLose <= 0 ? 100 : Math.max(0, Math.min(100, Math.round((lost / totalToLose) * 100)));

  const startDate = new Date(profile.startDate ?? profile.createdAt ?? Date.now());
  startDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysIn = Math.max(1, Math.round((today - startDate) / 86400000) + 1);

  // Streak: consecutive days with check-ins ending today
  let streak = 0;
  const checkinDays = new Set(checkins.map(c => new Date(c.date).toDateString()));
  const d = new Date();
  while (checkinDays.has(d.toDateString())) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  return {
    current: Math.round(current * 10) / 10,
    start: Math.round(start * 10) / 10,
    goal: Math.round(goal * 10) / 10,
    lost: Math.round(lost * 10) / 10,
    toGo: Math.round(Math.max(0, toGo) * 10) / 10,
    percent,
    daysIn,
    streak,
    unit: weightUnit,
    weightHistory: sorted.map(c => ({ date: c.date, weight: c.weight })),
  };
}
