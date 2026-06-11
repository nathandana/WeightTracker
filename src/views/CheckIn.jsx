import { useState, useEffect, useRef } from 'react';
import {
  Button, ButtonContainer, Stack, Heading, Paragraph, Card, CircularProgress,
  Grid, Section, DataTable,
  Dialog, ChoiceGroup, StepTracker, DefinitionList, TextareaField,
} from '@gtivr4/a1-design-system-react';
import { useLabel } from '@gtivr4/a1-design-system-react';
import { WeightStepper } from '../components/WeightStepper.jsx';
import { PastCheckinDialog } from '../components/PastCheckinDialog.jsx';
import { getProgressStats } from '../utils/calculations.js';

function fmtProfileDate(iso) {
  if (!iso) return '—';
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + 'T12:00:00') : new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

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
  {
    key: 'notes',
    title: 'Any notes for today?',
    type: 'textarea',
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
  const { profile, checkins, currentWeight, todayCheckin, addCheckin, saveCheckinForDate } = store;

  const [weight, setWeight] = useState(currentWeight ?? profile?.startWeight ?? 150);
  const [moodOpen, setMoodOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState(0);
  const [tempCheckin, setTempCheckin] = useState({});
  const [viewNotes, setViewNotes] = useState(null);
  const [pastOpen, setPastOpen] = useState(false);
  const isDirty = useRef(false);

  function openCheckinDialog() {
    setTempCheckin({
      mood: todayCheckin?.mood,
      activity: todayCheckin?.activity,
      calories: todayCheckin?.calories,
      notes: todayCheckin?.notes ?? '',
    });
    setDialogStep(0);
    setMoodOpen(true);
  }

  function handleCheckinSave() {
    addCheckin({ ...(todayCheckin ?? {}), weight: Number(weight), ...tempCheckin });
    setDialogStep(CHECKIN_STEPS.length);
  }

  function handleCheckinClose() {
    setMoodOpen(false);
    setDialogStep(0);
  }

  function handleDialogClose() {
    setMoodOpen(false);
    setDialogStep(0);
  }

  useEffect(() => {
    if (!isDirty.current) { isDirty.current = true; return; }
    const t = setTimeout(() => addCheckin({ weight: Number(weight) }), 600);
    return () => clearTimeout(t);
  }, [weight]);

  const today = new Date().toDateString();
  const liveCheckins = [
    ...checkins.filter(c => new Date(c.date).toDateString() !== today),
    { ...(todayCheckin ?? {}), date: new Date().toISOString(), weight: Number(weight) },
  ];
  const stats = getProgressStats(profile, liveCheckins);

  if (!profile) return null;

  const unit = profile.weightUnit;
  const isMetric = profile.heightUnit === 'cm';

  const heightStr = isMetric
    ? `${profile.height} cm`
    : `${profile.heightFeet}′ ${profile.heightInches}″`;

  const activityLabels = {
    sedentary: 'Sedentary', light: 'Light', moderate: 'Moderate', active: 'Active',
  };

  const medsStr = !profile.meds?.length || profile.meds.includes('none')
    ? 'None'
    : profile.meds
        .filter(m => m !== 'none')
        .map(m => ({ semaglutide: 'Semaglutide', tirzepatide: 'Tirzepatide', other: profile.otherMed || 'Other' }[m] ?? m))
        .join(', ');

  const profileItems = [
    { id: 'startWeight', label: 'Start Weight',   value: `${profile.startWeight} ${unit}` },
    { id: 'goalWeight',  label: 'Goal Weight',    value: `${profile.goalWeight} ${unit}` },
    { id: 'height',      label: 'Height',         value: heightStr },
    { id: 'age',         label: 'Age',            value: `${profile.age} years` },
    { id: 'sex',         label: 'Biological Sex', value: profile.sex === 'male' ? 'Male' : 'Female' },
    { id: 'activity',    label: 'Activity Level', value: activityLabels[profile.activityLevel] ?? profile.activityLevel },
    { id: 'meds',        label: 'Medications',    value: medsStr },
    { id: 'startDate',   label: 'Start Date',     value: fmtProfileDate(profile.startDate) },
    { id: 'goalDate',    label: 'Target Date',    value: fmtProfileDate(profile.goalDate) },
  ];

  const currentStepDef = CHECKIN_STEPS[dialogStep];
  const isTextareaStep = currentStepDef?.type === 'textarea';
  const isSummary = dialogStep === CHECKIN_STEPS.length;

  const summaryItems = [
    ...CHECKIN_STEPS.filter(s => s.type !== 'textarea').map(step => {
      const selected = step.options.find(o => o.value === tempCheckin[step.key]);
      return { id: step.key, label: step.title.replace('?', '').trim(), value: selected?.label ?? '—' };
    }),
    { id: 'notes', label: 'Notes', value: tempCheckin.notes || '—' },
  ];

  function CheckInFlow() {
    return (
      <Stack gap="md">
        {dialogStep === 0 && (
          <Paragraph color="muted" size="sm" align='center'>Optionally keep track of your daily details</Paragraph>
        )}
        {!isSummary && (
          <StepTracker steps={CHECKIN_STEPS.length} currentStep={Math.min(dialogStep + 1, CHECKIN_STEPS.length)} align="center" />
        )}
        {!isSummary && isTextareaStep && (
          <TextareaField
            label={currentStepDef.title}
            value={tempCheckin.notes ?? ''}
            onChange={ev => setTempCheckin(t => ({ ...t, notes: ev.target.value.slice(0, 500) }))}
            placeholder="Optional — observations, feelings, or reminders"
            maxLength={500}
            rows="md"
            size="comfortable"
          />
        )}
        {!isSummary && !isTextareaStep && (
          <ChoiceGroup
            label=""
            columns={2}
            value={tempCheckin[currentStepDef.key] ?? null}
            options={currentStepDef.options}
            onChange={val => {
              setTempCheckin(t => ({ ...t, [currentStepDef.key]: val }));
              setDialogStep(s => s + 1);
            }}
          />
        )}
        {isSummary && (
          <DefinitionList items={summaryItems} direction="row" labelWidth="fixed" size="sm" />
        )}
        <ButtonContainer fillButtons justify="between">
          {!isSummary && dialogStep > 0 && (
            <Button icon="arrow_back" variant="secondary" size="md" onClick={() => setDialogStep(s => s - 1)}>Back</Button>
          )}
          {!isSummary && !isTextareaStep && (
            <Button variant="secondary" onClick={() => setDialogStep(s => s + 1)}>Next</Button>
          )}
          {!isSummary && isTextareaStep && (
            <Button variant="success" onClick={handleCheckinSave}>Check In</Button>
          )}
          {isSummary && (
            <>
              <Button variant="tertiary" icon="edit" onClick={() => setDialogStep(0)}>Edit</Button>
            </>
          )}
        </ButtonContainer>
      </Stack>
    );
  }

  return (
    <>
      <Section padding="sm" contentWidth="lg" surface="none" gap="md">
        <Stack direction="row" justify="between" align="center">
          <Heading as="h1" type="display" size={{ xs: 'lg', sm: 'xxl' }}>Check In...</Heading>
          <Stack direction="row" gap="sm">
            <Button variant="secondary" size='sm' icon="history" onClick={() => setPastOpen(true)}>Log past</Button>
            {/* <Button variant="secondary" size='sm' icon="bar_chart" onClick={() => onNavigate('data')}>View the data</Button> */}
          </Stack>
        </Stack>
      </Section>

      {/* <Section padding="sm" contentWidth="lg" surface="none" gap="md">
        <Card>
          <Stack gap="sm">
            <Heading size="md">Your Profile</Heading>
            <DefinitionList items={profileItems} direction="row" labelWidth="fixed" size="sm" />
          </Stack>
        </Card>
      </Section> */}

      <Dialog
        open={moodOpen}
        title={isSummary ? 'Logged!' : currentStepDef?.title}
        onClose={handleCheckinClose}
      >
        {CheckInFlow()}
      </Dialog>

      <Dialog open={viewNotes !== null} title="Day Notes" onClose={() => setViewNotes(null)}>
        <Paragraph>{viewNotes}</Paragraph>
      </Dialog>

      <PastCheckinDialog
        open={pastOpen}
        onClose={() => setPastOpen(false)}
        onSave={saveCheckinForDate}
        profile={profile}
        unit={unit}
      />

      {stats && (
        <Section padding="sm" contentWidth="lg" surface="none" gap="md">
          {/* <Grid columns={{ xs: 2, sm: 4 }} gap="md">
            <StatCard icon="trending_down"         label="Lost"    value={stats.lost}   sub={unit} heroColor={stats.lost > 0 ? 'success' : 'neutral'} />
            <StatCard icon="flag"                  label="To Go"   value={stats.toGo}   sub={unit} />
            <StatCard icon="local_fire_department" label="Streak"  value={`${stats.streak}d`} />
            <StatCard icon="today"                 label="Days In" value={stats.daysIn} />
          </Grid> */}
          <Grid columns={{ xs: 1, md: 2 }} gap="md">
            <Card>
              
              <Stack align="center" gap="lg">
                <Heading as="h2" size="md" type="display">Today's Weight</Heading>

                        <WeightStepper value={weight} onChange={setWeight} unit={unit} />

                <CircularProgress value={stats.percent} size="lg" aria-label={`${stats.percent}% of goal reached`}>
                  <Heading as="p" size="lg" type="display">{stats.percent}%</Heading>
                </CircularProgress>
                <Paragraph color="muted" size="lg"><strong>{stats.lost}</strong> {unit} lost | <strong>{stats.toGo}</strong> {unit} to go</Paragraph>
              </Stack>
            </Card>
            <Card>
              <Stack gap="sm">
                <Heading as="h2" size="md" type="display" align='center'>
                  {isSummary ? 'Today:' : currentStepDef?.title}
                </Heading>
                {CheckInFlow()}
              </Stack>
            </Card>
          </Grid>
        </Section>
      )}

      {/* {checkins.length > 0 && (
        <Section padding="sm" contentWidth="lg" surface="page" gap="lg">
          <Stack gap="md">
            <Stack direction="row" align="center">
              <Heading as="h3">Recent Check-ins</Heading>
              <Button variant="tertiary" size="sm" icon="open_in_new" onClick={() => onNavigate('data')}>
                View all
              </Button>
            </Stack>
            <DataTable
              size={{ xs: 'compact', sm: 'comfortable' }}
              columns={[
                { key: 'date',      label: 'Date',             sortable: false },
                { key: 'weight',    label: `Weight (${unit})`, sortable: false },
                { key: 'mood',      label: 'Mood',     type: 'badge', statusMap: { 'Amazing': 'success', 'Good': 'success', 'Okay': 'neutral', 'Tough Day': 'warn' } },
                { key: 'activity',  label: 'Activity', type: 'badge', statusMap: { Intense: 'success', Moderate: 'info', Light: 'neutral', 'Rest Day': 'neutral' } },
                { key: 'calories',  label: 'Calories', type: 'badge', statusMap: { 'Under goal': 'success', 'On track': 'info', 'Slightly over': 'warn', 'Way over': 'error' } },
                { key: 'notes',     label: 'Notes', type: 'actions' },
              ]}
              rows={[...liveCheckins].slice(-5).reverse().map((c, i) => ({
                id: i,
                date:     new Date(c.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
                weight:   c.weight,
                mood:     c.mood     ? { great: '😊 Amazing', good: '🙂 Good', okay: '😐 Okay', low: '😞 Tough Day' }[c.mood] : null,
                activity: c.activity ? { high: 'Intense', medium: 'Moderate', low: 'Light', none: 'Rest Day' }[c.activity] : null,
                calories: c.calories ? { under: 'Under goal', on_track: 'On track', over: 'Slightly over', way_over: 'Way over' }[c.calories] : null,
                notes: c.notes ? [{ icon: 'sticky_note_2', label: 'View notes', onClick: () => setViewNotes(c.notes) }] : null,
              }))}
            />
          </Stack>
        </Section>
      )} */}
    </>
  );
}
