import { useState, useCallback } from 'react';
import { initialDocumentLocale, normalizeLocale } from '../utils/locale.js';

const STORAGE_KEY = 'journey-checkin-v1';
const LOCALE_STORAGE_KEY = 'journey-checkin-locale';
const AUTO_LANGUAGE = 'auto';

function normalizeLanguageSetting(setting) {
  return setting === AUTO_LANGUAGE ? AUTO_LANGUAGE : normalizeLocale(setting);
}

function resolveLocale(languageSetting) {
  return languageSetting === AUTO_LANGUAGE ? initialDocumentLocale : normalizeLocale(languageSetting);
}

function loadLanguageSetting() {
  try {
    const storedSetting = localStorage.getItem(LOCALE_STORAGE_KEY);
    return storedSetting ? normalizeLanguageSetting(storedSetting) : AUTO_LANGUAGE;
  } catch {
    return AUTO_LANGUAGE;
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed.languageSetting = loadLanguageSetting();
    parsed.locale = resolveLocale(parsed.languageSetting);
    return parsed;
  } catch {
    const languageSetting = loadLanguageSetting();
    return { languageSetting, locale: resolveLocale(languageSetting) };
  }
}

function persist(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(LOCALE_STORAGE_KEY, normalizeLanguageSetting(state.languageSetting));
  } catch {}
}

const defaults = {
  profile: null,
  checkins: [],
  languageSetting: loadLanguageSetting(),
  locale: resolveLocale(loadLanguageSetting()),
};

export function useStore() {
  const [state, setState] = useState(() => ({ ...defaults, ...load() }));

  const update = useCallback((updates) => {
    setState(prev => {
      const next = { ...prev, ...updates };
      persist(next);
      return next;
    });
  }, []);

  const saveProfile = useCallback((profile) => {
    setState(prev => {
      const next = { ...prev, profile };
      persist(next);
      return next;
    });
  }, []);

  const addCheckin = useCallback((entry) => {
    setState(prev => {
      const today = new Date().toDateString();
      const existing = prev.checkins.find(c => new Date(c.date).toDateString() === today) ?? {};
      const filtered = prev.checkins.filter(c => new Date(c.date).toDateString() !== today);
      const next = {
        ...prev,
        checkins: [...filtered, { ...existing, ...entry, date: new Date().toISOString() }],
      };
      persist(next);
      return next;
    });
  }, []);

  const setLanguageSetting = useCallback((languageSetting) => {
    setState(prev => {
      const nextSetting = normalizeLanguageSetting(languageSetting);
      const next = {
        ...prev,
        languageSetting: nextSetting,
        locale: resolveLocale(nextSetting),
      };
      persist(next);
      return next;
    });
  }, []);

  const setLocale = setLanguageSetting;

  const reset = useCallback(() => {
    setState(prev => {
      const languageSetting = normalizeLanguageSetting(prev.languageSetting);
      const locale = resolveLocale(languageSetting);
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(LOCALE_STORAGE_KEY, languageSetting);
      } catch {}
      return { ...defaults, languageSetting, locale };
    });
  }, []);

  const saveCheckinForDate = useCallback((entry) => {
    // entry must include a `date` ISO string
    setState(prev => {
      const dateStr = new Date(entry.date).toDateString();
      const filtered = prev.checkins.filter(c => new Date(c.date).toDateString() !== dateStr);
      const next = { ...prev, checkins: [...filtered, entry].sort((a, b) => new Date(a.date) - new Date(b.date)) };
      persist(next);
      return next;
    });
  }, []);

  const loadMockData = useCallback((mockState) => {
    setState(prev => {
      const { locale: _mockLocale, languageSetting: _mockLanguageSetting, ...mockStateWithoutLocale } = mockState;
      const languageSetting = normalizeLanguageSetting(prev.languageSetting);
      return { ...defaults, ...mockStateWithoutLocale, languageSetting, locale: resolveLocale(languageSetting) };
    });
  }, []);

  const restoreRealData = useCallback(() => {
    setState({ ...defaults, ...load() });
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
    latestCheckin,
    todayCheckin,
    currentWeight,
    update,
    saveProfile,
    addCheckin,
    setLanguageSetting,
    setLocale,
    reset,
    saveCheckinForDate,
    loadMockData,
    restoreRealData,
  };
}
