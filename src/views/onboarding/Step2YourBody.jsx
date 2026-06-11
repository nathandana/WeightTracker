import {
  Button, ButtonContainer, IconButton, NumberField, ChoiceGroup,
  FieldRow, Heading, Section, StepTracker, StickyActions,
} from '@gtivr4/a1-design-system-react';
import { useLabel } from '@gtivr4/a1-design-system-react';

export function Step2YourBody({ form, set, errors, units, onBack, onContinue, currentStep, totalSteps }) {
  const l = useLabel;

  return (
    <>
      <Section
        padding="md"
        contentWidth="xs"
        align="center"
        gap="lg"
        style={{ paddingBlockEnd: 'calc(var(--base-spacing-64) + var(--base-spacing-96))' }}
      >
        <Heading type="display" size="jumbo" as="h1" align="center">
          A few quick details
        </Heading>
        <FieldRow style={{ width: '100%' }}>
          <NumberField
            className='boldInput'
            label={l('onboarding.heightFeet', 'Feet')}
            value={form.heightFeet}
            onChange={ev => set('heightFeet', ev.target.value)}
            min={3} max={8} step={1} suffix="ft"
            inputMode="numeric"
            size="comfortable"
            error={errors.heightFeet}
            unit="ft"
          />
          <NumberField
            className='boldInput'
            label={l('onboarding.heightInches', 'Inches')}
            value={form.heightInches}
            onChange={ev => set('heightInches', ev.target.value)}
            min={0} max={11} step={1} suffix="in"
            inputMode="numeric"
            size="comfortable"
            error={errors.heightInches}
            unit="in"
          />
        </FieldRow>
        <NumberField
          className='boldInput'
          label={l('onboarding.age', 'Age')}
          value={form.age}
          onChange={ev => set('age', ev.target.value)}
          min={13} max={120} step={1}
          inputMode="numeric"
          size="comfortable"
          error={errors.age}
          unit="years"
        />
        <ChoiceGroup
          label={l('onboarding.sex', 'Biological Sex')}
          options={[
            { value: 'female', label: l('onboarding.sexFemale', 'Female') },
            { value: 'male',   label: l('onboarding.sexMale', 'Male') },
          ]}
          size='comfortable'
          columns={2}
          value={form.sex}
          onChange={v => set('sex', v)}
        />
      </Section>

      <StickyActions contentWidth="xs">
        <StepTracker steps={totalSteps} currentStep={currentStep} align="center" />
        <ButtonContainer size="lg" fillButtons>
          <IconButton icon="arrow_back" label="Back" variant="secondary" size="lg" onClick={onBack} />
          <Button variant="primary" onClick={onContinue}>
            Next... your activity
          </Button>
        </ButtonContainer>
      </StickyActions>
    </>
  );
}
