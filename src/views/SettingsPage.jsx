import { useState } from 'react';
import {
  Section, Heading, Grid, Card, Stack, Paragraph,
  DefinitionList, Button, Dialog, ButtonContainer,
  NumberField, RadioGroup, ChoiceGroup, TextField, FieldRow,
} from '@gtivr4/a1-design-system-react';
import { useLabel } from '@gtivr4/a1-design-system-react';
import { useAuth } from '../lib/AuthContext.jsx';
import { ACTIVITY_OPTIONS, MED_OPTIONS } from './onboarding/onboardingConfig.js';
import { formatDate } from '../utils/locale.js';

export function SettingsPage({ store, onSignOut, onResetData }) {
  const l = useLabel;
  const { user, deleteAccount } = useAuth();
  const { profile, locale, languageSetting, setLanguageSetting, saveProfile, reset } = store;

  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [form, setForm] = useState(null);

  if (!profile) return null;

  const unit = profile.weightUnit;
  const isMetric = profile.heightUnit === 'cm';

  const heightStr = isMetric
    ? `${profile.height} cm`
    : `${profile.heightFeet}′ ${profile.heightInches}″`;

  const activityLabels = {
    sedentary: l('onboarding.activitySedentary', 'Sedentary'),
    light:     l('onboarding.activityLight',     'Lightly Active'),
    moderate:  l('onboarding.activityModerate',  'Moderately Active'),
    active:    l('onboarding.activityActive',    'Very Active'),
  };

  const medsStr = !profile.meds?.length || profile.meds.includes('none')
    ? l('onboarding.medNone', 'None')
    : profile.meds
        .filter(m => m !== 'none')
        .map(m => ({
          semaglutide: 'Semaglutide',
          tirzepatide: 'Tirzepatide',
          other: profile.otherMed || l('onboarding.medOther', 'Other'),
        }[m] ?? m))
        .join(', ');

  function fmt(iso) {
    if (!iso) return '—';
    const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + 'T12:00:00') : new Date(iso);
    return formatDate(d, locale, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  const profileItems = [
    { id: 'startWeight', label: l('onboarding.startWeight', 'Starting weight'), value: `${profile.startWeight} ${unit}` },
    { id: 'goalWeight',  label: l('onboarding.goalWeight',  'Goal weight'),     value: `${profile.goalWeight} ${unit}` },
    { id: 'height',      label: l('onboarding.height',      'Height'),          value: heightStr },
    { id: 'age',         label: l('onboarding.age',         'Age'),             value: `${profile.age} ${l('common.years', 'years')}` },
    { id: 'sex',         label: l('onboarding.sex',         'Biological Sex'),  value: profile.sex === 'male' ? l('onboarding.sexMale', 'Male') : l('onboarding.sexFemale', 'Female') },
    { id: 'activity',    label: l('onboarding.activityLevel', 'Activity Level'), value: activityLabels[profile.activityLevel] ?? profile.activityLevel },
    { id: 'meds',        label: l('profile.meds',           'Medications'),     value: medsStr },
    { id: 'startDate',   label: l('onboarding.startDate',   'Start Date'),      value: fmt(profile.startDate) },
    { id: 'goalDate',    label: l('onboarding.goalDate',    'Target Date'),     value: fmt(profile.goalDate) },
  ];

  const accountItems = [
    ...(profile.name ? [{ id: 'name', label: l('onboarding.name', 'Name'), value: profile.name }] : []),
    { id: 'email', label: l('settings.email', 'Email'), value: user?.email ?? '—' },
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
    if (onResetData) onResetData();
    else reset();
  }

  async function handleDeleteAccount() {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      // Auth state change fires → App re-renders to onboarding
    } catch (err) {
      setDeleteError(err?.message ?? 'Something went wrong. Please try again.');
      setDeleteBusy(false);
    }
  }

  return (
    <Section padding="sm" contentWidth="lg" gap="lg">
      <Heading type="display" size="xxl" as="h1">{l('settings.title', 'Settings')}</Heading>

      <Grid columns={{ xs: 1, sm: 2 }} gap="lg">
        {/* Profile card */}
        <Card>
          <Stack gap="md">
            <Stack direction="row" justify="between" align="center">
              <Heading size="md">{l('settings.yourProfile', 'Your Profile')}</Heading>
              <Button variant="tertiary" icon="edit" size="sm" onClick={openEdit}>{l('common.edit', 'Edit')}</Button>
            </Stack>
            <DefinitionList items={profileItems} direction="row" labelWidth="fixed" size="sm" />
          </Stack>
        </Card>

        {/* Language + Data card */}
        <Card>
          <Stack gap="lg">
            <Stack gap="sm">
              <Heading size="md">{l('profile.language', 'Language')}</Heading>
              <RadioGroup
                label={l('profile.language', 'Language')}
                options={[
                  { value: 'auto', label: l('profile.langAuto', 'Automatic') },
                  { value: 'en', label: l('profile.langEn', 'English') },
                  { value: 'es', label: l('profile.langEs', 'Español') },
                ]}
                value={languageSetting}
                onChange={setLanguageSetting}
              />
            </Stack>
            <Stack gap="sm">
              <Heading size="md">{l('settings.data', 'Data')}</Heading>
              <Paragraph color="muted" size="sm">
                {l('settings.dataDesc', 'Permanently delete all your weight data and profile information.')}
              </Paragraph>
              <div>
                <Button variant="destructive" icon="delete_forever" onClick={() => setResetOpen(true)}>
                  {l('profile.resetData', 'Reset All Data')}
                </Button>
              </div>
            </Stack>
          </Stack>
        </Card>

        {/* Account card */}
        <Card>
          <Stack gap="md">
            <Heading size="md">{l('settings.account', 'Account')}</Heading>
            <DefinitionList items={accountItems} direction="row" labelWidth="fixed" size="sm" />
            <Stack direction="row" gap="sm" wrap>
              {onSignOut && (
                <Button variant="secondary" icon="logout" onClick={onSignOut}>
                  {l('settings.signOut', 'Sign Out')}
                </Button>
              )}
              <Button variant="destructive" icon="person_remove" onClick={() => setDeleteOpen(true)}>
                {l('settings.deleteAccount', 'Delete Account')}
              </Button>
            </Stack>
          </Stack>
        </Card>
      </Grid>

      {/* Edit profile dialog */}
      <Dialog
        open={editOpen}
        title={l('profile.editProfile', 'Edit Profile')}
        onClose={() => setEditOpen(false)}
        footer={
          <ButtonContainer align="end">
            <Button variant="primary" onClick={handleSave}>{l('settings.saveChanges', 'Save Changes')}</Button>
            <Button variant="tertiary" onClick={() => setEditOpen(false)}>{l('common.cancel', 'Cancel')}</Button>
          </ButtonContainer>
        }
      >
        {form && (
          <Stack gap="lg">
            <FieldRow>
              <NumberField
                label={l('onboarding.startWeight', 'Starting weight')}
                value={form.startWeight}
                unit={unit}
                onChange={ev => set('startWeight', ev.target.value)}
                min={20} max={700} step={0.5}
                inputMode="decimal"
              />
              <NumberField
                label={l('onboarding.goalWeight', 'Goal weight')}
                value={form.goalWeight}
                unit={unit}
                onChange={ev => set('goalWeight', ev.target.value)}
                min={50} max={700} step={0.5}
                inputMode="decimal"
              />
            </FieldRow>
            {isMetric ? (
              <NumberField
                label={l('onboarding.heightCm', 'Height (cm)')}
                value={form.height}
                suffix="cm"
                onChange={ev => set('height', ev.target.value)}
                min={100} max={250} step={1}
                inputMode="numeric"
              />
            ) : (
              <FieldRow>
                <NumberField
                  label={l('onboarding.heightFeet', 'Feet')}
                  value={form.heightFeet}
                  unit="ft"
                  onChange={ev => set('heightFeet', ev.target.value)}
                  min={3} max={8} step={1}
                  inputMode="numeric"
                />
                <NumberField
                  label={l('onboarding.heightInches', 'Inches')}
                  value={form.heightInches}
                  unit="in"
                  onChange={ev => set('heightInches', ev.target.value)}
                  min={0} max={11} step={1}
                  inputMode="numeric"
                />
              </FieldRow>
            )}
            <NumberField
              label={l('onboarding.age', 'Age')}
              value={form.age}
              unit="years"
              onChange={ev => set('age', ev.target.value)}
              min={13} max={120} step={1}
              inputMode="numeric"
            />
            <ChoiceGroup
              label={l('onboarding.sex', 'Biological Sex')}
              options={[
                { value: 'female', label: l('onboarding.sexFemale', 'Female') },
                { value: 'male',   label: l('onboarding.sexMale',   'Male') },
              ]}
              columns={2}
              value={form.sex}
              onChange={v => set('sex', v)}
            />
            <ChoiceGroup
              label={l('onboarding.activityLevel', 'Activity Level')}
              options={ACTIVITY_OPTIONS(l)}
              columns={2}
              value={form.activityLevel}
              onChange={v => set('activityLevel', v)}
            />
            <Stack gap="md">
              <ChoiceGroup
                label={l('onboarding.meds', 'Weight Loss Medications')}
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
                  label={l('onboarding.otherMed', 'Medication Name')}
                  placeholder={l('onboarding.otherMedPlaceholder', 'Enter medication name')}
                  value={form.otherMed ?? ''}
                  onChange={ev => set('otherMed', ev.target.value)}
                />
              )}
            </Stack>
          </Stack>
        )}
      </Dialog>

      {/* Reset data dialog */}
      <Dialog
        title={l('settings.resetTitle', 'Reset All Data')}
        status="error"
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        footer={
          <ButtonContainer align="end">
            <Button variant="destructive" onClick={handleReset}>{l('settings.resetConfirm', 'Yes, Reset Everything')}</Button>
            <Button variant="tertiary" onClick={() => setResetOpen(false)}>{l('common.cancel', 'Cancel')}</Button>
          </ButtonContainer>
        }
      >
        <Paragraph>{l('settings.resetBody', 'This will permanently delete all your weight data and profile information. This cannot be undone.')}</Paragraph>
      </Dialog>

      {/* Delete account dialog */}
      <Dialog
        title={l('settings.deleteAccountTitle', 'Delete Account')}
        status="error"
        open={deleteOpen}
        onClose={() => { if (!deleteBusy) { setDeleteOpen(false); setDeleteError(null); } }}
        footer={
          <ButtonContainer align="end">
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteBusy}>
              {deleteBusy ? l('settings.deletingAccount', 'Deleting…') : l('settings.deleteAccountConfirm', 'Yes, Delete My Account')}
            </Button>
            <Button variant="tertiary" onClick={() => { setDeleteOpen(false); setDeleteError(null); }} disabled={deleteBusy}>
              {l('common.cancel', 'Cancel')}
            </Button>
          </ButtonContainer>
        }
      >
        <Stack gap="md">
          <Paragraph>{l('settings.deleteAccountBody', 'This permanently deletes your account and all your data. This cannot be undone.')}</Paragraph>
          {deleteError && <Paragraph color="error" size="sm">{deleteError}</Paragraph>}
        </Stack>
      </Dialog>
    </Section>
  );
}
