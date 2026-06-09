// Helper: generate check-in history relative to today
function makeCheckins(startWeight, dailyChange, days, withSurvey = false) {
  const moods = ['great', 'good', 'good', 'okay', 'low'];
  const activities = ['high', 'medium', 'medium', 'low', 'none'];
  const calories = ['under', 'on_track', 'on_track', 'on_track', 'over', 'way_over'];

  const checkins = [];
  // Use a seeded-ish noise so it looks realistic but doesn't change on every render
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));
    date.setHours(8, 0, 0, 0);
    const noise = Math.sin(i * 7.3) * 0.8; // deterministic noise
    const weight = Math.round((startWeight + dailyChange * i + noise) * 10) / 10;
    const entry = { date: date.toISOString(), weight };
    if (withSurvey && i % 3 !== 0) { // ~67% have survey data
      entry.mood     = moods[i % moods.length];
      entry.activity = activities[i % activities.length];
      entry.calories = calories[i % calories.length];
    }
    checkins.push(entry);
  }
  return checkins;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function monthsFromNow(n) {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toISOString();
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

export const MOCK_SCENARIOS = [
  {
    id: 'real',
    label: '↩ My Profile',
  },
  {
    id: 'new_start',
    label: 'New Start (Day 1)',
    state: {
      locale: 'en',
      profile: {
        name: 'Jordan',
        startWeight: 220,
        weightUnit: 'lbs',
        heightUnit: 'imperial',
        heightFeet: 5, heightInches: 10,
        age: 31,
        sex: 'male',
        activityLevel: 'sedentary',
        goalWeight: 180,
        goalDate: monthsFromNow(6),
        meds: ['semaglutide'],
        startDate: daysAgo(1),
      },
      checkins: [],
    },
  },
  {
    id: 'week_2',
    label: 'Week 2 – Early Streak',
    state: {
      locale: 'en',
      profile: {
        name: 'Casey',
        startWeight: 195,
        weightUnit: 'lbs',
        heightUnit: 'imperial',
        heightFeet: 5, heightInches: 6,
        age: 28,
        sex: 'female',
        activityLevel: 'light',
        goalWeight: 155,
        goalDate: monthsFromNow(5),
        meds: [],
        startDate: daysAgo(14),
      },
      checkins: makeCheckins(195, -0.18, 10, true),
    },
  },
  {
    id: 'on_track',
    label: 'On Track – Good Progress',
    state: {
      locale: 'en',
      profile: {
        name: 'Morgan',
        startWeight: 240,
        weightUnit: 'lbs',
        heightUnit: 'imperial',
        heightFeet: 6, heightInches: 1,
        age: 42,
        sex: 'male',
        activityLevel: 'moderate',
        goalWeight: 195,
        goalDate: monthsFromNow(4),
        meds: ['tirzepatide'],
        startDate: daysAgo(60),
      },
      checkins: makeCheckins(240, -0.22, 55, true),
    },
  },
  {
    id: 'plateau',
    label: 'Plateau – Weight Stalled',
    state: {
      locale: 'en',
      profile: {
        name: 'Riley',
        startWeight: 210,
        weightUnit: 'lbs',
        heightUnit: 'imperial',
        heightFeet: 5, heightInches: 8,
        age: 37,
        sex: 'female',
        activityLevel: 'moderate',
        goalWeight: 160,
        goalDate: monthsFromNow(3),
        meds: ['semaglutide'],
        startDate: daysAgo(45),
      },
      // Lost well for 30 days, then stalled for 15
      checkins: [
        ...makeCheckins(210, -0.22, 30, true),
        ...makeCheckins(203.5, -0.01, 15, true).map(c => {
          const d = new Date(c.date);
          d.setDate(d.getDate() + 30);
          return { ...c, date: d.toISOString() };
        }),
      ],
    },
  },
  {
    id: 'near_goal',
    label: 'Near Goal – Almost There',
    state: {
      locale: 'en',
      profile: {
        name: 'Sam',
        startWeight: 185,
        weightUnit: 'lbs',
        heightUnit: 'imperial',
        heightFeet: 5, heightInches: 5,
        age: 45,
        sex: 'female',
        activityLevel: 'active',
        goalWeight: 145,
        goalDate: monthsFromNow(1),
        meds: [],
        startDate: daysAgo(120),
      },
      checkins: makeCheckins(185, -0.29, 110, true),
    },
  },
  {
    id: 'metric',
    label: 'Metric User (kg)',
    state: {
      locale: 'en',
      profile: {
        name: 'Alex',
        startWeight: 105,
        weightUnit: 'kg',
        heightUnit: 'cm',
        height: 178,
        age: 33,
        sex: 'male',
        activityLevel: 'moderate',
        goalWeight: 82,
        goalDate: monthsFromNow(5),
        meds: ['tirzepatide'],
        startDate: daysAgo(45),
      },
      checkins: makeCheckins(105, -0.11, 40, true),
    },
  },
  {
    id: 'long_journey',
    label: 'Long Journey – 6 Months',
    state: {
      locale: 'en',
      profile: {
        name: 'Drew',
        startWeight: 280,
        weightUnit: 'lbs',
        heightUnit: 'imperial',
        heightFeet: 5, heightInches: 11,
        age: 52,
        sex: 'male',
        activityLevel: 'light',
        goalWeight: 200,
        goalDate: monthsFromNow(2),
        meds: ['semaglutide'],
        startDate: daysAgo(180),
      },
      checkins: makeCheckins(280, -0.27, 170, true),
    },
  },
];
