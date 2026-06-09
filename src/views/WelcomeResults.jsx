import {
  Stack, Button, Heading, Paragraph,
  Card, Icon, MessageBadge, Section, Grid, Banner,
} from '@gtivr4/a1-design-system-react';
import { useLabel } from '@gtivr4/a1-design-system-react';
import { calculateGoalPlan } from '../utils/calculations.js';

export function WelcomeResults({ profile, onDone }) {
  const l = useLabel;

  const plan = (() => { try { return calculateGoalPlan(profile); } catch { return null; } })();

return (
  <>
    <Section surface="raised" padding="sm" contentWidth="sm" gap="lg">
      <Stack gap="sm" align="center">
        <Icon
          name="celebration"
          size="jumbo"
          color="success"
          fill
        />

        <Heading type="display" size="xxl" as="h1">
          You're All Set{profile.name ? `, ${profile.name}` : ''}!
        </Heading>

        <Paragraph size="xl">
          {l('onboarding.step4Sub', "Here's your personalized plan")}
        </Paragraph>

        <Button variant="success" icon="arrow_forward" size="lg" onClick={onDone}>
          {l('onboarding.startJourney', "Let's Start!")}
        </Button>
      </Stack>
    </Section>

    <Section surface="raised" padding="sm" contentWidth="sm" gap="lg">
      <Card icon="monitor_heart" iconDisplay="hero" heroColor="error">
        <Heading as="h4" size="lg" align="center">
          {l('onboarding.bmiTitle', 'Your BMI')}
        </Heading>

        <Stack direction="row" align="center" justify="center" wrap>
          <Heading as="h3" type="display" size="xJumbo" align="center">
            {plan.bmi?.value}
          </Heading>

          <MessageBadge
            size="lg"
            status={plan.bmi?.category === 'normal' ? 'success' : 'error'}
            icon={plan.bmi?.category === 'normal' ? 'success' : 'error'}
          >
            {l(`bmiCategory.${plan.bmi?.category}`, plan.bmi?.category)}
          </MessageBadge>
        </Stack>
      </Card>

      <Grid columns={2} gap="md">
        {[
          { label: l('onboarding.tdeeLabel', 'Daily Calorie Budget'), value: plan.targetDailyCalories.toLocaleString(), sub: l('common.calDay', 'cal/day') },
          { label: l('onboarding.weeklyLossLabel', 'Est. Weekly Loss'), value: plan.weeklyLoss, sub: profile.weightUnit },
          { label: l('onboarding.deficitLabel', 'Daily Deficit'), value: plan.dailyDeficit.toLocaleString(), sub: l('common.calDay', 'cal/day') },
          { label: l('onboarding.daysLabel', 'Days to Goal'), value: plan.daysRemaining, sub: l('common.days', 'days') },
        ].map(({ label, value, sub }) => (
          <Card key={label}>
            <Stack direction="column">
              <Heading as="h3" size="sm">{label}</Heading>

              <Stack direction="row" align="end" gap="none">
                <Heading as="p" size="lg" type="display">{value}</Heading>
                <Paragraph size="md" color="muted">{sub}</Paragraph>
              </Stack>
            </Stack>
          </Card>
        ))}
      </Grid>

      <Banner
        status={plan.isFeasible ? 'success' : 'warn'}
        icon={plan.isFeasible ? 'favorite' : 'star'}
        title={
          plan.isFeasible
            ? l('onboarding.feasibleNote', 'This is a healthy, achievable pace.')
            : l('onboarding.aggressiveNote', "Your goal is ambitious — that's great! Focus on consistency over speed.")
        }
      />

      <Banner
        status="info"
        icon="medication"
        title={l('onboarding.medNote', 'Medications can significantly accelerate your results. Every pound lost is a win!')}
      />
    </Section>
  </>
);
}