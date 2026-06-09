import { useState } from 'react';
import {
  Stack, Heading, Paragraph, Card, Inset, Button, Icon, Banner, Grid,
  Section, CircularProgress,
} from '@gtivr4/a1-design-system-react';
import { useLabel } from '@gtivr4/a1-design-system-react';
import { ProgressChart } from '../components/ProgressChart.jsx';
import { getProgressStats } from '../utils/calculations.js';
import { getEncouragement } from '../utils/encouragement.js';

const MOOD_EMOJI = { great: '😊', good: '🙂', okay: '😐', low: '😞' };

function StatCard({ icon, label, value, sub, heroColor = 'action' }) {
  return (
    <Card icon={icon} iconDisplay='hero' heroColor={heroColor}>
      <Heading as="h3" size="sm">{value}{sub ? ` ${sub}` : ''}</Heading>
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
    <Section padding='md' contentWidth="lg" gap="lg">
      
          <Stack direction='row' align='center' wrap justify='between'>
            
            <Heading type='display' size="xl">{l('progress.title', 'Your Progress')}</Heading>
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
              <Stack direction="row" gap={24} align="center" wrap>
                <CircularProgress value={stats.percent} max={100} size="md" aria-label={`${stats.percent}% complete`}>
                  <span style={{ color: 'var(--semantic-color-text-default)', fontFamily: 'var(--component-paragraph-font-family)', fontSize: 'var(--semantic-font-size-body-lg)', fontWeight: 'var(--base-font-weight-bold)', lineHeight: 1 }}>
                    {stats.percent}%
                  </span>
                  <span style={{ color: 'var(--semantic-color-text-muted)', fontFamily: 'var(--component-paragraph-font-family)', fontSize: 'var(--semantic-font-size-body-xs)', marginTop: 'var(--base-spacing-4)' }}>
                    complete
                  </span>
                </CircularProgress>
                <Grid columns={{ xs: 1, sm: 2, md: 4 }} gap="lg">
                  {[
                    { label: l('progress.daysIn', 'Days In'),       value: stats.daysIn,                            icon: 'calendar_today' },
                    { label: l('progress.streak', 'Day Streak'),    value: `${stats.streak} 🔥`,                    icon: 'local_fire_department' },
                    { label: l('progress.totalLost', 'Total Lost'), value: `${Math.abs(stats.lost)} ${stats.unit}`, icon: 'trending_down' },
                  ].map(({ label, value, icon }) => (
                    <Stack  key={label} direction='row' gap="sm">
                      <Icon name={icon} style={{ fontSize: 40 }} />
                      <Stack gap="none">
                        <Heading as="h6" size="xl">{value}</Heading>
                        <Paragraph color="muted" size="sm"><strong>{label}</strong></Paragraph>
                      </Stack>
                    </Stack>
                  ))}
                </Grid>
              </Stack>
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
              <Stack gap={10}>
                <Heading as="h3">Recent Check-ins</Heading>
                {[...checkins].reverse().slice(0, 10).map((c, i) => (
                  <Card key={i} bare>
                    <Stack direction="row" justify="between" align="center" wrap gap="sm">
                      <Stack gap="none">
                        <Heading as="p" size="sm">{c.weight} {profile.weightUnit}</Heading>
                        <Paragraph color="muted" size="sm">
                          {new Date(c.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </Paragraph>
                      </Stack>
                      {(c.mood || c.activity || c.calories) && (
                        <Stack direction="row" gap="sm" wrap>
                          {c.mood     && <Paragraph size="sm">{MOOD_EMOJI[c.mood]}</Paragraph>}
                          {c.activity && <Paragraph size="sm" color="muted">{c.activity}</Paragraph>}
                          {c.calories && <Paragraph size="sm" color="muted">{c.calories.replace('_', ' ')}</Paragraph>}
                        </Stack>
                      )}
                    </Stack>
                  </Card>
                ))}
              </Stack>
            )}

          {encouragement?.message && (
            <Banner status="success" icon="favorite" title={encouragement.message}></Banner>
          )}

        
      
    </Section>
  );
}
