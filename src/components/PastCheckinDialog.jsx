import { useState, useEffect } from 'react';
import {
  Dialog, Calendar, Stack, Paragraph, NumberField, TextareaField,
  Accordion, ChoiceGroup, Button,
} from '@gtivr4/a1-design-system-react';

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

function fmt(date) {
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
}

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(8, 0, 0, 0);
  return d;
}

export function PastCheckinDialog({ open, onClose, onSave, profile, unit = 'lbs' }) {
  const [date, setDate] = useState(yesterday);
  const [weightStr, setWeightStr] = useState(String(profile?.startWeight ?? 150));
  const [mood, setMood] = useState(null);
  const [activity, setActivity] = useState(null);
  const [calories, setCalories] = useState(null);
  const [notes, setNotes] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return;
    setDate(yesterday());
    setWeightStr(String(profile?.startWeight ?? 150));
    setMood(null);
    setActivity(null);
    setCalories(null);
    setNotes('');
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const parsedWeight = parseFloat(weightStr);
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

  const minDate = profile?.startDate ? new Date(profile.startDate) : undefined;
  const maxDate = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();

  return (
    <Dialog
      open={open}
      title="Log Past Weight"
      onClose={onClose}
      footer={<>
        <Button variant="primary" onClick={handleSave} disabled={!canSave}>Save</Button>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
      </>}
    >
      <Stack gap="lg">
        <Stack gap="xs">
          <Paragraph size="sm" color="muted">Selected: <strong>{fmt(date)}</strong></Paragraph>
          <Calendar
            selectable
            variant="paginated"
            selectedDate={date}
            onChange={setDate}
            maxDate={maxDate}
            minDate={minDate}
            highlightToday
            dimPast={false}
          />
        </Stack>

        <NumberField
          label={`Weight (${unit})`}
          value={weightStr}
          onChange={e => setWeightStr(e.target.value)}
          min={50}
          max={700}
          step={0.5}
          unit={unit}
          inputMode="decimal"
          size="comfortable"
          className='boldInput'
        />

        <Accordion label="Daily Details (optional)">
          <Stack gap="lg">
            <ChoiceGroup
              label="How were you feeling?"
              columns={2}
              value={mood}
              options={MOOD_OPTIONS}
              onChange={setMood}
            />
            <ChoiceGroup
              label="How active were you?"
              columns={2}
              value={activity}
              options={ACTIVITY_OPTIONS}
              onChange={setActivity}
            />
            <ChoiceGroup
              label="How did you eat?"
              columns={2}
              value={calories}
              options={CALORIES_OPTIONS}
              onChange={setCalories}
            />
            <TextareaField
              label="Notes"
              value={notes}
              onChange={e => setNotes(e.target.value.slice(0, 500))}
              placeholder="Optional — observations, feelings, or reminders"
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
