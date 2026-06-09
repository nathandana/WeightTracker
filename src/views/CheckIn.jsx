import { useState, useEffect, useRef } from 'react';
import {
  Button, Stack, Heading, Paragraph, Card,
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

        <Button variant="secondary" icon="mood">Mood Check In</Button>
      </Section>

      <Section padding="sm" contentWidth="lg" surface="page" gap="lg">
        {stats && (
          <Grid columns={{ xs: 1, sm: 2, md: 4 }} gap="md">
            <Card>
              <Section gap="lg" padding="none" align="center">
              <CircularProgress value={stats.percent} max={100} size="lg" aria-label={`${stats.percent}% complete`}>
                <Heading type='display'>
                  {stats.percent}%
                </Heading>
                <Paragraph size="sm" color='muted'>
                  complete
                </Paragraph>
              </CircularProgress>
              </Section>
              </Card>
              <Card icon='flag'>
                <Stack direction="column" gap="none">
                <Stack direction="row" align='baseline' gap="xs">
                  <Heading type='display'  color='accent' size="xxl">{stats.toGo}</Heading>
                  <Heading size="md" color="muted">{unit}</Heading>
                </Stack>
                <Heading color='muted'>{l('progress.toGo',   'To Go')}</Heading>
                </Stack>
              </Card>
              <Card icon='local_fire_department'>
                <Stack direction="column" gap="none">
                  <Heading type='display' color='accent' size="xxl">{stats.streak}</Heading>
                <Heading color='muted'>{l('progress.streak', 'Streak')}</Heading>
                </Stack>
              </Card>
              <Card icon='calendar_today'>
                <Stack direction="column" gap="none">
                  <Heading type='display' color='accent' size="xxl">{stats.daysIn}</Heading>
                <Heading color='muted'>{l('progress.daysIn', 'Day')}</Heading>
                </Stack>
              </Card>
          </Grid>
        )}


        <Section padding="sm" surface='raised' gap='lg'>
          <Heading size="md">Track Your Progress</Heading>
        <ProgressChart
          data={stats?.weightHistory ?? []}
          unit={unit}
          goalWeight={profile.goalWeight}
        />
        </Section>

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
                  sortable: true,
                },
                {
                  key: 'mood',
                  label: 'Mood',
                  type: 'badge',
                  statusMap: { 'Amazing': 'success', 'Good': 'success', 'Okay': 'neutral', 'Tough Day': 'warn' },
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
