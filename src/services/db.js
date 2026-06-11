import { supabase } from '../lib/supabase.js';

// ─── Profile ─────────────────────────────────────────────────────────────────

function rowToProfile(row) {
  if (!row) return null;
  return {
    name: row.display_name,
    weightUnit: row.weight_unit,
    heightUnit: row.height_unit,
    startWeight: row.start_weight,
    goalWeight: row.goal_weight,
    height: row.height,
    heightFeet: row.height_feet,
    heightInches: row.height_inches,
    age: row.age,
    sex: row.sex,
    activityLevel: row.activity_level,
    dailyCalories: row.daily_calories,
    meds: row.meds ?? [],
    otherMed: row.other_med,
    startDate: row.start_date,
    goalDate: row.goal_date,
    createdAt: row.created_at,
  };
}

function profileToRow(userId, profile) {
  return {
    id: userId,
    display_name: profile.name ?? null,
    weight_unit: profile.weightUnit ?? 'lbs',
    height_unit: profile.heightUnit ?? 'imperial',
    start_weight: profile.startWeight != null ? Number(profile.startWeight) : null,
    goal_weight: profile.goalWeight != null ? Number(profile.goalWeight) : null,
    height: profile.height != null ? Number(profile.height) : null,
    height_feet: profile.heightFeet != null ? Number(profile.heightFeet) : null,
    height_inches: profile.heightInches != null ? Number(profile.heightInches) : null,
    age: profile.age != null ? Number(profile.age) : null,
    sex: profile.sex ?? null,
    activity_level: profile.activityLevel ?? null,
    daily_calories: profile.dailyCalories ?? null,
    meds: profile.meds ?? [],
    other_med: profile.otherMed ?? null,
    start_date: profile.startDate ?? null,
    goal_date: profile.goalDate ?? null,
  };
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return rowToProfile(data);
}

export async function upsertProfile(userId, profile) {
  const { error } = await supabase
    .from('profiles')
    .upsert(profileToRow(userId, profile), { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteProfile(userId) {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);
  if (error) throw error;
}

// ─── Checkins ─────────────────────────────────────────────────────────────────

// Use local-time date parts to avoid UTC-midnight timezone drift.
function toLocalDateStr(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function rowToCheckin(row) {
  // Use noon local time so toDateString() matches the stored date in all timezones.
  return {
    id: row.id,
    date: row.entry_date + 'T12:00:00',
    weight: row.weight,
    mood: row.mood,
    activity: row.activity,
    calories: row.calories,
    notes: row.notes,
  };
}

function checkinToRow(userId, entry) {
  return {
    user_id: userId,
    weight: entry.weight != null ? Number(entry.weight) : null,
    mood: entry.mood ?? null,
    activity: entry.activity ?? null,
    calories: entry.calories ?? null,
    notes: entry.notes ?? null,
    entry_date: toLocalDateStr(entry.date),
  };
}

export async function fetchCheckins(userId) {
  const { data, error } = await supabase
    .from('weight_entries')
    .select('*')
    .eq('user_id', userId)
    .order('entry_date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToCheckin);
}

export async function upsertCheckin(userId, entry) {
  const row = checkinToRow(userId, entry);
  // Conflict target matches the UNIQUE constraint (user_id, entry_date).
  const { error } = await supabase
    .from('weight_entries')
    .upsert(row, { onConflict: 'user_id,entry_date' });
  if (error) throw error;
}

export async function deleteAllCheckins(userId) {
  const { error } = await supabase
    .from('weight_entries')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
}
