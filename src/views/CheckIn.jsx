import { useState, useEffect, useRef } from 'react';
import {
  Button, ButtonContainer, IconButton, Stack, Heading, Paragraph, Card,
  Grid, Section, CircularProgress, DataTable, Icon,
  Dialog, ChoiceGroup, StepTracker,
} from '@gtivr4/a1-design-system-react';
import { useLabel } from '@gtivr4/a1-design-system-react';
import { WeightStepper } from '../components/WeightStepper.jsx';
import { ProgressChart } from '../components/ProgressChart.jsx';
import { getProgressStats } from '../utils/calculations.js';

const CHECKIN_STEPS = [
  {
    key: 'mood',
    title: 'How are you feeling?',
    options: [
      { value: 'great', label: 'Amazing',   icon: 'sentiment_very_satisfied' },
      { value: 'good',  label: 'Good',      icon: 'sentiment_satisfied' },
      { value: 'okay',  label: 'Okay',      icon: 'sentiment_neutral' },
      { value: 'low',   label: 'Tough Day', icon: 'sentiment_dissatisfied' },
    ],
  },
  {
    key: 'activity',
    title: 'How active were you?',
    options: [
      { value: 'high',   label: 'Intense',  icon: 'directions_run' },
      { value: 'medium', label: 'Moderate', icon: 'directions_walk' },
      { value: 'low',    label: 'Light',    icon: 'self_improvement' },
      { value: 'none',   label: 'Rest Day', icon: 'hotel' },
    ],
  },
  {
    key: 'calories',
    title: 'How did you eat today?',
    options: [
      { value: 'under',    label: 'Under goal',    icon: 'thumb_up' },
      { value: 'on_track', label: 'On track',      icon: 'check_circle' },
      { value: 'over',     label: 'Slightly over', icon: 'trending_up' },
      { value: 'way_over', label: 'Way over',      icon: 'warning' },
    ],
  },
];

function StatCard({ icon, label, value, sub, heroColor = 'action' }) {
  return (
    <Card icon={icon} iconDisplay="hero" heroColor={heroColor}>
      <Heading as="h3" size="md" type="display">{value}{sub ? ` ${sub}` : ''}</Heading>
      <Paragraph color="muted" size="md"><strong>{label}</strong></Paragraph>
    </Card>
  );
}

export function CheckIn({ store, onNavigate }) {
  const l = useLabel;
  const { profile, checkins, currentWeight, todayCheckin, addCheckin } = store;

  const [weight, setWeight] = useState(currentWeight ?? profile?.startWeight ?? 150);
  const [moodOpen, setMoodOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState(0);
  const [tempCheckin, setTempCheckin] = useState({});
  const isDirty = useRef(false);

  function openCheckinDialog() {
    setTempCheckin({ mood: todayCheckin?.mood, activity: todayCheckin?.activity, calories: todayCheckin?.calories });
    setDialogStep(0);
    setMoodOpen(true);
  }

  function handleCheckinSave() {
    addCheckin({ ...(todayCheckin ?? {}), weight: Number(weight), ...tempCheckin });
    setMoodOpen(false);
  }

  function handleDialogClose() {
    setMoodOpen(false);
    setDialogStep(0);
  }

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
      <Section padding="sm" contentWidth="xs" surface="none" align="center" gap="md">
        <Heading align='center' type='display' size="jumbo">Checkin...</Heading>

        <WeightStepper
          value={weight}
          onChange={setWeight}
          unit={unit}
        />

        <Button variant="secondary" icon="mood" onClick={openCheckinDialog}>Check in...</Button>
      </Section>

      <Dialog
        open={moodOpen}
        title={dialogStep < CHECKIN_STEPS.length ? CHECKIN_STEPS[dialogStep].title : "Ready to log?"}
        onClose={handleDialogClose}
      >
        <Stack gap="lg">
          <StepTracker steps={CHECKIN_STEPS.length} currentStep={Math.min(dialogStep + 1, CHECKIN_STEPS.length)} align="left" />

          {dialogStep < CHECKIN_STEPS.length ? (
            <ChoiceGroup
              label=""
              columns={2}
              value={tempCheckin[CHECKIN_STEPS[dialogStep].key] ?? null}
              options={CHECKIN_STEPS[dialogStep].options}
              onChange={val => {
                const key = CHECKIN_STEPS[dialogStep].key;
                setTempCheckin(t => ({ ...t, [key]: val }));
                setDialogStep(s => s + 1);
              }}
            />
          ) : (
            <Stack gap="sm">
              {CHECKIN_STEPS.map(step => {
                const selected = step.options.find(o => o.value === tempCheckin[step.key]);
                return (
                  <Stack key={step.key} direction="row" align="center" justify="between">
                    <Paragraph color="muted">{step.title.replace('?', '')}</Paragraph>
                    <Stack direction="row" align="center" gap="xs">
                      {selected && <Icon name={selected.icon} size="sm" />}
                      <Paragraph><strong>{selected?.label ?? '—'}</strong></Paragraph>
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          )}

          <ButtonContainer justify='between'>
            {dialogStep > 0 && (
              <Button icon="arrow_back" variant="secondary" size="md" onClick={() => setDialogStep(s => s - 1)}>Back</Button>
            )}
            {dialogStep === CHECKIN_STEPS.length && (
              <Button variant="success" onClick={handleCheckinSave}>
                Check In
              </Button>
            )}
          </ButtonContainer>
        </Stack>
      </Dialog>

      <Section padding="sm" contentWidth="lg" surface="page" gap="lg">
        {/* {stats && (
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
        )} */}


        <Section padding="none" surface='page' gap='lg'>
          <Heading size="md">Track Your Progress</Heading>
        <ProgressChart
          data={stats?.weightHistory ?? []}
          unit={unit}
          goalWeight={profile.goalWeight}
        />
        </Section>

        {checkins.length > 0 && (
          <Stack gap="md">
            <Stack direction="row" align="center">
              <Heading as="h3">Recent Check-ins</Heading>
              <Button variant="tertiary" size="sm" icon="open_in_new" onClick={() => onNavigate('data')}>
                View all
              </Button>
            </Stack>
            <DataTable
              size="comfortable"
              columns={[
                { key: 'date',   label: 'Date',              sortable: false },
                { key: 'weight', label: `Weight (${unit})`,  sortable: false },
                { key: 'mood',     label: 'Mood',     type: 'badge', statusMap: { 'Amazing': 'success', 'Good': 'success', 'Okay': 'neutral', 'Tough Day': 'warn' } },
                { key: 'activity', label: 'Activity', type: 'badge', statusMap: { Intense: 'success', Moderate: 'info', Light: 'neutral', 'Rest Day': 'neutral' } },
                { key: 'calories', label: 'Calories', type: 'badge', statusMap: { 'Under goal': 'success', 'On track': 'info', 'Slightly over': 'warn', 'Way over': 'error' } },
              ]}
              rows={[...checkins].slice(-5).reverse().map((c, i) => ({
                id: i,
                date: new Date(c.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
                weight: c.weight,
                mood:     c.mood     ? { great: '😊 Amazing', good: '🙂 Good', okay: '😐 Okay', low: '😞 Tough Day' }[c.mood] : null,
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
