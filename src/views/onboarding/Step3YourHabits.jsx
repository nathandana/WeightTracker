import {
  Stack, Button, ButtonContainer, IconButton, ChoiceGroup, TextField,
  Heading, Section, StepTracker, Divider,
} from '@gtivr4/a1-design-system-react';
import { useLabel } from '@gtivr4/a1-design-system-react';
import { ACTIVITY_OPTIONS, CALORIE_OPTIONS, MED_OPTIONS } from './onboardingConfig.js';

export function Step3YourHabits({ form, set, onBack, onContinue, currentStep, totalSteps }) {
  const l = useLabel;

  return (
    <Section padding="md" contentWidth="xs" align="center" gap="lg">
      <Heading type="display" size="jumbo" as="h1" align="center">
        How do you move?
      </Heading>
      <Stack gap="lg" style={{ width: '100%' }}>
        <ChoiceGroup
          label={l('onboarding.activityLevel', 'Activity Level')}
          options={ACTIVITY_OPTIONS(l)}
          columns={2}
          value={form.activityLevel}
          size='comfortable'
          onChange={v => set('activityLevel', v)}
        />
        <ChoiceGroup
          label={l('onboarding.dailyCalories', 'Estimated Daily Calories')}
          hint={l('onboarding.dailyCalHint', 'Your typical daily food intake')}
          options={CALORIE_OPTIONS}
          columns={2}
          value={form.dailyCalories}
          size='comfortable'
          onChange={v => set('dailyCalories', v)}
        />
        <Stack gap="md">
          <ChoiceGroup
            label={l('onboarding.meds', 'Weight Loss Medications')}
            hint={l('onboarding.medsHint', "Select any you're currently taking")}
            options={MED_OPTIONS(l)}
            columns={2}
            multiple
          size='comfortable'
            value={form.meds}
            onChange={v => set('meds', v)}
          />
          {form.meds.includes('other') && (
            <TextField
              label={l('onboarding.otherMed', 'Medication Name')}
              placeholder={l('onboarding.otherMedPlaceholder', 'Enter medication name')}
              value={form.otherMed}
              size="comfortable"
              onChange={ev => set('otherMed', ev.target.value)}
            />
          )}
        </Stack>
      </Stack>

      <Divider size="md" color="accent" />

      <StepTracker steps={totalSteps} currentStep={currentStep} align="center" />

      <ButtonContainer size="lg" fillButtons>
        <IconButton icon="arrow_back" variant="secondary" size="lg" onClick={onBack} />
        <Button variant="primary" onClick={onContinue} style={{ flex: '1 1 auto', minWidth: 0 }}>
          Next... your goal
        </Button>
      </ButtonContainer>
    </Section>
  );
}
