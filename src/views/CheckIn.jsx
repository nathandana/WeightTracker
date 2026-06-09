import { useState, useEffect, useRef } from 'react';
import {
  Stack, Heading, Paragraph, Card,
  Grid, Section, CircularProgress, DataTable, Icon,
} from '@gtivr4/a1-design-system-react';
import { useLabel } from '@gtivr4/a1-design-system-react';
import { WeightStepper } from '../components/WeightStepper.jsx';
import { ProgressChart } from '../components/ProgressChart.jsx';
import { getProgressStats } from '../utils/calculations.js';

function StatCard({ icon, label, value, sub, heroColor = 'action' }) {
  return (
    <Card icon={icon} iconDisplay="hero" heroColor={heroColor}>
      <Heading as="h3" size="md" type="display">{value}{sub ? ` ${sub}` : ''}</Heading>
      <Paragraph color="muted" size="md"><strong>{label}</strong></Paragraph>
    </Card>
  );
}

export function CheckIn({ store }) {
  const l = useLabel;
  const { profile, checkins, currentWeight, addCheckin } = store;

  const [weight, setWeight] = useState(currentWeight ?? profile?.startWeight ?? 150);
  const isDirty = useRef(false);

  // Auto-save debounced — skip initial render
  useEffect(() => {
    if (!isDirty.current) { isDirty.current = true; return; }
    const t = setTimeout(() => addCheckin({ weight: Number(weight) }), 600);
    return () => clearTimeout(t);
  }, [weight]);

  // Compute stats live from current weight (updates before save completes)
  const today = new Date().toDateString();
  const liveCheckins = [
    ...checkins.filter(c => new Date(c.date).toDateString() !== today),
    { date: new Date().toISOString(), weight: Number(weight) },
  ];
  const stats = getProgressStats(profile, liveCheckins);

  if (!profile) return null;

  const unit = profile.weightUnit;

  return (
    <>
      <Section padding="sm" contentWidth="sm" surface="raised" align="center" gap="md">
        <WeightStepper
          value={weight}
          onChange={setWeight}
          unit={unit}
        />
      </Section>

      <Section padding="sm" contentWidth="lg" surface="page" gap="lg">
        {stats && (
          <Grid columns={{ xs: 1, sm: 2, md: 4 }} gap="md">
            <StatCard
              icon="monitor_heart"
              heroColor={stats.lost >= 0 ? 'success' : 'warn'}
              label={stats.lost >= 0 ? l('progress.lost', 'Lost') : l('progress.gained', 'Gained')}
              value={Math.abs(stats.lost)}
              sub={unit}
            />
            <StatCard icon="flag"                  heroColor="warn"   label={l('progress.toGo',   'To Go')}      value={stats.toGo}    sub={unit} />
            <StatCard icon="local_fire_department" heroColor="action" label={l('progress.streak', 'Streak')}     value={`${stats.streak} day`} />
            <StatCard icon="calendar_today"        heroColor="info"   label={l('progress.daysIn', 'Day')}        value={stats.daysIn} />
          </Grid>
        )}

        {stats && (
          <Card>
            <Grid columns={{ xs: 1, sm: 2, md: 4 }} gap="lg">
              <CircularProgress value={stats.percent} max={100} size="md" aria-label={`${stats.percent}% complete`}>
                <span style={{ color: 'var(--semantic-color-text-default)', fontFamily: 'var(--component-paragraph-font-family)', fontSize: 'var(--semantic-font-size-body-lg)', fontWeight: 'var(--base-font-weight-bold)', lineHeight: 1 }}>
                  {stats.percent}%
                </span>
                <span style={{ color: 'var(--semantic-color-text-muted)', fontFamily: 'var(--component-paragraph-font-family)', fontSize: 'var(--semantic-font-size-body-xs)', marginTop: 'var(--base-spacing-4)' }}>
                  complete
                </span>
              </CircularProgress>
              {[
                { label: l('progress.daysIn',    'Days In'),     value: stats.daysIn,                icon: 'calendar_today' },
                { label: l('progress.streak',    'Day Streak'),  value: `${stats.streak} 🔥`,        icon: 'local_fire_department' },
                { label: l('progress.totalLost', 'Total Lost'),  value: `${Math.abs(stats.lost)} ${unit}`, icon: 'trending_down' },
              ].map(({ label, value, icon }) => (
                <Stack key={label} direction="row" gap="sm">
                  <Icon name={icon} size="xl" />
                  <Stack gap="none">
                    <Heading as="h6" size="xl">{value}</Heading>
                    <Paragraph color="muted" size="sm"><strong>{label}</strong></Paragraph>
                  </Stack>
                </Stack>
              ))}
            </Grid>
          </Card>
        )}

        <ProgressChart
          data={stats?.weightHistory ?? []}
          unit={unit}
          goalWeight={profile.goalWeight}
        />

        {checkins.length > 0 && (
          <Stack gap="md">
            <Heading as="h3">Recent Check-ins</Heading>
            <DataTable
              size="comfortable"
              pageSize={15}
              defaultSort={{ key: 'date', direction: 'desc' }}
              columns={[
                {
                  key: 'date',
                  label: 'Date',
                  sortable: true,
                  sortAccessor: row => row._rawDate,
                },
                {
                  key: 'weight',
                  label: `Weight (${unit})`,
                  type: 'number',
                  sortable: true,
                },
                {
                  key: 'mood',
                  label: 'Mood',
                  type: 'badge',
                  statusMap: { '😊 Amazing': 'success', '🙂 Good': 'success', '😐 Okay': 'neutral', '😞 Tough Day': 'warn' },
                },
                {
                  key: 'activity',
                  label: 'Activity',
                  type: 'badge',
                  statusMap: { Intense: 'success', Moderate: 'info', Light: 'neutral', 'Rest Day': 'neutral' },
                },
                {
                  key: 'calories',
                  label: 'Calories',
                  type: 'badge',
                  statusMap: { 'Under goal': 'success', 'On track': 'info', 'Slightly over': 'warn', 'Way over': 'error' },
                },
              ]}
              rows={[...checkins].reverse().map((c, i) => ({
                id: i,
                _rawDate: c.date,
                date: new Date(c.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
                weight: c.weight,
                mood: c.mood ? { great: '😊 Amazing', good: '🙂 Good', okay: '😐 Okay', low: '😞 Tough Day' }[c.mood] : null,
                activity: c.activity ? { high: 'Intense', medium: 'Moderate', low: 'Light', none: 'Rest Day' }[c.activity] : null,
                calories: c.calories ? { under: 'Under goal', on_track: 'On track', over: 'Slightly over', way_over: 'Way over' }[c.calories] : null,
              }))}
            />
          </Stack>
        )}
      </Section>
    </>
  );
}
