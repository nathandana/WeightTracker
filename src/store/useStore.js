import { useState, useCallback, useEffect } from 'react';
import { initialDocumentLocale, normalizeLocale } from '../utils/locale.js';
import { useAuth } from '../lib/AuthContext.jsx';
import * as db from '../services/db.js';

// Language preference stays in localStorage — it's a UI setting, not user data.
const LOCALE_STORAGE_KEY = 'journey-checkin-locale';
const AUTO_LANGUAGE = 'auto';

// localStorage key for the old pre-auth data (used only during migration offer)
export const LEGACY_STORAGE_KEY = 'journey-checkin-v1';
const MIGRATION_FLAG_KEY = 'journey-checkin-migrated';

function normalizeLanguageSetting(setting) {
  return setting === AUTO_LANGUAGE ? AUTO_LANGUAGE : normalizeLocale(setting);
}

function resolveLocale(languageSetting) {
  return languageSetting === AUTO_LANGUAGE ? initialDocumentLocale : normalizeLocale(languageSetting);
}

function loadLanguageSetting() {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    return stored ? normalizeLanguageSetting(stored) : AUTO_LANGUAGE;
  } catch {
    return AUTO_LANGUAGE;
  }
}

function persistLanguage(setting) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, normalizeLanguageSetting(setting));
  } catch {}
}

const defaults = {
  profile: null,
  checkins: [],
};

export function useStore() {
  const { user } = useAuth();

  const [state, setState] = useState(() => {
    const languageSetting = loadLanguageSetting();
    return { ...defaults, languageSetting, locale: resolveLocale(languageSetting) };
  });
  const [dataLoading, setDataLoading] = useState(true);
  // settled: true only after we've completed at least one fetch for the current user.
  // Prevents a stale dataLoading=false from showing Onboarding during the one-render
  // gap between user appearing and the fetch useEffect firing.
  const [settled, setSettled] = useState(false);

  // Load from Supabase whenever the authenticated user changes.
  useEffect(() => {
    if (!user) {
      setState(prev => ({
        ...defaults,
        languageSetting: prev.languageSetting,
        locale: prev.locale,
      }));
      setDataLoading(false);
      setSettled(false);
      return;
    }

    setDataLoading(true);
    setSettled(false);
    Promise.all([db.fetchProfile(user.id), db.fetchCheckins(user.id)])
      .then(([profile, checkins]) => {
        setState(prev => ({ ...prev, profile, checkins }));
        setDataLoading(false);
        setSettled(true);
      })
      .catch(err => {
        console.error('Failed to load data from Supabase:', err);
        setDataLoading(false);
        setSettled(true);
      });
  }, [user?.id]);

  const saveProfile = useCallback((profile) => {
    setState(prev => ({ ...prev, profile }));
    if (user) db.upsertProfile(user.id, profile).catch(console.error);
  }, [user]);

  const addCheckin = useCallback((entry) => {
    setState(prev => {
      const today = new Date().toDateString();
      const existing = prev.checkins.find(c => new Date(c.date).toDateString() === today) ?? {};
      const filtered = prev.checkins.filter(c => new Date(c.date).toDateString() !== today);
      const newEntry = { ...existing, ...entry, date: new Date().toISOString() };
      if (user) db.upsertCheckin(user.id, newEntry).catch(console.error);
      return { ...prev, checkins: [...filtered, newEntry] };
    });
  }, [user]);

  const saveCheckinForDate = useCallback((entry) => {
    setState(prev => {
      const dateStr = new Date(entry.date).toDateString();
      const filtered = prev.checkins.filter(c => new Date(c.date).toDateString() !== dateStr);
      const sorted = [...filtered, entry].sort((a, b) => new Date(a.date) - new Date(b.date));
      if (user) db.upsertCheckin(user.id, entry).catch(console.error);
      return { ...prev, checkins: sorted };
    });
  }, [user]);

  const setLanguageSetting = useCallback((languageSetting) => {
    setState(prev => {
      const next = normalizeLanguageSetting(languageSetting);
      persistLanguage(next);
      return { ...prev, languageSetting: next, locale: resolveLocale(next) };
    });
  }, []);

  // reset: wipe all user data from Supabase and clear local state.
  const reset = useCallback(() => {
    if (user) {
      db.deleteAllCheckins(user.id).catch(console.error);
      db.deleteProfile(user.id).catch(console.error);
    }
    setState(prev => ({
      ...defaults,
      languageSetting: prev.languageSetting,
      locale: prev.locale,
    }));
  }, [user]);

  // migrateFromLocalStorage: import old pre-auth data into Supabase.
  const migrateFromLocalStorage = useCallback(async () => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) return;
      const { profile, checkins = [] } = JSON.parse(raw);
      if (profile) await db.upsertProfile(user.id, profile);
      for (const entry of checkins) {
        await db.upsertCheckin(user.id, entry);
      }
      localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      // Reload from Supabase so local state reflects merged data.
      const [newProfile, newCheckins] = await Promise.all([
        db.fetchProfile(user.id),
        db.fetchCheckins(user.id),
      ]);
      setState(prev => ({ ...prev, profile: newProfile, checkins: newCheckins }));
    } catch (err) {
      console.error('Migration failed:', err);
      throw err;
    }
  }, [user]);

  const dismissMigration = useCallback(() => {
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
  }, []);

  // Derived helpers
  const latestCheckin = state.checkins.length > 0
    ? state.checkins[state.checkins.length - 1]
    : null;

  const todayCheckin = state.checkins.find(
    c => new Date(c.date).toDateString() === new Date().toDateString()
  ) ?? null;

  const currentWeight = todayCheckin?.weight
    ?? latestCheckin?.weight
    ?? state.profile?.startWeight
    ?? null;

  return {
    ...state,
    dataLoading,
    settled,
    latestCheckin,
    todayCheckin,
    currentWeight,
    saveProfile,
    addCheckin,
    setLanguageSetting,
    setLocale: setLanguageSetting,
    reset,
    saveCheckinForDate,
    migrateFromLocalStorage,
    dismissMigration,
  };
}
