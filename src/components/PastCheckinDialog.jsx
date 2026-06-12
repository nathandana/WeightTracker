import { useState, useEffect } from 'react';
import {
  Dialog, Calendar, Stack, Paragraph, Heading, TextareaField,
  Accordion, ChoiceGroup, Button,
} from '@gtivr4/a1-design-system-react';
import { useLabel } from '@gtivr4/a1-design-system-react';
import { WeightStepper } from './WeightStepper.jsx';
import { formatDate } from '../utils/locale.js';

const MOOD_OPTIONS = [
  { value: 'great', label: 'Amazing',   icon: 'sentiment_very_satisfied' },
  { value: 'good',  label: 'Good',      icon: 'sentiment_satisfied' },
  { value: 'okay',  label: 'Okay',      icon: 'sentiment_neutral' },
  { value: 'low',   label: 'Tough Day', icon: 'sentiment_dissatisfied' },
];
const ACTIVITY_OPTIONS = [
  { value: 'high',   label: 'Intense',  icon: 'directions_run' },
  { value: 'medium', label: 'Moderate', icon: 'directions_walk' },
  { value: 'low',    label: 'Light',    icon: 'self_improvement' },
  { value: 'none',   label: 'Rest Day', icon: 'hotel' },
];
const CALORIES_OPTIONS = [
  { value: 'under',    label: 'Under goal',    icon: 'thumb_up' },
  { value: 'on_track', label: 'On track',      icon: 'check_circle' },
  { value: 'over',     label: 'Slightly over', icon: 'trending_up' },
  { value: 'way_over', label: 'Way over',      icon: 'warning' },
];

function fmt(date, locale) {
  return formatDate(date, locale, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
}

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(8, 0, 0, 0);
  return d;
}

export function PastCheckinDialog({ open, onClose, onSave, profile, unit = 'lbs', locale = 'en' }) {
  const l = useLabel;
  const [date, setDate] = useState(yesterday);
  const [weight, setWeight] = useState(profile?.startWeight ?? 150);
  const [mood, setMood] = useState(null);
  const [activity, setActivity] = useState(null);
  const [calories, setCalories] = useState(null);
  const [notes, setNotes] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return;
    setDate(yesterday());
    setWeight(profile?.startWeight ?? 150);
    setMood(null);
    setActivity(null);
    setCalories(null);
    setNotes('');
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const parsedWeight = Number(weight);
  const canSave = !Number.isNaN(parsedWeight) && parsedWeight > 0;

  function handleSave() {
    if (!canSave) return;
    const d = new Date(date);
    d.setHours(8, 0, 0, 0);
    onSave({
      date: d.toISOString(),
      weight: Math.round(parsedWeight * 10) / 10,
      ...(mood     && { mood }),
      ...(activity && { activity }),
      ...(calories && { calories }),
      ...(notes.trim() && { notes: notes.trim() }),
    });
    onClose();
  }

  const maxDate = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

  return (
    <Dialog
      open={open}
      title={l('checkin.logPastWeight', 'Log Past Weight')}
      onClose={onClose}
      footer={<>
        <Button variant="primary" onClick={handleSave} disabled={!canSave}>{l('common.save', 'Save')}</Button>
        <Button variant="secondary" onClick={onClose}>{l('common.cancel', 'Cancel')}</Button>
      </>}
    >
      <Stack gap="lg">
        <Stack gap="xs">
          <Paragraph size="sm" color="muted">{l('checkin.selected', 'Selected')}: <strong>{fmt(date, locale)}</strong></Paragraph>
          <Calendar
            selectable
            variant="paginated"
            selectedDate={date}
            onChange={setDate}
            maxDate={maxDate}
            highlightToday
            dimPast={false}
          />
        </Stack>

        <Stack gap="sm" align="center">
          <Heading size="xs" color="muted">{`${l('progress.currentWeight', 'Weight')} (${unit})`}</Heading>
          <WeightStepper value={weight} onChange={setWeight} unit={unit} />
        </Stack>

        <Accordion label={l('checkin.dailyDetailsOptional', 'Daily Details (optional)')}>
          <Stack gap="lg">
            <ChoiceGroup
              label={l('survey.mood', 'How were you feeling?')}
              columns={2}
              value={mood}
              options={MOOD_OPTIONS}
              onChange={setMood}
            />
            <ChoiceGroup
              label={l('survey.activity', 'How active were you?')}
              columns={2}
              value={activity}
              options={ACTIVITY_OPTIONS}
              onChange={setActivity}
            />
            <ChoiceGroup
              label={l('survey.calories', 'How did you eat?')}
              columns={2}
              value={calories}
              options={CALORIES_OPTIONS}
              onChange={setCalories}
            />
            <TextareaField
              label={l('checkin.notes', 'Notes')}
              value={notes}
              onChange={e => setNotes(e.target.value.slice(0, 500))}
              placeholder={l('checkin.notesPlaceholder', 'Optional — observations, feelings, or reminders')}
              maxLength={500}
              rows="md"
              size="comfortable"
            />
          </Stack>
        </Accordion>

      </Stack>
    </Dialog>
  );
}
