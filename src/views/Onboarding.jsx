import { useState } from 'react';
import {
  Stack, Button, ButtonContainer, Paragraph, Heading,
  TextField, NumberField, ChoiceGroup,
  FieldRow, Section, SegmentedControl, Calendar,
} from '@gtivr4/a1-design-system-react';
import { useLabel } from '@gtivr4/a1-design-system-react';
import { lbsToKg, kgToLbs, feetInchesToCm, cmToFeetInches } from '../utils/calculations.js';

const TOTAL_STEPS = 4;
const STEP_TITLES = ['About You', 'Your Body', 'Your Habits', 'Your Goal'];

const ACTIVITY_OPTIONS = (l) => [
  { value: 'sedentary', label: l('onboarding.activitySedentary'), subtext: l('onboarding.activitySedentarySub') },
  { value: 'light',     label: l('onboarding.activityLight'),     subtext: l('onboarding.activityLightSub') },
  { value: 'moderate',  label: l('onboarding.activityModerate'),  subtext: l('onboarding.activityModerateSub') },
  { value: 'active',    label: l('onboarding.activityActive'),    subtext: l('onboarding.activityActiveSub') },
];

const MED_OPTIONS = (l) => [
  { value: 'semaglutide', label: 'Semaglutide', subtext: 'Ozempic / Wegovy' },
  { value: 'tirzepatide', label: 'Tirzepatide', subtext: 'Mounjaro / Zepbound' },
  { value: 'other',       label: l('onboarding.medOther', 'Other') },
];

const CALORIE_OPTIONS = [
  { value: '1200', label: '< 1,500 cal' },
  { value: '1750', label: '1,500 – 2,000 cal' },
  { value: '2250', label: '2,000 – 2,500 cal' },
  { value: '2750', label: '2,500+ cal' },
];

const TIMELINE_PRESETS = [
  { value: '3mo',  label: '3 months',  months: 3 },
  { value: '6mo',  label: '6 months',  months: 6 },
  { value: '1yr',  label: '1 year',    months: 12 },
  { value: '18mo', label: '18 months', months: 18 },
];

function presetDate(months) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function missing(val) {
  return !val || Number(val) <= 0;
}

// Handles both full ISO strings and date-only YYYY-MM-DD strings safely
function formatDate(iso) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso)
    ? new Date(iso + 'T12:00:00')
    : new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function Onboarding({ onComplete }) {
  const l = useLabel;

  const [step, setStep] = useState(1);
  const [attempted, setAttempted] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showGoalDatePicker, setShowGoalDatePicker] = useState(false);
  const [form, setForm] = useState({
    name: '',
    weightUnit: 'lbs',
    heightUnit: 'imperial',
    startWeight: '',
    heightFeet: '',
    heightInches: '',
    height: '',
    age: '',
    sex: 'female',
    activityLevel: 'moderate',
    dailyCalories: '1750',
    meds: [],
    otherMed: '',
    goalWeight: '',
    goalDate: '',
    startDate: null,
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const units = form.weightUnit === 'kg' ? 'metric' : 'imperial';

  function handleUnitChange(newSystem) {
    if (newSystem === 'metric') {
      const kg     = form.startWeight ? String(Math.round(lbsToKg(Number(form.startWeight)) * 10) / 10) : '';
      const goalKg = form.goalWeight  ? String(Math.round(lbsToKg(Number(form.goalWeight))  * 10) / 10) : '';
      const cm     = (form.heightFeet || form.heightInches)
        ? String(Math.round(feetInchesToCm(Number(form.heightFeet) || 0, Number(form.heightInches) || 0)))
        : '';
      setForm(f => ({ ...f, weightUnit: 'kg', heightUnit: 'cm', startWeight: kg, goalWeight: goalKg, height: cm }));
    } else {
      const lbs     = form.startWeight ? String(Math.round(kgToLbs(Number(form.startWeight)) * 10) / 10) : '';
      const goalLbs = form.goalWeight  ? String(Math.round(kgToLbs(Number(form.goalWeight))  * 10) / 10) : '';
      const { feet, inches } = form.height
        ? cmToFeetInches(Number(form.height))
        : { feet: '', inches: '' };
      setForm(f => ({
        ...f, weightUnit: 'lbs', heightUnit: 'imperial',
        startWeight: lbs, goalWeight: goalLbs,
        heightFeet: String(feet || ''), heightInches: String(inches || ''),
      }));
    }
  }

  function isStepValid() {
    if (step === 1) return !missing(form.startWeight) && !missing(form.goalWeight);
    if (step === 2) {
      const heightOk = units === 'metric' ? !missing(form.height) : !missing(form.heightFeet);
      return heightOk && !missing(form.age);
    }
    if (step === 4) return !!form.goalDate;
    return true;
  }

  function handleContinue() {
    if (isStepValid()) {
      setAttempted(false);
      setStep(s => s + 1);
    } else {
      setAttempted(true);
    }
  }

  function handleBack() {
    setAttempted(false);
    setStep(s => s - 1);
  }

  function handleFinishAttempt() {
    if (isStepValid()) {
      onComplete({
        ...form,
        startDate: form.startDate || new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    } else {
      setAttempted(true);
    }
  }

  const e = attempted ? {
    startWeight: missing(form.startWeight) ? l('validation.enterWeight', 'Enter your current weight to continue') : null,
    goalWeight:  missing(form.goalWeight)  ? l('validation.enterGoal',   'Enter your goal weight to continue')    : null,
    heightFeet:  (units === 'imperial' && missing(form.heightFeet)) ? l('validation.enterFeet',   'Enter your height in feet')         : null,
    height:      (units === 'metric'   && missing(form.height))     ? l('validation.enterHeight', 'Enter your height to continue')     : null,
    age:         missing(form.age) ? l('validation.enterAge', 'Enter your age to continue') : null,
    goalDate:    !form.goalDate    ? l('validation.selectDate', 'Select a target date to continue') : null,
  } : {};

  const minGoalDateStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  })();
  const minGoalDateObj = new Date(minGoalDateStr + 'T12:00:00');

  const activeTimeline = TIMELINE_PRESETS.find(p => presetDate(p.months) === form.goalDate)?.value ?? null;
  const today = new Date();
  const startDateObj = form.startDate ? new Date(form.startDate) : null;
  const startDateLabel = form.startDate ? formatDate(form.startDate) : l('onboarding.startDateToday', 'Today');
  const goalDateObj = form.goalDate ? new Date(form.goalDate + 'T12:00:00') : null;

  return (
    <>
      {step === 1 && (
        <Section padding="sm" contentWidth="md" align="center" gap="md" surface="raised">
          <Heading type="display" size="xxl" as="h1" align="center">
            {l('app.name', 'DownTrack')}
          </Heading>
          <Paragraph size="lg" color="muted" align="center">
            {l('onboarding.intro', 'A lightweight, free app to track your weight loss journey.')}
          </Paragraph>
        </Section>
      )}

      <Section padding="sm" contentWidth="xs" gap="lg">
        <Heading type="display" size="lg" as="h2">
          {STEP_TITLES[step - 1]}
        </Heading>

        {/* Step 1: About You */}
        {step === 1 && (
          <Stack gap="lg">
            <SegmentedControl
              aria-label={l('onboarding.unitSystem', 'Units')}
              options={[
                { value: 'imperial', label: l('onboarding.imperial', 'Imperial'), icon: 'straighten' },
                { value: 'metric',   label: l('onboarding.metric',   'Metric'),   icon: 'science' },
              ]}
              value={units}
              onChange={handleUnitChange}
              style={{ width: 'fit-content' }}
            />
            <TextField
              label={l('onboarding.name', 'Name')}
              placeholder={l('onboarding.namePlaceholder', 'What should we call you?')}
              autoComplete="given-name"
              value={form.name}
              size="comfortable"
              onChange={ev => set('name', ev.target.value)}
            />
            <NumberField
              label={l('onboarding.startWeight', 'Current Weight')}
              value={form.startWeight}
              onChange={ev => set('startWeight', ev.target.value)}
              min={50} max={700} step={0.5}
              suffix={form.weightUnit}
              inputMode="decimal"
              size="comfortable"
              required
              error={e.startWeight}
            />
            <NumberField
              label={l('onboarding.goalWeight', 'Goal Weight')}
              value={form.goalWeight}
              onChange={ev => set('goalWeight', ev.target.value)}
              min={50} max={700} step={0.5}
              suffix={form.weightUnit}
              inputMode="decimal"
              size="comfortable"
              required
              error={e.goalWeight}
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
        )}

        {/* Step 2: Your Body */}
        {step === 2 && (
          <Stack gap="lg">
            {units === 'imperial' ? (
              <FieldRow>
                <NumberField
                  label={l('onboarding.heightFeet', 'Feet')}
                  value={form.heightFeet}
                  onChange={ev => set('heightFeet', ev.target.value)}
                  min={3} max={8} step={1} suffix="ft"
                  inputMode="numeric"
                  size="comfortable"
                  required
                  error={e.heightFeet}
                />
                <NumberField
                  label={l('onboarding.heightInches', 'Inches')}
                  value={form.heightInches}
                  onChange={ev => set('heightInches', ev.target.value)}
                  min={0} max={11} step={1} suffix="in"
                  inputMode="numeric"
                  size="comfortable"
                />
              </FieldRow>
            ) : (
              <NumberField
                label={l('onboarding.heightCm', 'Height (cm)')}
                value={form.height}
                onChange={ev => set('height', ev.target.value)}
                min={100} max={250} step={1} suffix="cm"
                inputMode="decimal"
                size="comfortable"
                required
                error={e.height}
              />
            )}
            <NumberField
              label={l('onboarding.age', 'Age')}
              value={form.age}
              onChange={ev => set('age', ev.target.value)}
              min={13} max={120} step={1}
              inputMode="numeric"
              size="comfortable"
              required
              error={e.age}
            />
            <ChoiceGroup
              label={l('onboarding.sex', 'Biological Sex')}
              options={[
                { value: 'female', label: l('onboarding.sexFemale', 'Female') },
                { value: 'male',   label: l('onboarding.sexMale', 'Male') },
              ]}
              columns={2}
              value={form.sex}
              onChange={v => set('sex', v)}
            />
          </Stack>
        )}

        {/* Step 3: Your Habits */}
        {step === 3 && (
          <Stack gap="lg">
            <ChoiceGroup
              label={l('onboarding.activityLevel', 'Activity Level')}
              options={ACTIVITY_OPTIONS(l)}
              columns={2}
              value={form.activityLevel}
              onChange={v => set('activityLevel', v)}
            />
            <ChoiceGroup
              label={l('onboarding.dailyCalories', 'Estimated Daily Calories')}
              hint={l('onboarding.dailyCalHint', 'Your typical daily food intake')}
              options={CALORIE_OPTIONS}
              columns={2}
              value={form.dailyCalories}
              onChange={v => set('dailyCalories', v)}
            />
            <Stack gap="md">
              <ChoiceGroup
                label={l('onboarding.meds', 'Weight Loss Medications')}
                hint={l('onboarding.medsHint', "Select any you're currently taking")}
                options={MED_OPTIONS(l)}
                columns={2}
                multiple
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
        )}

        {/* Step 4: Your Goal */}
        {step === 4 && (
          <Stack gap="lg">
            <Paragraph color="muted">
              {l('onboarding.step3Sub', 'What does success look like for you?')}
            </Paragraph>
            <ChoiceGroup
              size="comfortable"
              label={l('onboarding.quickTimelines', 'Quick timelines')}
              options={TIMELINE_PRESETS.map(p => ({ value: p.value, label: p.label }))}
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
                  variant="paginated"
                  selectable
                  highlightToday
                  minDate={minGoalDateObj}
                  selectedDate={goalDateObj}
                  onChange={date => {
                    set('goalDate', date.toISOString().split('T')[0]);
                    setShowGoalDatePicker(false);
                  }}
                />
              )}
              {e.goalDate && (
                <Paragraph size="sm" style={{ color: 'var(--semantic-color-status-error-text)' }}>
                  {e.goalDate}
                </Paragraph>
              )}
            </Stack>
          </Stack>
        )}

        <ButtonContainer align="end">
          {step > 1 && (
            <Button variant="tertiary" onClick={handleBack} size="lg">
              {l('common.back', 'Back')}
            </Button>
          )}
          {step < TOTAL_STEPS ? (
            <Button variant="primary" size="lg" onClick={handleContinue}>
              {l('common.continue', 'Continue')}
            </Button>
          ) : (
            <Button variant="success" onClick={handleFinishAttempt} size="lg">
              {l('onboarding.startJourney', 'Start My Journey!')}
            </Button>
          )}
        </ButtonContainer>
      </Section>
    </>
  );
}
