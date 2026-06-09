import { useState } from 'react';
import {
  Stack, Heading, Paragraph, Card, Inset, Button, Section, Grid,
  ChoiceGroup, Divider, Banner,
  ButtonContainer,
} from '@gtivr4/a1-design-system-react';
import { useLabel } from '@gtivr4/a1-design-system-react';
import { calculateGoalPlan } from '../utils/calculations.js';

function InfoRow({ label, value }) {
  return (
    <Stack direction='column' gap="sm">

      <Stack direction="row" justify='between' gap="md">
      <div><Paragraph color="muted" size="sm">{label}</Paragraph></div>
      <div><Paragraph size="md" align="right"><strong>{value}</strong></Paragraph></div>
    </Stack>
    <Divider></Divider>
    </Stack>
  );
}

export function Profile({ store }) {
  const l = useLabel;
  const { profile, locale, setLocale, reset } = store;
  const [confirmReset, setConfirmReset] = useState(false);

  if (!profile) return null;

  const plan = (() => { try { return calculateGoalPlan(profile); } catch { return null; } })();

  const medLabels = {
    semaglutide: 'Semaglutide (Ozempic / Wegovy)',
    tirzepatide: 'Tirzepatide (Mounjaro / Zepbound)',
    other: l('onboarding.medOther', 'Other'),
  };
  const meds = profile.meds?.map(m => medLabels[m] ?? m).join(', ')
    || l('onboarding.medNone', 'None');
  const goalDateStr = profile.goalDate
    ? new Date(profile.goalDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <>
      {confirmReset && (
        <Banner
          variant="system"
          status="error"
          title={l('profile.resetConfirm', 'This will delete all your data. Are you sure?')}
          onDismiss={() => setConfirmReset(false)}
          action={
            <Button variant="secondary" onClick={reset}>
              Yes, reset everything
            </Button>
          }
        />
      )}
      <Section contentWidth="lg" padding='sm' gap="lg">
        <Stack justify="between" direction='row' wrap>
          <Heading size="xl" type='display'>{l('profile.title', 'My Profile')}</Heading>
          {!confirmReset && (
            <Button variant="tertiary" icon="delete_forever" onClick={() => setConfirmReset(true)}>
              {l('profile.resetData', 'Reset All Data')}
            </Button>
          )}
        </Stack>
        <Grid columns={{ xs: 1, sm: 2, lg: 3 }} gap="md">
          <Card icon="language">
            <Heading as="h3" size="sm">{l('profile.language', 'Language')}</Heading>
            <ChoiceGroup
              options={[
                { value: 'en', label: l('profile.langEn', 'English') },
                { value: 'es', label: l('profile.langEs', 'Español') },
              ]}
              columns={1}
              value={locale}
              onChange={setLocale}
            />
          </Card>
          <Card icon="person">
            <Heading as="h3" size="sm">Your Info</Heading>
            <InfoRow label="Starting Weight" value={`${profile.startWeight} ${profile.weightUnit}`} />
            <InfoRow
              label="Height"
              value={profile.heightUnit === 'cm' ? `${profile.height} cm` : `${profile.heightFeet}' ${profile.heightInches || 0}"`}
            />
            <InfoRow label="Age" value={profile.age} />
            <InfoRow label="Sex" value={profile.sex === 'male' ? l('onboarding.sexMale', 'Male') : l('onboarding.sexFemale', 'Female')} />
            <InfoRow label="Activity Level" value={profile.activityLevel} />
            <InfoRow label={l('profile.meds', 'Medications')} value={meds} />
          </Card>

          <Card icon="flag">
            <Heading as="h3" size="sm">Your Goal</Heading>
            <InfoRow label={l('onboarding.goalWeight', 'Goal Weight')} value={`${profile.goalWeight} ${profile.weightUnit}`} />
            <InfoRow label={l('profile.goalDate', 'Goal Date')} value={goalDateStr} />
            {plan && (
              <>
                <InfoRow label={l('profile.bmi', 'BMI')} value={`${plan.bmi?.value} (${l(`bmiCategory.${plan.bmi?.category}`, plan.bmi?.category)})`} />
                <InfoRow label={l('profile.tdee', 'Daily Calorie Budget')} value={`${plan.targetDailyCalories.toLocaleString()} cal`} />
                <InfoRow label="Weekly Loss Est." value={`${plan.weeklyLoss} ${profile.weightUnit}`} />
              </>
            )}
          </Card>
        </Grid>
      </Section>
    </>
  );
}
