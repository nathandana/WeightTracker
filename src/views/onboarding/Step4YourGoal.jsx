import {
  Stack, Button, ButtonContainer, IconButton, ChoiceGroup, Calendar,
  Heading, Paragraph, Section, StepTracker, StickyActions,
} from '@gtivr4/a1-design-system-react';
import { useLabel } from '@gtivr4/a1-design-system-react';
import { TIMELINE_PRESETS, getTimelineSubtext, presetDate, formatDate } from './onboardingConfig.js';

export function Step4YourGoal({
  form, set, errors,
  showGoalDatePicker, setShowGoalDatePicker,
  activeTimeline, goalDateObj, minGoalDateObj,
  onBack, onContinue, currentStep, totalSteps,
}) {
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
          Pick your pace
        </Heading>
        <Stack gap="lg" style={{ width: '100%' }}>
          <Paragraph color="muted">
            {l('onboarding.step3Sub', 'What does success look like for you?')}
          </Paragraph>
          <ChoiceGroup
            size="comfortable"
            label={l('onboarding.quickTimelines', 'Quick timelines')}
            options={TIMELINE_PRESETS.map(p => {
              const weightToLose = Number(form.startWeight) - Number(form.goalWeight);
              const hasMeds = form.meds?.length > 0;
              const subtext = getTimelineSubtext(p.months, weightToLose, form.activityLevel, form.weightUnit, hasMeds);
              return { value: p.value, label: p.label, subtext, icon: p.icon };
            })}
            columns={2}
            value={activeTimeline}
            onChange={v => {
              const preset = TIMELINE_PRESETS.find(p => p.value === v);
              if (preset) {
                set('goalDate', presetDate(preset.months));
                setShowGoalDatePicker(false);
              }
            }}
          />
          <Stack gap="sm">
            <Stack direction="row" align="center" justify="between">
              <Stack gap="none">
                <Heading size="xs">
                  {l('onboarding.targetDate', 'Target Date')}
                </Heading>
                {form.goalDate && (
                  <Paragraph size="lg">{formatDate(form.goalDate)}</Paragraph>
                )}
              </Stack>
              <Button
                variant="tertiary"
                size="sm"
                icon={showGoalDatePicker ? 'close' : 'calendar_today'}
                onClick={() => setShowGoalDatePicker(v => !v)}
              >
                {showGoalDatePicker
                  ? l('common.close', 'Close')
                  : form.goalDate
                    ? l('onboarding.changeDate', 'Change')
                    : l('onboarding.chooseDate', 'Choose')}
              </Button>
            </Stack>
            {showGoalDatePicker && (
              <Calendar
                key={form.goalDate ?? 'empty'}
                variant="paginated"
                selectable
                highlightToday
                initialMonth={goalDateObj ?? minGoalDateObj}
                minDate={minGoalDateObj}
                selectedDate={goalDateObj}
                onChange={date => {
                  set('goalDate', date.toISOString().split('T')[0]);
                  setShowGoalDatePicker(false);
                }}
              />
            )}
            {errors.goalDate && (
              <Paragraph size="sm" style={{ color: 'var(--semantic-color-status-error-text)' }}>
                {errors.goalDate}
              </Paragraph>
            )}
          </Stack>
        </Stack>
      </Section>

      <StickyActions contentWidth="xs">
        <StepTracker steps={totalSteps} currentStep={currentStep} align="center" />
        <ButtonContainer size="lg" fillButtons>
          <IconButton icon="arrow_back" label="Back" variant="secondary" size="lg" onClick={onBack} />
          <Button variant="primary" onClick={onContinue}>
            Next... the plan
          </Button>
        </ButtonContainer>
      </StickyActions>
    </>
  );
}
