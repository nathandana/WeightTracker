import { useState } from 'react';
import {
  Section, Heading, Grid, Card, Stack, Paragraph,
  DefinitionList, Button, Dialog, ButtonContainer,
  NumberField, RadioGroup, ChoiceGroup, TextField, FieldRow,
} from '@gtivr4/a1-design-system-react';
import { useLabel } from '@gtivr4/a1-design-system-react';
import { ACTIVITY_OPTIONS, MED_OPTIONS } from './onboarding/onboardingConfig.js';

export function SettingsPage({ store }) {
  const l = useLabel;
  const { profile, locale, setLocale, saveProfile, reset } = store;
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [form, setForm] = useState(null);

  if (!profile) return null;

  const unit = profile.weightUnit;
  const isMetric = profile.heightUnit === 'cm';

  const heightStr = isMetric
    ? `${profile.height} cm`
    : `${profile.heightFeet}′ ${profile.heightInches}″`;

  const activityLabels = {
    sedentary: 'Sedentary', light: 'Light', moderate: 'Moderate', active: 'Active',
  };

  const medsStr = !profile.meds?.length || profile.meds.includes('none')
    ? 'None'
    : profile.meds
        .filter(m => m !== 'none')
        .map(m => ({ semaglutide: 'Semaglutide', tirzepatide: 'Tirzepatide', other: profile.otherMed || 'Other' }[m] ?? m))
        .join(', ');

  function fmt(iso) {
    if (!iso) return '—';
    const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + 'T12:00:00') : new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  const profileItems = [
    { id: 'startWeight', label: 'Start Weight',   value: `${profile.startWeight} ${unit}` },
    { id: 'goalWeight',  label: 'Goal Weight',    value: `${profile.goalWeight} ${unit}` },
    { id: 'height',      label: 'Height',         value: heightStr },
    { id: 'age',         label: 'Age',            value: `${profile.age} years` },
    { id: 'sex',         label: 'Biological Sex', value: profile.sex === 'male' ? 'Male' : 'Female' },
    { id: 'activity',    label: 'Activity Level', value: activityLabels[profile.activityLevel] ?? profile.activityLevel },
    { id: 'meds',        label: 'Medications',    value: medsStr },
    { id: 'startDate',   label: 'Start Date',     value: fmt(profile.startDate) },
    { id: 'goalDate',    label: 'Target Date',    value: fmt(profile.goalDate) },
  ];

  function openEdit() {
    setForm({ ...profile });
    setEditOpen(true);
  }

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function handleSave() {
    saveProfile({ ...profile, ...form });
    setEditOpen(false);
  }

  function handleReset() {
    setResetOpen(false);
    reset();
  }

  return (
    <Section padding="sm" contentWidth="lg" gap="lg">
      <Heading type="display" size="xxl" as="h1">Settings</Heading>

      <Grid columns={{ xs: 1, sm: 2 }} gap="lg">
        <Card>
          <Stack gap="md">
            <Stack direction="row" justify="between" align="center">
              <Heading size="md">Your Profile</Heading>
              <Button variant="tertiary" icon="edit" size="sm" onClick={openEdit}>Edit</Button>
            </Stack>
            
            <DefinitionList items={profileItems} direction="row" labelWidth="fixed" size="sm" />
          </Stack>
        </Card>

        <Card>
          <Stack gap="lg">
            <Stack gap="sm">
              <Heading size="md">Language</Heading>
              <RadioGroup
                label="Language"
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Español' },
                ]}
                value={locale}
                onChange={setLocale}
              />
            </Stack>
            <Stack gap="sm">
              <Heading size="md">Data</Heading>
              <Paragraph color="muted" size="sm">
                Permanently delete all your weight data and profile information.
              </Paragraph>
              <div>
                <Button variant="destructive" icon="delete_forever" onClick={() => setResetOpen(true)}>
                  Reset All Data
                </Button>
              </div>
            </Stack>
          </Stack>
        </Card>
      </Grid>

      <Dialog
        open={editOpen}
        title="Edit Profile"
        onClose={() => setEditOpen(false)}
        footer={
          <ButtonContainer align="end">
            <Button variant="primary" onClick={handleSave}>Save Changes</Button>
            <Button variant="tertiary" onClick={() => setEditOpen(false)}>Cancel</Button>
          </ButtonContainer>
        }
      >
        {form && (
          <Stack gap="lg">
            <FieldRow>
              <NumberField
                label="Start Weight"
                value={form.startWeight}
                unit={unit}
                onChange={ev => set('startWeight', ev.target.value)}
                min={20} max={700} step={0.5}
                inputMode="decimal"
              />
              <NumberField
                label="Goal Weight"
                value={form.goalWeight}
                unit={unit}
                onChange={ev => set('goalWeight', ev.target.value)}
                min={50} max={700} step={0.5}
                inputMode="decimal"
              />
            </FieldRow>
            {isMetric ? (
              <NumberField
                label="Height"
                value={form.height}
                suffix="cm"
                onChange={ev => set('height', ev.target.value)}
                min={100} max={250} step={1}
                inputMode="numeric"
              />
            ) : (
              <FieldRow>
                <NumberField
                  label="Height (feet)"
                  value={form.heightFeet}
                  unit="ft"
                  onChange={ev => set('heightFeet', ev.target.value)}
                  min={3} max={8} step={1}
                  inputMode="numeric"
                />
                <NumberField
                  label="Height (inches)"
                  value={form.heightInches}
                  unit="in"
                  onChange={ev => set('heightInches', ev.target.value)}
                  min={0} max={11} step={1}
                  inputMode="numeric"
                />
              </FieldRow>
            )}
            <NumberField
              label="Age"
              value={form.age}
              unit="years"
              onChange={ev => set('age', ev.target.value)}
              min={13} max={120} step={1}
              inputMode="numeric"
            />
            <ChoiceGroup
              label="Biological Sex"
              options={[
                { value: 'female', label: 'Female' },
                { value: 'male',   label: 'Male' },
              ]}
              columns={2}
              value={form.sex}
              onChange={v => set('sex', v)}
            />
            <ChoiceGroup
              label="Activity Level"
              options={ACTIVITY_OPTIONS(l)}
              columns={2}
              value={form.activityLevel}
              onChange={v => set('activityLevel', v)}
            />
            <Stack gap="md">
              <ChoiceGroup
                label="Weight Loss Medications"
                options={MED_OPTIONS(l)}
                columns={2}
                multiple
                value={form.meds ?? []}
                onChange={v => {
                  const hadNone = (form.meds ?? []).includes('none');
                  const hasNone = v.includes('none');
                  if (hasNone && !hadNone) set('meds', ['none']);
                  else if (hasNone && v.length > 1) set('meds', v.filter(x => x !== 'none'));
                  else set('meds', v);
                }}
              />
              {(form.meds ?? []).includes('other') && (
                <TextField
                  label="Medication Name"
                  placeholder="Enter medication name"
                  value={form.otherMed ?? ''}
                  onChange={ev => set('otherMed', ev.target.value)}
                />
              )}
            </Stack>
          </Stack>
        )}
      </Dialog>

      <Dialog
        title="Reset All Data"
        status="error"
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        footer={
          <ButtonContainer align="end">
            <Button variant="destructive" onClick={handleReset}>Yes, Reset Everything</Button>
            <Button variant="tertiary" onClick={() => setResetOpen(false)}>Cancel</Button>
          </ButtonContainer>
        }
      >
        <Paragraph>
          This will permanently delete all your weight data and profile information. This cannot be undone.
        </Paragraph>
      </Dialog>
    </Section>
  );
}
