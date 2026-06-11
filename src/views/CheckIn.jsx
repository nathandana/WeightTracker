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
import { formatDate } from '../utils/locale.js';

function fmtProfileDate(iso, locale) {
  if (!iso) return '—';
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + 'T12:00:00') : new Date(iso);
  return formatDate(d, locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

const CHECKIN_STEP_CONFIG = [
  {
    key: 'mood',
    titleKey: 'survey.mood',
    titleFallback: 'How are you feeling?',
    options: [
      { value: 'great', labelKey: 'survey.moodGreat', labelFallback: 'Amazing',   icon: 'sentiment_very_satisfied' },
      { value: 'good',  labelKey: 'survey.moodGood',  labelFallback: 'Good',      icon: 'sentiment_satisfied' },
      { value: 'okay',  labelKey: 'survey.moodOkay',  labelFallback: 'Okay',      icon: 'sentiment_neutral' },
      { value: 'low',   labelKey: 'survey.moodLow',   labelFallback: 'Tough Day', icon: 'sentiment_dissatisfied' },
    ],
  },
  {
    key: 'activity',
    titleKey: 'survey.activityQuestion',
    titleFallback: 'How active were you?',
    options: [
      { value: 'high',   labelKey: 'survey.activityHigh', labelFallback: 'Intense',  icon: 'directions_run' },
      { value: 'medium', labelKey: 'survey.activityMed',  labelFallback: 'Moderate', icon: 'directions_walk' },
      { value: 'low',    labelKey: 'survey.activityLow',  labelFallback: 'Light',    icon: 'self_improvement' },
      { value: 'none',   labelKey: 'survey.activityNone', labelFallback: 'Rest Day', icon: 'hotel' },
    ],
  },
  {
    key: 'calories',
    titleKey: 'survey.caloriesQuestion',
    titleFallback: 'How did you eat today?',
    options: [
      { value: 'under',    labelKey: 'survey.calUnder',    labelFallback: 'Under goal',    icon: 'thumb_up' },
      { value: 'on_track', labelKey: 'survey.calOnTrack',  labelFallback: 'On track',      icon: 'check_circle' },
      { value: 'over',     labelKey: 'survey.calOver',     labelFallback: 'Slightly over', icon: 'trending_up' },
      { value: 'way_over', labelKey: 'survey.calWayOver',  labelFallback: 'Way over',      icon: 'warning' },
    ],
  },
  {
    key: 'notes',
    titleKey: 'survey.notesQuestion',
    titleFallback: 'Any notes for today?',
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
  const { profile, checkins, currentWeight, todayCheckin, addCheckin, saveCheckinForDate, locale } = store;
  const checkinSteps = CHECKIN_STEP_CONFIG.map(step => ({
    ...step,
    title: l(step.titleKey, step.titleFallback),
    options: step.options?.map(option => ({
      ...option,
      label: l(option.labelKey, option.labelFallback),
    })),
  }));

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
    setDialogStep(checkinSteps.length);
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
    sedentary: l('onboarding.activitySedentary', 'Sedentary'),
    light: l('onboarding.activityLight', 'Light'),
    moderate: l('onboarding.activityModerate', 'Moderate'),
    active: l('onboarding.activityActive', 'Active'),
  };

  const medsStr = !profile.meds?.length || profile.meds.includes('none')
    ? l('onboarding.medNone', 'None')
    : profile.meds
        .filter(m => m !== 'none')
        .map(m => ({ semaglutide: 'Semaglutide', tirzepatide: 'Tirzepatide', other: profile.otherMed || l('onboarding.medOther', 'Other') }[m] ?? m))
        .join(', ');

  const profileItems = [
    { id: 'startWeight', label: l('onboarding.startWeight', 'Start Weight'), value: `${profile.startWeight} ${unit}` },
    { id: 'goalWeight',  label: l('onboarding.goalWeight', 'Goal Weight'),   value: `${profile.goalWeight} ${unit}` },
    { id: 'height',      label: l('onboarding.height', 'Height'),            value: heightStr },
    { id: 'age',         label: l('onboarding.age', 'Age'),                  value: `${profile.age} ${l('common.years', 'years')}` },
    { id: 'sex',         label: l('onboarding.sex', 'Biological Sex'),       value: profile.sex === 'male' ? l('onboarding.sexMale', 'Male') : l('onboarding.sexFemale', 'Female') },
    { id: 'activity',    label: l('onboarding.activityLevel', 'Activity Level'), value: activityLabels[profile.activityLevel] ?? profile.activityLevel },
    { id: 'meds',        label: l('profile.meds', 'Medications'),            value: medsStr },
    { id: 'startDate',   label: l('onboarding.startDate', 'Start Date'),     value: fmtProfileDate(profile.startDate, locale) },
    { id: 'goalDate',    label: l('onboarding.targetDate', 'Target Date'),   value: fmtProfileDate(profile.goalDate, locale) },
  ];

  const currentStepDef = checkinSteps[dialogStep];
  const isTextareaStep = currentStepDef?.type === 'textarea';
  const isSummary = dialogStep === checkinSteps.length;

  const summaryItems = [
    ...checkinSteps.filter(s => s.type !== 'textarea').map(step => {
      const selected = step.options.find(o => o.value === tempCheckin[step.key]);
      return { id: step.key, label: step.title.replace('?', '').trim(), value: selected?.label ?? '—' };
    }),
    { id: 'notes', label: l('checkin.notes', 'Notes'), value: tempCheckin.notes || '—' },
  ];

  function CheckInFlow() {
    return (
      <Stack gap="md">
        {dialogStep === 0 && (
          <Paragraph color="muted" size="sm" align='center'>{l('checkin.dailyDetailsPrompt', 'Optionally keep track of your daily details')}</Paragraph>
        )}
        {!isSummary && (
          <StepTracker steps={checkinSteps.length} currentStep={Math.min(dialogStep + 1, checkinSteps.length)} align="center" />
        )}
        {!isSummary && isTextareaStep && (
          <TextareaField
            label={currentStepDef.title}
            value={tempCheckin.notes ?? ''}
            onChange={ev => setTempCheckin(t => ({ ...t, notes: ev.target.value.slice(0, 500) }))}
            placeholder={l('checkin.notesPlaceholder', 'Optional — observations, feelings, or reminders')}
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
            <Button icon="arrow_back" variant="secondary" size="md" onClick={() => setDialogStep(s => s - 1)}>{l('common.back', 'Back')}</Button>
          )}
          {!isSummary && !isTextareaStep && (
            <Button variant="secondary" onClick={() => setDialogStep(s => s + 1)}>{l('common.next', 'Next')}</Button>
          )}
          {!isSummary && isTextareaStep && (
            <Button variant="success" onClick={handleCheckinSave}>{l('nav.checkin', 'Check In')}</Button>
          )}
          {isSummary && (
            <>
              <Button variant="tertiary" icon="edit" onClick={() => setDialogStep(0)}>{l('common.edit', 'Edit')}</Button>
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
          <Heading as="h1" type="display" size={{ xs: 'lg', sm: 'xxl' }}>{l('nav.checkin', 'Check In')}...</Heading>
          <Stack direction="row" gap="sm">
            <Button variant="secondary" size='sm' icon="history" onClick={() => setPastOpen(true)}>{l('checkin.logPast', 'Log past')}</Button>
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
        title={isSummary ? l('checkin.logged', 'Logged!') : currentStepDef?.title}
        onClose={handleCheckinClose}
      >
        {CheckInFlow()}
      </Dialog>

      <Dialog open={viewNotes !== null} title={l('checkin.dayNotes', 'Day Notes')} onClose={() => setViewNotes(null)}>
        <Paragraph>{viewNotes}</Paragraph>
      </Dialog>

      <PastCheckinDialog
        open={pastOpen}
        onClose={() => setPastOpen(false)}
        onSave={saveCheckinForDate}
        profile={profile}
        unit={unit}
        locale={locale}
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
                <Heading as="h2" size="md" type="display">{l('checkin.weightLabel', "Today's Weight")}</Heading>

                        <WeightStepper value={weight} onChange={setWeight} unit={unit} />

                <CircularProgress value={stats.percent} size="lg" aria-label={l('progress.percentReached', `${stats.percent}% of goal reached`).replace('{percent}', stats.percent)}>
                  <Heading as="p" size="lg" type="display">{stats.percent}%</Heading>
                </CircularProgress>
                <Paragraph color="muted" size="lg"><strong>{stats.lost}</strong> {unit} {l('progress.lostLower', 'lost')} | <strong>{stats.toGo}</strong> {unit} {l('progress.toGoLower', 'to go')}</Paragraph>
              </Stack>
            </Card>
            <Card>
              <Stack gap="sm">
                <Heading as="h2" size="md" type="display" align='center'>
                  {isSummary ? l('checkin.todayLabel', 'Today:') : currentStepDef?.title}
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
