import { useState, useCallback } from 'react';

const STORAGE_KEY = 'journey-checkin-v1';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persist(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

const defaults = {
  profile: null,
  checkins: [],
  locale: 'en',
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

  const setLocale = useCallback((locale) => {
    setState(prev => {
      const next = { ...prev, locale };
      persist(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ ...defaults });
  }, []);

  const loadMockData = useCallback((mockState) => {
    setState({ ...defaults, ...mockState });
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
    setLocale,
    reset,
    loadMockData,
    restoreRealData,
  };
}
