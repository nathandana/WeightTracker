import { useState } from 'react';
import { useLabel } from '@gtivr4/a1-design-system-react';
import { lbsToKg, kgToLbs, feetInchesToCm, cmToFeetInches } from '../utils/calculations.js';
import { WelcomeResults } from './onboarding/WelcomeResults.jsx';
import {
  PROGRESS_TOTAL, TIMELINE_PRESETS,
  missing, missingInches, presetDate, computeSuggestedPreset,
} from './onboarding/onboardingConfig.js';
import { Step1AboutYou }  from './onboarding/Step1AboutYou.jsx';
import { Step2YourBody }  from './onboarding/Step2YourBody.jsx';
import { Step3YourHabits } from './onboarding/Step3YourHabits.jsx';
import { Step4YourGoal }  from './onboarding/Step4YourGoal.jsx';
import { formatDate } from '../utils/locale.js';

const STEPS = [Step1AboutYou, Step2YourBody, Step3YourHabits, Step4YourGoal];

export function Onboarding({ onComplete, onSignIn }) {
  const l = useLabel;

  const [step, setStep] = useState(1);
  const [attempted, setAttempted] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showGoalDatePicker, setShowGoalDatePicker] = useState(false);
  const [form, setForm] = useState({
    name: '',
    weightUnit: 'lbs',
    heightUnit: 'imperial',
    startWeight: 180,
    heightFeet: 5,
    heightInches: 7,
    height: '',
    age: 40,
    sex: 'female',
    activityLevel: 'moderate',
    dailyCalories: '1750',
    meds: [],
    otherMed: '',
    goalWeight: 160,
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
      const heightOk = units === 'metric'
        ? !missing(form.height)
        : !missing(form.heightFeet) && !missingInches(form.heightInches);
      return heightOk && !missing(form.age);
    }
    if (step === 4) return !!form.goalDate;
    return true;
  }

  function handleContinue() {
    if (isStepValid()) {
      setAttempted(false);
      if (step === 3 && !form.goalDate) {
        const suggested = computeSuggestedPreset(form);
        set('goalDate', presetDate(suggested.months));
      }
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
      setAttempted(false);
      setStep(5);
    } else {
      setAttempted(true);
    }
  }

  const errors = attempted ? {
    startWeight:  missing(form.startWeight) ? l('validation.enterWeight', 'Enter your current weight to continue') : null,
    goalWeight:   missing(form.goalWeight)  ? l('validation.enterGoal',   'Enter your goal weight to continue')    : null,
    heightFeet:   (units === 'imperial' && missing(form.heightFeet))         ? l('validation.enterFeet',   'Enter your height in feet')         : null,
    heightInches: (units === 'imperial' && missingInches(form.heightInches)) ? l('validation.enterInches', 'Enter inches — use 0 if none')      : null,
    height:       (units === 'metric'   && missing(form.height))             ? l('validation.enterHeight', 'Enter your height to continue')     : null,
    age:          missing(form.age) ? l('validation.enterAge', 'Enter your age to continue') : null,
    goalDate:     !form.goalDate    ? l('validation.selectDate', 'Select a target date to continue') : null,
  } : {};

  if (step === 5) {
    const builtProfile = {
      ...form,
      startDate: form.startDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    return (
      <WelcomeResults
        profile={builtProfile}
        onDone={() => onComplete(builtProfile)}
        onBack={() => setStep(4)}
        currentStep={5}
        totalSteps={PROGRESS_TOTAL}
      />
    );
  }

  const today          = new Date();
  const startDateObj   = form.startDate ? new Date(form.startDate) : null;
  const startDateLabel = form.startDate
    ? formatDate(form.startDate, undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : l('onboarding.startDateToday', 'Today');
  const goalDateObj    = form.goalDate ? new Date(form.goalDate + 'T12:00:00') : null;
  const minGoalDateStr = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]; })();
  const minGoalDateObj = new Date(minGoalDateStr + 'T12:00:00');
  const activeTimeline = TIMELINE_PRESETS.find(p => presetDate(p.months) === form.goalDate)?.value ?? null;

  const StepComponent = STEPS[step - 1];

  return (
    <StepComponent
      form={form}
      set={set}
      errors={errors}
      units={units}
      showStartDatePicker={showStartDatePicker}
      setShowStartDatePicker={setShowStartDatePicker}
      today={today}
      startDateObj={startDateObj}
      startDateLabel={startDateLabel}
      showGoalDatePicker={showGoalDatePicker}
      setShowGoalDatePicker={setShowGoalDatePicker}
      activeTimeline={activeTimeline}
      goalDateObj={goalDateObj}
      minGoalDateObj={minGoalDateObj}
      onBack={handleBack}
      onContinue={step < STEPS.length ? handleContinue : handleFinishAttempt}
      currentStep={step}
      totalSteps={PROGRESS_TOTAL}
      onSignIn={step === 1 ? onSignIn : undefined}
    />
  );
}
