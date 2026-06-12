import { useState } from 'react';
import {
  Stack, Button, ButtonContainer, FieldRow, NumberField, Calendar,
  Heading, Paragraph, Section, StepTracker, Banner, StickyActions, Link,
} from '@gtivr4/a1-design-system-react';
import { useLabel } from '@gtivr4/a1-design-system-react';

export function Step1AboutYou({
  form, set, errors,
  showStartDatePicker, setShowStartDatePicker,
  today, startDateObj, startDateLabel,
  onContinue, currentStep, totalSteps,
  onSignIn,
}) {
  const l = useLabel;
  const [blurred, setBlurred] = useState({ startWeight: false, goalWeight: false });

  const goalAboveStart = form.goalWeight && form.startWeight && Number(form.goalWeight) > Number(form.startWeight);
  const showGainAlert = goalAboveStart && blurred.startWeight && blurred.goalWeight;

  return (
    <>
      <Section padding="xs" contentWidth="xs" gap="lg">
        <Stack gap="xs">
          <Heading type="display" size="jumbo" as="h1" align="center">
            {l('onboarding.s1Heading', 'Set your start')}
          </Heading>
          {onSignIn && (
            <Paragraph size="lg" align="center" color="muted">
              {l('onboarding.alreadyHaveAccount', 'Already have an account?')}{' '}
              <Link href="#" weight='bold' onClick={(e) => { e.preventDefault(); onSignIn(); }}>
                {l('onboarding.signIn', 'Sign in')}
              </Link>
            </Paragraph>
          )}
        </Stack>
        <FieldRow>
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

          <Stack direction="row" align='baseline' wrap gap="sm">
              <Heading size="xs" color="muted">
                {l('onboarding.startDate', 'Start Date')}
              </Heading>
              <Heading size="md">{startDateLabel}</Heading>
            <Button
              variant="secondary"
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
      </Section>

      <StickyActions contentWidth="xs">
        <StepTracker steps={totalSteps} currentStep={currentStep} align="center" />
        <ButtonContainer size="lg" fillButtons>
          <Button variant="primary" onClick={onContinue}>
            {l('onboarding.letsGo', "Let's get going!")}
          </Button>
        </ButtonContainer>
      </StickyActions>
    </>
  );
}
