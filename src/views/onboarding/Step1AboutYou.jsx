import {
  Stack, Button, ButtonContainer, NumberField, Calendar,
  Heading, Paragraph, Section, StepTracker, Divider,
} from '@gtivr4/a1-design-system-react';
import { useLabel } from '@gtivr4/a1-design-system-react';

export function Step1AboutYou({
  form, set, errors,
  showStartDatePicker, setShowStartDatePicker,
  today, startDateObj, startDateLabel,
  onContinue, currentStep, totalSteps,
}) {
  const l = useLabel;

  return (
    <Section padding="md" contentWidth="xs" align="center" gap="lg">
      <Heading type="display" size="jumbo" as="h1" align="center">
        Set your start
      </Heading>
      <Stack gap="xl" style={{ width: '100%' }}>
        <NumberField
          label={l('onboarding.startWeight', 'Current Weight')}
          value={form.startWeight}
          onChange={ev => set('startWeight', ev.target.value)}
          min={50} max={700} step={0.5}
          suffix={form.weightUnit}
          inputMode="decimal"
          size="comfortable"
          error={errors.startWeight}
          unit="lbs"
        />
        <NumberField
          label={l('onboarding.goalWeight', 'Goal Weight')}
          value={form.goalWeight}
          onChange={ev => set('goalWeight', ev.target.value)}
          min={50} max={700} step={0.5}
          suffix={form.weightUnit}
          inputMode="decimal"
          size="comfortable"
          error={errors.goalWeight}
          unit="lbs"
        />
        <Stack gap="sm">
          <Stack direction="row" align="center" justify="between">
            <Stack gap="none">
              <Heading size="xs">
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
                : l('onboarding.changeDate', 'Change')}
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
      </Stack>

      <Divider size="md" color="accent" />

      <StepTracker steps={totalSteps} currentStep={currentStep} align="center" />

      <ButtonContainer size="lg" fillButtons>
        <Button variant="primary" onClick={onContinue} style={{ flex: '1 1 auto', minWidth: 0 }}>
          Let's get going!
        </Button>
      </ButtonContainer>
    </Section>
  );
}
