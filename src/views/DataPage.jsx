import { useState, useMemo } from 'react';
import {
  Section, Heading, Stack, DataTable, Banner,
  Tabs, TabList, Tab, TabPanel, Paragraph,
  MessageEmptyState,
} from '@gtivr4/a1-design-system-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceArea,
  Legend,
} from 'recharts';
import { calculateBMI, toKg, feetInchesToCm } from '../utils/calculations.js';
import { ProgressChart } from '../components/ProgressChart.jsx';

// ─── milestone notices ────────────────────────────────────────────────────────

const BMI_RANK = { obese: 3, overweight: 2, normal: 1, underweight: 0 };

function computeNotices(checkins, profile) {
  if (!profile || checkins.length < 2) return [];

  const { startWeight, goalWeight, weightUnit, heightUnit, height, heightFeet, heightInches } = profile;
  const startKg = toKg(startWeight, weightUnit);
  const goalKg = toKg(goalWeight, weightUnit);
  const totalToLoseKg = startKg - goalKg;

  const heightCm = heightUnit === 'cm' ? Number(height) : feetInchesToCm(heightFeet, heightInches);
  const heightM = heightCm / 100;

  const reversed = [...checkins].reverse();
  const dayToRowIdx = new Map();
  reversed.forEach((c, i) => {
    const dayKey = new Date(c.date).toDateString();
    if (!dayToRowIdx.has(dayKey)) dayToRowIdx.set(dayKey, i);
  });

  const byDay = new Map();
  for (const c of [...checkins].sort((a, b) => new Date(a.date) - new Date(b.date))) {
    byDay.set(new Date(c.date).toDateString(), c);
  }
  const days = [...byDay.values()].sort((a, b) => new Date(a.date) - new Date(b.date));
  const dayKeySet = new Set(days.map(c => new Date(c.date).toDateString()));

  const notices = [];
  const streakHit = new Set();
  const progressHit = new Set();
  let prevBmiCategory = null;

  for (const c of days) {
    const dayKey = new Date(c.date).toDateString();
    const rowIdx = dayToRowIdx.get(dayKey);
    if (rowIdx === undefined) continue;

    const weightKg = toKg(c.weight, weightUnit);

    if (heightM > 0) {
      const bmi = calculateBMI(weightKg, heightM);
      if (bmi && prevBmiCategory && bmi.category !== prevBmiCategory) {
        if (BMI_RANK[bmi.category] < BMI_RANK[prevBmiCategory] && bmi.category !== 'underweight') {
          const msg = bmi.category === 'normal'
            ? `BMI ${bmi.value} — you've reached a healthy BMI range! Incredible achievement.`
            : `BMI ${bmi.value} — out of the ${prevBmiCategory} range. Keep going!`;
          notices.push({
            content: <Banner variant="sytem" status="success" title="BMI Milestone" icon="monitor_heart">{msg}</Banner>,
            afterRow: rowIdx,
          });
        }
      }
      if (bmi) prevBmiCategory = bmi.category;
    }

    let streak = 1;
    const d = new Date(c.date);
    d.setDate(d.getDate() - 1);
    while (dayKeySet.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }

    for (const [threshold, title, msg] of [
      [3,  '3-day streak!',   "3 days in a row — you're building a habit!"],
      [7,  '7-day streak!',   "A full week of check-ins. Keep the momentum!"],
      [14, '14-day streak!',  "Two weeks strong. This is becoming a lifestyle."],
      [30, '1-month streak!', "One month of daily check-ins. Remarkable dedication!"],
    ]) {
      if (streak >= threshold && !streakHit.has(threshold)) {
        streakHit.add(threshold);
        notices.push({
          content: <Banner variant="sytem"  status="info" title={title} icon="local_fire_department">{msg}</Banner>,
          afterRow: rowIdx,
        });
      }
    }

    if (totalToLoseKg > 0) {
      const pct = ((startKg - weightKg) / totalToLoseKg) * 100;
      for (const [threshold, msg] of [
        [25, "One quarter of the way to your goal. Great start!"],
        [50, "Halfway there! You've crossed the midpoint."],
        [75, "75% complete — the finish line is in sight!"],
      ]) {
        if (pct >= threshold && !progressHit.has(threshold)) {
          progressHit.add(threshold);
          notices.push({
            content: <Banner variant="sytem"  status="success" title={`${threshold}% of your goal!`} icon="flag">{msg}</Banner>,
            afterRow: rowIdx,
          });
        }
      }
    }
  }

  return notices.sort((a, b) => a.afterRow - b.afterRow);
}

// ─── chart helpers ────────────────────────────────────────────────────────────

function fmtDate(iso) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const TOOLTIP_STYLE = {
  background: 'var(--semantic-color-surface-raised)',
  border: '1px solid var(--semantic-color-border-subtle)',
  borderRadius: 'var(--base-border-radius-md)',
  padding: '8px 12px',
  fontSize: 13,
  color: 'var(--semantic-color-text-default)',
  boxShadow: 'var(--base-shadow-md)',
};

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE}>
      <div style={{ color: 'var(--semantic-color-text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          <strong>{formatter ? formatter(p.name, p.value) : `${p.name}: ${p.value}`}</strong>
        </div>
      ))}
    </div>
  );
}

// ─── BMI trend chart ──────────────────────────────────────────────────────────

function BmiTrendChart({ checkins, profile }) {
  const heightCm = profile.heightUnit === 'cm'
    ? Number(profile.height)
    : feetInchesToCm(profile.heightFeet, profile.heightInches);
  const heightM = heightCm / 100;

  const points = useMemo(() => {
    if (!heightM) return [];
    return [...checkins]
      .filter(c => c.weight)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(c => {
        const bmi = calculateBMI(toKg(c.weight, profile.weightUnit), heightM);
        return { date: fmtDate(c.date), bmi: bmi?.value ?? null };
      })
      .filter(p => p.bmi !== null);
  }, [checkins, profile, heightM]);

  if (points.length < 2) {
    return <MessageEmptyState icon="info" scale="section" title="Log at least 2 days to see BMI trend." />;
  }

  const vals = points.map(p => p.bmi);
  const lo = Math.min(Math.floor(Math.min(...vals) - 1), 15);
  const hi = Math.max(Math.ceil(Math.max(...vals) + 1), 35);

  return (
    <>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <ReferenceArea y1={lo}   y2={18.5} fill="#64b5f6" fillOpacity={0.12} />
          <ReferenceArea y1={18.5} y2={25}   fill="#66bb6a" fillOpacity={0.12} />
          <ReferenceArea y1={25}   y2={30}   fill="#ffa726" fillOpacity={0.12} />
          <ReferenceArea y1={30}   y2={hi}   fill="#ef5350" fillOpacity={0.12} />
          <CartesianGrid strokeDasharray="4 4" stroke="var(--semantic-color-border-default)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: 'var(--semantic-color-text-muted)', fontSize: 12 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis domain={[lo, hi]} tick={{ fill: 'var(--semantic-color-text-muted)', fontSize: 12 }} tickLine={false} axisLine={false} width={40} />
          <Tooltip content={<ChartTooltip formatter={(name, val) => `BMI ${val}`} />} />
          <ReferenceLine y={18.5} stroke="#64b5f6" strokeDasharray="4 2" strokeWidth={1} label={{ value: 'Underweight', position: 'insideTopLeft', fontSize: 10, fill: '#64b5f6' }} />
          <ReferenceLine y={25}   stroke="#66bb6a" strokeDasharray="4 2" strokeWidth={1} label={{ value: 'Overweight',  position: 'insideTopLeft', fontSize: 10, fill: '#66bb6a' }} />
          <ReferenceLine y={30}   stroke="#ef5350" strokeDasharray="4 2" strokeWidth={1} label={{ value: 'Obese',       position: 'insideTopLeft', fontSize: 10, fill: '#ef5350' }} />
          <Line type="monotone" dataKey="bmi" name="BMI" stroke="var(--semantic-color-action-background)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--semantic-color-action-background)', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
        </LineChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', paddingTop: 4 }}>
        {[['#64b5f6','Underweight'],['#66bb6a','Healthy'],['#ffa726','Overweight'],['#ef5350','Obese']].map(([color, label]) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--semantic-color-text-muted)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color, opacity: 0.7, flexShrink: 0 }} />
            {label}
          </span>
        ))}
      </div>
    </>
  );
}

// ─── habits chart ─────────────────────────────────────────────────────────────

const MOOD_SCORE    = { great: 4, good: 3, okay: 2, low: 1 };
const ACTIVITY_SCORE = { high: 4, medium: 3, low: 2, none: 1 };
const CALORIE_SCORE  = { under: 4, on_track: 3, over: 2, way_over: 1 };

function HabitsChart({ checkins }) {
  const points = useMemo(() =>
    [...checkins]
      .filter(c => c.mood || c.activity || c.calories)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(c => ({
        date:     fmtDate(c.date),
        mood:     c.mood     ? MOOD_SCORE[c.mood]       : null,
        activity: c.activity ? ACTIVITY_SCORE[c.activity] : null,
        calories: c.calories ? CALORIE_SCORE[c.calories]  : null,
      })),
  [checkins]);

  if (points.length < 2) {
    return <MessageEmptyState icon="info" scale="section" title="Log mood, activity, and calories to see habit trends." />;
  }

  const labelMap = {
    mood:     (v) => ({ 4: 'Amazing', 3: 'Good', 2: 'Okay', 1: 'Tough Day' }[v] ?? v),
    activity: (v) => ({ 4: 'Intense', 3: 'Moderate', 2: 'Light', 1: 'Rest Day' }[v] ?? v),
    calories: (v) => ({ 4: 'Under goal', 3: 'On track', 2: 'Slightly over', 1: 'Way over' }[v] ?? v),
  };

  function formatter(name, val) {
    return `${name.charAt(0).toUpperCase() + name.slice(1)}: ${labelMap[name]?.(val) ?? val}`;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--semantic-color-border-default)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: 'var(--semantic-color-text-muted)', fontSize: 12 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis domain={[0.5, 4.5]} ticks={[1,2,3,4]} tick={{ fill: 'var(--semantic-color-text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} width={20} tickFormatter={() => ''} />
        <Tooltip content={<ChartTooltip formatter={formatter} />} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Line type="monotone" dataKey="mood"     name="Mood"     stroke="#9c6de0" strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} connectNulls activeDot={{ r: 5, strokeWidth: 0 }} />
        <Line type="monotone" dataKey="activity" name="Activity" stroke="#29b6f6" strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} connectNulls activeDot={{ r: 5, strokeWidth: 0 }} />
        <Line type="monotone" dataKey="calories" name="Calories" stroke="#66bb6a" strokeWidth={2} dot={{ r: 3, strokeWidth: 0 }} connectNulls activeDot={{ r: 5, strokeWidth: 0 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export function DataPage({ store }) {
  const { checkins, profile } = store;
  const unit = profile?.weightUnit ?? 'lbs';
  const [tab, setTab] = useState('data');

  const notices = useMemo(() => computeNotices(checkins, profile), [checkins, profile]);

  const weightHistory = useMemo(() =>
    [...checkins]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(c => ({ date: c.date, weight: c.weight })),
  [checkins]);

  const rows = useMemo(() =>
    [...checkins].reverse().map((c, i) => ({
      id: i,
      _rawDate: c.date,
      date:     new Date(c.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      weight:   c.weight,
      mood:     c.mood     ? { great: '😊 Amazing', good: '🙂 Good', okay: '😐 Okay', low: '😞 Tough Day' }[c.mood] : null,
      activity: c.activity ? { high: 'Intense', medium: 'Moderate', low: 'Light', none: 'Rest Day' }[c.activity] : null,
      calories: c.calories ? { under: 'Under goal', on_track: 'On track', over: 'Slightly over', way_over: 'Way over' }[c.calories] : null,
    })),
  [checkins]);

  return (
    <Section padding="md" contentWidth="lg" gap="lg">
      <Heading type="display" size="jumbo" as="h1" align="center">All the deets</Heading>

      {checkins.length === 0 ? (
        <Heading size="md" color="muted">No check-ins yet.</Heading>
      ) : (
        <Tabs value={tab} onChange={setTab} variant="line">
          <TabList>
            <Tab value="data"   icon="table_chart">Data</Tab>
            <Tab value="charts" icon="show_chart">Charts</Tab>
          </TabList>

          <TabPanel value="data">
            <DataTable
              size="comfortable"
              pageSize={20}
              defaultSort={{ key: 'date', direction: 'desc' }}
              columns={[
                { key: 'date',     label: 'Date',             sortable: true, sortAccessor: row => row._rawDate },
                { key: 'weight',   label: `Weight (${unit})`, sortable: true },
                { key: 'mood',     label: 'Mood',     type: 'badge', statusMap: { 'Amazing': 'success', 'Good': 'success', 'Okay': 'neutral', 'Tough Day': 'warn' } },
                { key: 'activity', label: 'Activity', type: 'badge', statusMap: { Intense: 'success', Moderate: 'info', Light: 'neutral', 'Rest Day': 'neutral' } },
                { key: 'calories', label: 'Calories', type: 'badge', statusMap: { 'Under goal': 'success', 'On track': 'info', 'Slightly over': 'warn', 'Way over': 'error' } },
              ]}
              rows={rows}
              notices={notices}
            />
          </TabPanel>

          <TabPanel value="charts">
            <Stack gap="xl" style={{ paddingBlockStart: 'var(--base-spacing-md)' }}>
              <Stack gap="sm">
                <Heading size="md">Weight Progress</Heading>
                <Paragraph color="muted" size="sm">Your weight over time vs. your goal</Paragraph>
                <ProgressChart data={weightHistory} unit={unit} goalWeight={profile?.goalWeight} />
              </Stack>

              <Stack gap="sm">
                <Heading size="md">BMI Trend</Heading>
                <Paragraph color="muted" size="sm">How your BMI has shifted across health categories</Paragraph>
                {profile && <BmiTrendChart checkins={checkins} profile={profile} />}
              </Stack>

              <Stack gap="sm">
                <Heading size="md">Habits</Heading>
                <Paragraph color="muted" size="sm">Mood, activity, and calorie trends over time (4 = best, 1 = worst)</Paragraph>
                <HabitsChart checkins={checkins} />
              </Stack>
            </Stack>
          </TabPanel>
        </Tabs>
      )}
    </Section>
  );
}
