import {
  Stack, Button, ButtonContainer, Heading, Paragraph,
  Card, Icon, MessageBadge, Section, Grid, Banner,
  IconButton,
} from '@gtivr4/a1-design-system-react';
import { useLabel } from '@gtivr4/a1-design-system-react';
import { calculateGoalPlan } from '../../utils/calculations.js';
import { BmiRangeChart } from '../../components/BmiRangeChart.jsx';

function formatGoalDate(goalDate) {
  if (!goalDate) return '—';
  const d = /^\d{4}-\d{2}-\d{2}$/.test(goalDate)
    ? new Date(goalDate + 'T12:00:00')
    : new Date(goalDate);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const BMI_HERO = {
  underweight: { color: 'warn',    icon: 'monitor_weight' },
  normal:      { color: 'success', icon: 'favorite' },
  overweight:  { color: 'warn',    icon: 'monitor_heart' },
  obese:       { color: 'error',   icon: 'monitor_heart' },
};

// Status and icon need to be different values, the card icon also need to change
const BMI_BADGE_STATUS = {
  underweight: 'warn',
  normal:      'success',
  overweight:  'warn',
  obese:       'error',
};

export function WelcomeResults({ profile, onDone, onBack, currentStep, totalSteps }) {
  const l = useLabel;

  const plan = (() => { try { return calculateGoalPlan(profile); } catch { return null; } })();

  const bmiHero = BMI_HERO[plan?.bmi?.category] ?? { color: 'action', icon: 'monitor_heart' };
  const bmiStatus = BMI_BADGE_STATUS[plan?.bmi?.category] ?? 'neutral';

  return (
    <>
<Section surface="raised" padding="sm" contentWidth="xs" gap="lg">

          <Heading type="display" size="xxl" as="h1" align='center'>
            You've got a plan!
          </Heading>

        <Card icon={bmiHero.icon} iconDisplay="hero" heroColor={bmiHero.color}>
          <Heading as="h4" size="lg" align="center">
            {l('onboarding.bmiTitle', 'Your BMI')}
          </Heading>

          <Stack direction="row" align="center" justify="center" wrap>
            <Heading as="h3" type="display" size="xJumbo" align="center">
              {plan.bmi?.value}
            </Heading>

            <MessageBadge
              size="lg"
              status={bmiStatus}
              icon={bmiStatus}
            >
              {l(`bmiCategory.${plan.bmi?.category}`, plan.bmi?.category)}
            </MessageBadge>
          </Stack>

          <BmiRangeChart bmi={plan.bmi} />
        </Card>

        <Grid columns={2} gap="lg">
          {[
            { label: l('onboarding.tdeeLabel', 'Daily Calorie Budget'), value: plan.targetDailyCalories.toLocaleString(), sub: l('common.calDay', 'cal/day'), icon: 'restaurant' },
            { label: l('onboarding.weeklyLossLabel', 'Est. Weekly Loss'), value: plan.weeklyLoss, sub: profile.weightUnit, icon: 'trending_down' },
            { label: l('onboarding.deficitLabel', 'Daily Deficit'), value: plan.dailyDeficit.toLocaleString(), sub: l('common.calDay', 'cal/day'), icon: 'bolt' },
          ].map(({ label, value, sub, icon }) => (
            <Card key={label} bare>
              <Stack direction="column" gap="sm">
                <Heading as="h3" size="sm">{label}</Heading>
                <Stack direction="row" align="end" gap="none">
                  <Heading as="p" size="lg" type="display">{value}</Heading>
                  <Paragraph size="md" color="muted">{sub}</Paragraph>
                </Stack>
              </Stack>
            </Card>
          ))}
          <Card bare>
            <Stack direction="column" gap="xs">
              <Heading as="h3" size="sm">{l('onboarding.goalDate', 'Target Date')}</Heading>
              <Heading as="p" size="sm" type="display">{formatGoalDate(profile.goalDate)}</Heading>
            </Stack>
          </Card>
        </Grid>

                  <Stack gap="xs">
        <Banner
        variant='system'
          status={plan.isFeasible ? 'success' : 'warn'}
          icon={plan.isFeasible ? 'favorite' : 'star'}
          title={
            plan.isFeasible
              ? l('onboarding.feasibleNote', 'This is a healthy, achievable pace.')
              : l('onboarding.aggressiveNote', "Your goal is ambitious — that's great! Focus on consistency over speed.")
          }
        />

        <Banner
        variant='system'
          status="neutral"
          icon="medication"
          title={l('onboarding.medNote', 'Medications can significantly accelerate your results. Every pound lost is a win!')}
        />
        </Stack>

                <ButtonContainer align="end" fillButtons>
          {onBack && (
            <IconButton variant="secondary" icon="arrow_back" size="lg" onClick={onBack}>
              {l('common.back', 'Back')}
            </IconButton>
          )}
          <Button variant="primary" size="lg" onClick={onDone}>
            Go to tracker
          </Button>
        </ButtonContainer>

      </Section>
    </>
  );
}
