import { useState } from 'react';
import {
  Stack, Button, ButtonContainer, Paragraph,
  TextField, NumberField, DateField, ChoiceGroup, RadioGroup, FieldRow,
  Inset, Dialog,
  Divider,
} from '@gtivr4/a1-design-system-react';
import { useLabel } from '@gtivr4/a1-design-system-react';

const TOTAL_STEPS = 3;

const STEP_TITLES = ['About You', 'Your Habits', 'Your Goal'];

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

export function Onboarding({ onComplete }) {
  const l = useLabel;

  const [step, setStep] = useState(1);
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
    goalWeight: '',
    goalDate: '',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  function canAdvance() {
    if (step === 1) {
      const weightOk = form.startWeight && Number(form.startWeight) > 0;
      const heightOk = form.heightUnit === 'cm'
        ? form.height && Number(form.height) > 0
        : form.heightFeet && Number(form.heightFeet) > 0;
      const ageOk = form.age && Number(form.age) > 0;
      return weightOk && heightOk && ageOk;
    }
    if (step === 3) {
      return form.goalWeight && Number(form.goalWeight) > 0 && form.goalDate;
    }
    return true;
  }

  function handleFinish() {
    onComplete({ ...form, startDate: new Date().toISOString(), createdAt: new Date().toISOString() });
  }

  const minGoalDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  })();

  const activeTimeline = TIMELINE_PRESETS.find(p => presetDate(p.months) === form.goalDate)?.value ?? null;

  const footer = (
    <ButtonContainer
  align="end"
 >
        {step < TOTAL_STEPS ? (
          <Button variant="primary" disabled={!canAdvance()} onClick={() => setStep(s => s + 1)}>
            {l('common.continue', 'Continue')}
          </Button>
        ) : (
          <Button variant="success" disabled={!canAdvance()} onClick={handleFinish}>
            {l('onboarding.startJourney', 'Start My Journey!')}
          </Button>
        )}
        {step > 1 && (
          <Button variant="tertiary" onClick={() => setStep(s => s - 1)}>
            {l('common.back', 'Back')}
          </Button>
        )}
    </ButtonContainer>
  );

  return (
    <div className="jc-onboarding-wrap">
      <Dialog open={true} onClose={() => {}} title={STEP_TITLES[step - 1]} footer={footer}>

        <Inset space={4}>
          <Stack gap={24}>

            {/* ── Step 1: About You ──────────────────────────────── */}
            {step === 1 && (
              <Stack gap="lg">

                <TextField
                  label={l('onboarding.name', 'First Name')}
                  placeholder={l('onboarding.namePlaceholder', 'What should we call you?')}
                  autoComplete="given-name"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  
                />

                {/* Weight + unit in a row */}
                <FieldRow>
                  <NumberField
                    label={l('onboarding.startWeight', 'Current Weight')}
                    value={form.startWeight}
                    onChange={e => set('startWeight', e.target.value)}
                    min={50} max={700} step={0.5}
                    suffix={form.weightUnit}
                    inputMode="decimal"
                    required
                  />
                  <RadioGroup
                    label={l('onboarding.weightUnit', 'Weight unit')}
                    inline
                    options={[{ value: 'lbs', label: 'lbs' }, { value: 'kg', label: 'kg' }]}
                    value={form.weightUnit}
                    onChange={v => set('weightUnit', v)}
                  />
                </FieldRow>
<Divider
    decorative
    orientation="horizontal"
    size="sm"
    
    variant="accent"
  />
                {/* Height + unit in a row */}
                <FieldRow>
                  {form.heightUnit === 'imperial' ? (
                    <FieldRow>
                      <NumberField
                        label={l('onboarding.heightFeet', 'Feet')}
                        value={form.heightFeet}
                        onChange={e => set('heightFeet', e.target.value)}
                        min={3} max={8} step={1} suffix="ft"
                        inputMode="numeric"
                        required
                        
                      />
                      <NumberField
                        label={l('onboarding.heightInches', 'Inches')}
                        value={form.heightInches}
                        onChange={e => set('heightInches', e.target.value)}
                        min={0} max={11} step={1} suffix="in"
                        inputMode="numeric"
                        required
                      />
                    </FieldRow>
                  ) : (
                    <NumberField
                      label={l('onboarding.heightCm', 'Height (cm)')}
                      value={form.height}
                      onChange={e => set('height', e.target.value)}
                      min={100} max={250} step={1} suffix="cm"
                      inputMode="decimal"
                      required
                    />
                  )}
                  <RadioGroup
                    label={l('onboarding.heightUnit', 'Height unit')}
                    inline
                    options={[{ value: 'imperial', label: 'ft / in' }, { value: 'cm', label: 'cm' }]}
                    value={form.heightUnit}
                    onChange={v => set('heightUnit', v)}
                  />
                </FieldRow>

                <NumberField
                  label={l('onboarding.age', 'Age')}
                  value={form.age}
                  onChange={e => set('age', e.target.value)}
                  min={13} max={120} step={1}
                  inputMode="numeric"
                  required
                />

                <RadioGroup
                  label={l('onboarding.sex', 'Biological Sex')}
                  inline
                  options={[
                    { value: 'female', label: l('onboarding.sexFemale', 'Female') },
                    { value: 'male',   label: l('onboarding.sexMale', 'Male') },
                  ]}
                  value={form.sex}
                  onChange={v => set('sex', v)}
                />
              </Stack>
            )}

            {/* ── Step 2: Your Habits ────────────────────────────── */}
            {step === 2 && (
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

                <ChoiceGroup
                  label={l('onboarding.meds', 'Weight Loss Medications')}
                  hint={l('onboarding.medsHint', "Select any you're currently taking")}
                  options={MED_OPTIONS(l)}
                  columns={2}
                  multiple
                  value={form.meds}
                  onChange={v => set('meds', v)}
                />
              </Stack>
            )}

            {/* ── Step 3: Your Goal ──────────────────────────────── */}
            {step === 3 && (
              <Stack gap={20}>
                <Paragraph style={{ color: 'var(--semantic-color-text-subtle)' }}>
                  {l('onboarding.step3Sub', 'What does success look like for you?')}
                </Paragraph>

                <NumberField
                  label={l('onboarding.goalWeight', 'Goal Weight')}
                  value={form.goalWeight}
                  onChange={e => set('goalWeight', e.target.value)}
                  min={50} max={700} step={0.5}
                  suffix={form.weightUnit}
                  inputMode="decimal"
                  required
                />

                <ChoiceGroup
                  label="Quick timelines"
                  options={TIMELINE_PRESETS.map(p => ({ value: p.value, label: p.label }))}
                  columns={2}
                  value={activeTimeline}
                  onChange={v => {
                    const preset = TIMELINE_PRESETS.find(p => p.value === v);
                    if (preset) set('goalDate', presetDate(preset.months));
                  }}
                />

                <FieldRow>
                  <DateField
                    label={l('onboarding.goalDate', 'Target Date')}
                    hint={l('onboarding.goalDateHint', 'Or pick a specific date')}
                    min={minGoalDate}
                    value={form.goalDate}
                    onChange={e => set('goalDate', e.target.value)}
                    required
                  />
                </FieldRow>
              </Stack>
            )}

          </Stack>
        </Inset>

      </Dialog>
    </div>
  );
}
