import { useState } from 'react';
import {
  Stack, Button, ButtonContainer, FieldRow, NumberField, Calendar,
  Heading, Paragraph, Section, StepTracker, Banner,
} from '@gtivr4/a1-design-system-react';
import { useLabel } from '@gtivr4/a1-design-system-react';

const signInLinkStyle = {
  background: 'none', border: 'none', padding: '0 0 0 4px',
  color: 'var(--semantic-color-action-background)',
  cursor: 'pointer', fontSize: 'inherit', textDecoration: 'underline',
  fontFamily: 'inherit',
};

export function Step1AboutYou({
  form, set, errors,
  showStartDatePicker, setShowStartDatePicker,
  today, startDateObj, startDateLabel,
  onContinue, currentStep, totalSteps,
  onSignIn,
}) {
  const l = useLabel;
  // Only show the gain-vs-loss warning after the user has tabbed out of both fields.
  const [blurred, setBlurred] = useState({ startWeight: false, goalWeight: false });

  const goalAboveStart = form.goalWeight && form.startWeight && Number(form.goalWeight) > Number(form.startWeight);
  const showGainAlert = goalAboveStart && blurred.startWeight && blurred.goalWeight;

  return (
    <Section padding="md" contentWidth="xs" align="center" gap="xl">
      <Heading type="display" size="jumbo" as="h1" align="center">
        Set your start
      </Heading>
      <FieldRow style={{ width: '100%' }}>
        <NumberField
          className='boldInput'
          label={l('onboarding.startWeight', 'Current Weight')}
          value={form.startWeight}
          onChange={ev => set('startWeight', ev.target.value)}
          onBlur={() => setBlurred(b => ({ ...b, startWeight: true }))}
          min={20} max={700} step={0.5}
          suffix={form.weightUnit}
          inputMode="decimal"
          size="comfortable"
          error={errors.startWeight}
          unit="lbs"
        />
        <NumberField
          className='boldInput'
          label={l('onboarding.goalWeight', 'Goal Weight')}
          value={form.goalWeight}
          onChange={ev => set('goalWeight', ev.target.value)}
          onBlur={() => setBlurred(b => ({ ...b, goalWeight: true }))}
          min={50} max={700} step={0.5}
          suffix={form.weightUnit}
          inputMode="decimal"
          size="comfortable"
          error={errors.goalWeight}
          unit="lbs"
        />
      </FieldRow>

      {showGainAlert && (
        <Banner
          variant="system"
          status="warn"
          icon="info"
          title={l('onboarding.goalHigherWarning', 'Your goal is higher than your start weight. This app is optimised for weight loss.')}
        />
      )}

      <Stack gap="md" style={{ width: '100%' }}>
        <Stack direction="row" align="center" justify="between">
          <Stack gap="none">
            <Heading size="xs" color="muted">
              {l('onboarding.startDate', 'Start Date')}
            </Heading>
            <Paragraph size="lg">{startDateLabel}</Paragraph>
          </Stack>
          <Button
            variant="tertiary"
            size="sm"
            icon={showStartDatePicker ? 'close' : 'calendar_today'}
            onClick={() => setShowStartDatePicker(v => !v)}
          >
            {showStartDatePicker
              ? l('common.close', 'Close')
              : l('onboarding.changeDate', 'Change Date')}
          </Button>
        </Stack>
        {showStartDatePicker && (
          <Calendar
            variant="paginated"
            selectable
            todayButton
            highlightToday
            dimPast={false}
            maxDate={today}
            selectedDate={startDateObj}
            onChange={date => {
              set('startDate', date.toISOString());
              setShowStartDatePicker(false);
            }}
          />
        )}
      </Stack>

      <Stack gap="sm" style={{ width: '100%' }}>
        <StepTracker steps={totalSteps} currentStep={currentStep} align="center" />
        <ButtonContainer size="lg" fillButtons>
          <Button variant="primary" onClick={onContinue} style={{ flex: '1 1 auto', minWidth: 0 }}>
            Let's get going!
          </Button>
        </ButtonContainer>
        {onSignIn && (
          <Paragraph size="sm" align="center" color="muted">
            Already have an account?
            <button style={signInLinkStyle} type="button" onClick={onSignIn}>
              Sign in
            </button>
          </Paragraph>
        )}
      </Stack>
    </Section>
  );
}
