import { useState } from 'react';
import {
  Stack, Heading, Paragraph, Card, Inset, Button, Icon, Banner, Grid,
  Section, CircularProgress, DataTable,
} from '@gtivr4/a1-design-system-react';
import { useLabel } from '@gtivr4/a1-design-system-react';
import { ProgressChart } from '../components/ProgressChart.jsx';
import { getProgressStats } from '../utils/calculations.js';
import { getEncouragement } from '../utils/encouragement.js';


function StatCard({ icon, label, value, sub, heroColor = 'action' }) {
  return (
    <Card icon={icon} iconDisplay='hero' heroColor={heroColor}>
      <Heading as="h2" size="sm">{value}{sub ? ` ${sub}` : ''}</Heading>
      <Paragraph color="muted">{label}</Paragraph>
    </Card>
  );
}


export function Progress({ store }) {
  const l = useLabel;
  const { profile, checkins, locale } = store;
  const [copied, setCopied] = useState(false);

  const stats = getProgressStats(profile, checkins);
  const encouragement = stats
    ? getEncouragement({ percent: stats.percent, streak: stats.streak, weightChange: 0, locale, seed: checkins.length + 1 })
    : null;

  async function handleShare() {
    if (!stats || !profile) return;
    const unit = profile.weightUnit;
    const goalDate = profile.goalDate
      ? new Date(profile.goalDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      : 'my goal';
    const text = [
      '🏃 My Journey Progress', '',
      `Current: ${stats.current} ${unit}`,
      `Lost so far: ${Math.abs(stats.lost)} ${unit}`,
      `Goal: ${stats.goal} ${unit} by ${goalDate}`,
      `Progress: ${stats.percent}% complete`,
      `Day streak: ${stats.streak} 🔥`, '',
      'Taking it one day at a time! 💪',
    ].join('\n');

    if (navigator.share) {
      try { await navigator.share({ title: l('progress.shareTitle', 'My Journey Progress'), text }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  }

  if (!profile) return null;

  return (
    <Section padding='sm' contentWidth="lg" gap="lg">
      
          <Stack direction='row' align='center' wrap justify='between'>
            
            <Heading as="h1" type='display' size="xl">{l('progress.title', 'Your Progress')}</Heading>
                      <Button
                      size="sm"
            variant={copied ? 'success' : 'primary'}
            icon={copied ? 'check' : 'share'}
            onClick={handleShare}
          >
            {copied ? l('progress.shareCopied', 'Copied!') : l('progress.share', 'Share My Progress')}
          </Button>
</Stack>
          

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
                    { label: l('progress.daysIn', 'Days In'),       value: stats.daysIn,                            icon: 'calendar_today' },
                    { label: l('progress.streak', 'Day Streak'),    value: `${stats.streak} 🔥`,                    icon: 'local_fire_department' },
                    { label: l('progress.totalLost', 'Total Lost'), value: `${Math.abs(stats.lost)} ${stats.unit}`, icon: 'trending_down' },
                  ].map(({ label, value, icon }) => (
                    <Stack  key={label} direction='row' gap="sm">
                      <Icon name={icon} size="xl" />
                      <Stack gap="none">
                        <Heading as="p" size="xl">{value}</Heading>
                        <Paragraph color="muted" size="sm"><strong>{label}</strong></Paragraph>
                      </Stack>
                    </Stack>
                  ))}
                </Grid>
            </Card>
          )}

          {stats && (
            <Grid columns={{ xs: 1, sm: 2, md: 4 }} gap="md">
              <StatCard icon="monitor_weight" heroColor="info"    label={l('progress.currentWeight', 'Current')} value={stats.current} sub={stats.unit} />
              <StatCard icon="play_arrow"     heroColor="action"  label={l('progress.startWeight',   'Started')} value={stats.start}   sub={stats.unit} />
              <StatCard icon="flag"           heroColor="success" label={l('progress.goalWeight',    'Goal')}    value={stats.goal}    sub={stats.unit} />
              <StatCard icon="route"          heroColor="warn"    label={l('progress.toGo',          'To Go')}   value={stats.toGo}    sub={stats.unit} />
            </Grid>
          )}

              <ProgressChart
                data={stats?.weightHistory ?? []}
                unit={profile.weightUnit}
                goalWeight={profile.goalWeight}
              />

            {checkins.length > 0 && (
              <Stack gap="md">
                <Heading as="h2">Recent Check-ins</Heading>
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
                      label: `Weight (${profile.weightUnit})`,
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

          {encouragement?.message && (
            <Banner status="success" icon="favorite" title={encouragement.message}></Banner>
          )}

        
      
    </Section>
  );
}
