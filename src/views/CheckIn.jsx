import { useState } from 'react';
import {
  Stack, Button, ButtonContainer, Heading, Paragraph,
  Card, Inset, Icon, ChoiceGroup, Banner, MessageBadge,
  Grid, Divider, Dialog,
  Section,
} from '@gtivr4/a1-design-system-react';
import { useLabel } from '@gtivr4/a1-design-system-react';
import { WeightStepper } from '../components/WeightStepper.jsx';
import { getEncouragement } from '../utils/encouragement.js';
import { getProgressStats } from '../utils/calculations.js';

const MOOD_OPTIONS = (l) => [
  { value: 'great', label: '😊 ' + l('survey.moodGreat', 'Amazing') },
  { value: 'good',  label: '🙂 ' + l('survey.moodGood', 'Good') },
  { value: 'okay',  label: '😐 ' + l('survey.moodOkay', 'Okay') },
  { value: 'low',   label: '😞 ' + l('survey.moodLow', 'Tough Day') },
];

const ACTIVITY_OPTIONS = (l) => [
  { value: 'high',   label: '🏃 ' + l('survey.activityHigh', 'Intense') },
  { value: 'medium', label: '🚶 ' + l('survey.activityMed', 'Moderate') },
  { value: 'low',    label: '🧘 ' + l('survey.activityLow', 'Light') },
  { value: 'none',   label: '🛋️ ' + l('survey.activityNone', 'Rest Day') },
];

const CALORIE_OPTIONS = (l) => [
  { value: 'under',    label: '✅ ' + l('survey.calUnder', 'Under goal') },
  { value: 'on_track', label: '🎯 ' + l('survey.calOnTrack', 'On track') },
  { value: 'over',     label: '😅 ' + l('survey.calOver', 'Slightly over') },
  { value: 'way_over', label: '🍕 ' + l('survey.calWayOver', 'Way over') },
];

const MOOD_EMOJI = { great: '😊', good: '🙂', okay: '😐', low: '😞' };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const SCREEN = { WEIGHT: 'weight', SURVEY_PROMPT: 'survey_prompt', DONE: 'done' };

export function CheckIn({ store, navigate }) {
  const l = useLabel;
  const { profile, checkins, todayCheckin, currentWeight, addCheckin, locale } = store;

  const [screen, setScreen] = useState(todayCheckin ? SCREEN.DONE : SCREEN.WEIGHT);
  const [weight, setWeight] = useState(currentWeight ?? profile?.startWeight ?? 150);
  const [survey, setSurvey] = useState({ mood: null, activity: null, calories: null });
  const [surveyOpen, setSurveyOpen] = useState(false);

  const greetPeriod = greeting();
  const name = profile?.name ? `, ${profile.name}` : '';
  const stats = getProgressStats(profile, checkins);
  const lastEntry  = store.latestCheckin;
  const lastWeight = lastEntry?.weight;
  const weightChange = lastWeight != null ? weight - lastWeight : null;

  const encouragement = stats
    ? getEncouragement({ percent: stats.percent, streak: stats.streak, weightChange: weightChange ?? 0, locale, seed: checkins.length })
    : null;

  function handleLogWeight() {
    addCheckin({ weight: Number(weight) });
    setScreen(SCREEN.SURVEY_PROMPT);
  }

  function handleSubmitSurvey() {
    const today = new Date().toDateString();
    store.update({
      checkins: store.checkins.map(c =>
        new Date(c.date).toDateString() === today ? { ...c, ...survey } : c
      ),
    });
    setSurveyOpen(false);
    navigate('progress');
  }

  function handleSkipSurvey() {
    setSurveyOpen(false);
    navigate('progress');
  }

  const canSubmit = survey.mood && survey.activity && survey.calories;

  const StatMiniCards = () => stats ? (
    <Grid columns={{ xs: 1, sm: 2, md: 4 }} gap="md">
      {[
        { icon: 'monitor_heart',        label: 'Lost',   value: `${Math.abs(stats.lost)} ${stats.unit}` },
        { icon: 'flag',                  label: 'To Go',  value: `${stats.toGo} ${stats.unit}` },
        { icon: 'local_fire_department', label: 'Streak', value: `${stats.streak} day` },
        { icon: 'calendar_today',        label: 'Day',    value: `${stats.daysIn}` },
      ].map(({ icon, label, value }) => (
        <Card key={label} icon={icon} iconDisplay="hero" heroColor="info">
          <Heading as="h3" size="md" type="display">{value}</Heading>
          <Paragraph color="muted" size="md"><strong>{label}</strong></Paragraph>
        </Card>
      ))}
    </Grid>
  ) : null;

  const ContextPanel = () => (
    <Stack gap={16}>
      {lastEntry && (
        <Card icon="history">
          <Heading as="p" size="lg">{lastWeight} {profile?.weightUnit}</Heading>
          <Paragraph color="muted" size="sm">
            {l('checkin.lastEntry', 'Last logged')} · {formatDate(lastEntry.date)}
          </Paragraph>
        </Card>
      )}

      {weightChange != null && Math.abs(weightChange) > 0.05 && (
        <MessageBadge
          status={weightChange <= 0 ? 'success' : 'warn'}
          icon={weightChange <= 0 ? 'trending_down' : 'trending_up'}
        >
          {weightChange > 0 ? '+' : ''}{Math.round(weightChange * 10) / 10} {profile?.weightUnit} since last entry
        </MessageBadge>
      )}

      <StatMiniCards />
    </Stack>
  );

  const SurveyDialog = () => (
    <Dialog
      title={l('survey.title', 'Quick Check-In')}
      open={surveyOpen}
      onClose={handleSkipSurvey}
      footer={
        <ButtonContainer align="end">
          <Button variant="tertiary" onClick={handleSkipSurvey}>
            {l('common.skip', 'Skip')}
          </Button>
          <Button variant="primary" disabled={!canSubmit} onClick={handleSubmitSurvey}>
            {l('survey.submit', 'Submit Check-In')}
          </Button>
        </ButtonContainer>
      }
    >
      <Stack gap="lg">
        <div className="jc-form-row-desktop">
          <Stack gap={20}>
            <ChoiceGroup
              label={l('survey.mood', 'How are you feeling?')}
              options={MOOD_OPTIONS(l)}
              columns={2}
              value={survey.mood}
              onChange={v => setSurvey(s => ({ ...s, mood: v }))}
            />
            <ChoiceGroup
              label={l('survey.activity', 'Activity Today')}
              options={ACTIVITY_OPTIONS(l)}
              columns={2}
              value={survey.activity}
              onChange={v => setSurvey(s => ({ ...s, activity: v }))}
            />
          </Stack>
          <Stack gap={20}>
            <ChoiceGroup
              label={l('survey.calories', 'Calorie Intake')}
              options={CALORIE_OPTIONS(l)}
              columns={2}
              value={survey.calories}
              onChange={v => setSurvey(s => ({ ...s, calories: v }))}
            />
          </Stack>
        </div>
      </Stack>
    </Dialog>
  );

  // ── WEIGHT screen ──────────────────────────────────────────────────
  if (screen === SCREEN.WEIGHT) {
return (
  <>
    <Section contentWidth="md" padding="sm" surface="raised" gap="lg" align="center">
      <div>
        <Heading color="muted" size="sm" as="h2" align="center">
          {l(`checkin.greeting.${greetPeriod}`, 'Hello')}{name}!
        </Heading>

        <Heading type="display" size="xl" as="h1" align="center">
          {l('checkin.title', 'How are you today?')}
        </Heading>
      </div>

      <Section surface="page" contentWidth="xs" padding="sm" align="center" gap="lg">
        <WeightStepper
          value={weight}
          onChange={setWeight}
          unit={profile?.weightUnit ?? 'lbs'}
        />

        <ButtonContainer>
          <Button variant="primary" size='lg' onClick={handleLogWeight}>
            {l('checkin.logWeight', 'Log Weight')}
          </Button>
        </ButtonContainer>
      </Section>
    </Section>

    <Section contentWidth="lg" padding="sm" surface="page" gap="lg">
                              <ContextPanel />

    </Section>
  </>
);
  }

  // ── SURVEY PROMPT ─────────────────────────────────────────────────
  if (screen === SCREEN.SURVEY_PROMPT) {
    return (
      <>
        <SurveyDialog />
        <Section padding='lg' surface="raised" gap="lg" align="center" contentWidth="sm" height="hero">
        <Stack justify='center' align='center'>
            <Icon name="check_circle" style={{ fontSize: 96 }} fill/>
            <Stack gap={8} align="center">
              <Heading type='display' align="center" size="jumbo">Weight logged!</Heading>
              {encouragement?.message && (
                <Paragraph align="center" size='lg' color="muted">{encouragement.message}</Paragraph>
              )}
              {encouragement?.streakMessage && (
                <Paragraph align="center" size='lg' color="muted">{encouragement.streakMessage}</Paragraph>
              )}
            </Stack>
            <ButtonContainer align='center' size="lg">
              <Button variant="primary" onClick={() => setSurveyOpen(true)}>
                {l('checkin.takeSurvey', 'Add a quick check-in')}
              </Button>
              <Button variant="tertiary" onClick={() => navigate('progress')}>
                {l('checkin.skipSurvey', "I'm all done for today")}
              </Button>
            </ButtonContainer>
            </Stack>
        </Section>
      </>
    );
  }

  // ── DONE ──────────────────────────────────────────────────────────
  const todayEntry = store.checkins.find(
    c => new Date(c.date).toDateString() === new Date().toDateString()
  );

  return (
    <Section contentWidth="lg" padding='sm' gap="lg">
        <div>
          <Heading as='h1'>{l('checkin.alreadyLogged', "You've already logged today!")}</Heading>
          <Paragraph color="muted" size="lg">
            {l('checkin.alreadyLoggedSub', 'Come back tomorrow to keep your streak.')}
          </Paragraph>
        </div>
            {todayEntry && (
              <Card icon="monitor_weight">
                <Heading as="p" size="xl">{todayEntry.weight} {profile?.weightUnit}</Heading>
                {todayEntry.mood && <Heading size='xxl'>{MOOD_EMOJI[todayEntry.mood]}</Heading>}
                {todayEntry.activity && (
                  <Paragraph color="muted">
                    {todayEntry.activity} · {(todayEntry.calories ?? '').replace('_', ' ')}
                  </Paragraph>
                )}
            <Button variant="tertiary" icon="edit" onClick={() => setScreen(SCREEN.WEIGHT)}>
              {l('checkin.updateWeight', "Update today's entry")}
            </Button>
            {encouragement?.message && (
              <Banner status="info" icon="favorite">{encouragement.message}</Banner>
            )}

              </Card>
            )}



          {stats && (
            <Stack gap={12}>
              <Heading as="h3" size="md">Today's Snapshot</Heading>
                <StatMiniCards />
            </Stack>
          )}
    </Section>
  );
}
