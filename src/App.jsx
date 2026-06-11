import { useState, useEffect, lazy, Suspense } from 'react';
import {
  LabelsProvider, PageLayout, TopHeader, BottomDrawer, Stack, Button,
} from '@gtivr4/a1-design-system-react';
import { SystemBanner } from './components/SystemBanner.jsx';
import { useStore, LEGACY_STORAGE_KEY } from './store/useStore.js';
import { useAuth } from './lib/AuthContext.jsx';
import { supabaseConfigured } from './lib/supabase.js';
import { MOCK_SCENARIOS } from './dev/mockScenarios.js';
import labels from './labels/labels.json';

const Onboarding   = lazy(() => import('./views/Onboarding.jsx').then(m => ({ default: m.Onboarding })));
const CheckIn      = lazy(() => import('./views/CheckIn.jsx').then(m => ({ default: m.CheckIn })));
const DataPage     = lazy(() => import('./views/DataPage.jsx').then(m => ({ default: m.DataPage })));
const SettingsPage = lazy(() => import('./views/SettingsPage.jsx').then(m => ({ default: m.SettingsPage })));
const AuthPage     = lazy(() => import('./views/auth/AuthPage.jsx').then(m => ({ default: m.AuthPage })));

const PAGES = ['checkin', 'data', 'settings'];
const PAGE_TITLE_KEYS = {
  checkin: ['pageTitles.checkin', 'Check In — DownTrack'],
  data: ['pageTitles.data', 'Data — DownTrack'],
  settings: ['pageTitles.settings', 'Settings — DownTrack'],
};

function pageFromPath(pathname) {
  const p = pathname.replace(/^\//, '') || 'checkin';
  return PAGES.includes(p) ? p : 'checkin';
}

function scenarioFromSearch(search) {
  return new URLSearchParams(search).get('scenario') || 'real';
}

function buildUrl(page, scenarioId) {
  const sp = new URLSearchParams();
  if (import.meta.env.DEV && scenarioId && scenarioId !== 'real') sp.set('scenario', scenarioId);
  const search = sp.toString() ? `?${sp}` : '';
  return `/${page}${search}`;
}

function resolveLabel(key, locale, fallback) {
  const parts = key.split('.');
  let node = labels?.label;
  for (const part of parts) {
    if (node == null || typeof node !== 'object') return fallback;
    node = node[part];
  }
  if (node == null) return fallback;
  if (locale && node.locale?.[locale] != null) return node.locale[locale];
  return node.$value ?? fallback;
}

// ─── Loading screen ───────────────────────────────────────────────────────────

const loadingStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100dvh',
  color: 'var(--semantic-color-text-muted)',
  fontFamily: 'var(--component-paragraph-font-family, sans-serif)',
  fontSize: 14,
};

function LoadingScreen() {
  return <div style={loadingStyle} aria-busy="true">Loading…</div>;
}

// ─── Config error screen ──────────────────────────────────────────────────────

const configErrorStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100dvh',
  padding: 32,
  textAlign: 'center',
  fontFamily: 'var(--component-paragraph-font-family, sans-serif)',
  color: 'var(--semantic-color-text-default)',
};

function ConfigErrorScreen() {
  return (
    <div style={configErrorStyle}>
      <div>
        <strong>Supabase not configured</strong>
        <p style={{ color: 'var(--semantic-color-text-muted)', marginTop: 8, fontSize: 14 }}>
          Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your{' '}
          <code>.env.local</code> file and restart the dev server.
        </p>
      </div>
    </div>
  );
}

// ─── Dev toolbar ──────────────────────────────────────────────────────────────

const devBarStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 16px',
  background: 'color-mix(in srgb, var(--semantic-color-status-warn-background) 60%, transparent)',
  borderBottom: '1px solid var(--semantic-color-border-subtle)',
  fontSize: 12,
  fontFamily: 'var(--component-paragraph-font-family, sans-serif)',
  color: 'var(--semantic-color-text-default)',
};

const devSelectStyle = {
  fontSize: 12,
  padding: '2px 6px',
  borderRadius: 4,
  border: '1px solid var(--semantic-color-border-default)',
  background: 'var(--semantic-color-surface-default)',
  color: 'var(--semantic-color-text-default)',
  cursor: 'pointer',
};

// ─── Migration banner ─────────────────────────────────────────────────────────

function hasMigratableData() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!(parsed?.profile);
  } catch {
    return false;
  }
}

function migrationAlreadyHandled() {
  return localStorage.getItem('journey-checkin-migrated') === 'true';
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const store = useStore();

  const [page, setPage] = useState(() => pageFromPath(window.location.pathname));
  const [activeScenario, setActiveScenario] = useState(() =>
    import.meta.env.DEV ? scenarioFromSearch(window.location.search) : 'real'
  );
  const [migrationBusy, setMigrationBusy] = useState(false);
  const [migrationError, setMigrationError] = useState(null);
  const [showMigration, setShowMigration] = useState(false);

  // Show migration banner once after login if old data exists.
  useEffect(() => {
    if (user && !store.dataLoading) {
      setShowMigration(hasMigratableData() && !migrationAlreadyHandled());
    }
  }, [user, store.dataLoading]);

  // Apply URL-specified scenario once on mount (dev only).
  useEffect(() => {
    if (!import.meta.env.DEV || activeScenario === 'real') return;
    const scenario = MOCK_SCENARIOS.find(s => s.id === activeScenario);
    if (scenario?.state) store.loadMockData(scenario.state);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync state on browser back/forward.
  useEffect(() => {
    function onPop() {
      setPage(pageFromPath(window.location.pathname));
      if (!import.meta.env.DEV) return;
      const id = scenarioFromSearch(window.location.search);
      setActiveScenario(id);
      if (id === 'real') store.restoreRealData();
      else {
        const s = MOCK_SCENARIOS.find(x => x.id === id);
        if (s?.state) store.loadMockData(s.state);
      }
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [store]);

  useEffect(() => {
    document.documentElement.lang = store.locale;
    const [titleKey, fallback] = PAGE_TITLE_KEYS[page] ?? ['app.name', 'DownTrack'];
    document.title = resolveLabel(titleKey, store.locale, fallback);
  }, [page, store.locale]);

  function navigate(newPage) {
    setPage(newPage);
    window.history.pushState(null, '', buildUrl(newPage, activeScenario));
  }

  function handleOnboardingComplete(profile) {
    store.saveProfile(profile);
    navigate('checkin');
  }

  function handleScenarioChange(e) {
    const id = e.target.value;
    setActiveScenario(id);
    if (id === 'real') store.restoreRealData();
    else {
      const scenario = MOCK_SCENARIOS.find(s => s.id === id);
      if (scenario?.state) store.loadMockData(scenario.state);
    }
    window.history.replaceState(null, '', buildUrl(page, id));
  }

  async function handleMigrate() {
    setMigrationBusy(true);
    setMigrationError(null);
    try {
      await store.migrateFromLocalStorage();
      setShowMigration(false);
    } catch {
      setMigrationError('Import failed — please try again.');
    }
    setMigrationBusy(false);
  }

  function handleDismissMigration() {
    store.dismissMigration();
    setShowMigration(false);
  }

  // ─── Guards ─────────────────────────────────────────────────────────────────

  if (!supabaseConfigured) return <ConfigErrorScreen />;

  if (authLoading || store.dataLoading) return <LoadingScreen />;

  if (!user) {
    return (
      <LabelsProvider labels={labels} locale="en">
        <Suspense fallback={<LoadingScreen />}>
          <AuthPage />
        </Suspense>
      </LabelsProvider>
    );
  }

  // ─── Authenticated app ───────────────────────────────────────────────────────

  const appName = resolveLabel('app.name', store.locale, 'DownTrack');

  const navItems = [
    { id: 'checkin',  label: resolveLabel('nav.checkin',  store.locale, 'Check In'),  href: '/checkin',  icon: 'monitor_weight', active: page === 'checkin',  onClick: (e) => { e.preventDefault(); navigate('checkin'); } },
    { id: 'data',     label: resolveLabel('nav.data',     store.locale, 'Data'),      href: '/data',     icon: 'bar_chart',      active: page === 'data',     onClick: (e) => { e.preventDefault(); navigate('data'); } },
    { id: 'settings', label: resolveLabel('nav.settings', store.locale, 'Settings'),  href: '/settings', icon: 'settings',       active: page === 'settings', onClick: (e) => { e.preventDefault(); navigate('settings'); } },
  ];

  const bottomNavItems = navItems.map(({ href, ...item }) => ({ ...item, onClick: () => navigate(item.id) }));

  const header = store.profile ? (
    <TopHeader logoText={appName} logoHref="/checkin" navItems={navItems} navIconPosition={{ xs: 'hidden', sm: 'above' }} />
  ) : null;

  const devBar = (
    <div style={devBarStyle}>
      <span>🧪 Dev</span>
      <select style={devSelectStyle} aria-label="Test scenario" value={activeScenario} onChange={handleScenarioChange}>
        {MOCK_SCENARIOS.map(s => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
      {activeScenario !== 'real' && (
        <span style={{ color: 'var(--semantic-color-text-muted)', fontSize: 11 }}>
          — <code>?scenario={activeScenario}</code>
        </span>
      )}
      <span style={{ marginLeft: 'auto', color: 'var(--semantic-color-text-muted)', fontSize: 11 }}>
        {user.email}
      </span>
      <button style={{ ...devSelectStyle, cursor: 'pointer' }} onClick={signOut}>Sign out</button>
    </div>
  );

  return (
    <LabelsProvider labels={labels} locale={store.locale}>
      {import.meta.env.DEV && devBar}

      {showMigration && (
        <SystemBanner
          status="info"
          title="Import your existing data"
          icon="upload"
          action={
            <Stack direction="row" gap="sm">
              <Button size="sm" variant="primary" onClick={handleMigrate} disabled={migrationBusy}>
                {migrationBusy ? 'Importing…' : 'Import'}
              </Button>
              <Button size="sm" variant="tertiary" onClick={handleDismissMigration}>
                Dismiss
              </Button>
            </Stack>
          }
        >
          {migrationError ?? 'We found local data from before you had an account. Want to import it?'}
        </SystemBanner>
      )}

      <Suspense fallback={<LoadingScreen />}>
        {!store.profile ? (
          <Onboarding onComplete={handleOnboardingComplete} />
        ) : (
          <PageLayout header={header}>
            {page === 'checkin'  && <CheckIn store={store} onNavigate={navigate} />}
            {page === 'data'     && <DataPage store={store} onNavigate={navigate} />}
            {page === 'settings' && <SettingsPage store={store} onSignOut={signOut} />}
          </PageLayout>
        )}
      </Suspense>

      {store.profile && (
        <BottomDrawer
          items={bottomNavItems}
          aria-label={resolveLabel('nav.main', store.locale, 'Main navigation')}
          className="bottom-nav-ds"
        />
      )}
    </LabelsProvider>
  );
}
