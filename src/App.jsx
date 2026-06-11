import { useState, useEffect, lazy, Suspense } from 'react';
import {
  LabelsProvider, PageLayout, TopHeader, BottomDrawer,
  Stack, Button, Dialog, Paragraph,
} from '@gtivr4/a1-design-system-react';
import { useStore, LEGACY_STORAGE_KEY } from './store/useStore.js';
import { useAuth } from './lib/AuthContext.jsx';
import { supabaseConfigured } from './lib/supabase.js';
import { MOCK_SCENARIOS } from './dev/mockScenarios.js';
import { SystemBanner } from './components/SystemBanner.jsx';
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
const PENDING_SETUP_KEY = 'journey-checkin-pending-setup';

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

function loadPendingProfile() {
  try {
    const raw = localStorage.getItem(PENDING_SETUP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function savePendingProfile(profile) {
  try { localStorage.setItem(PENDING_SETUP_KEY, JSON.stringify(profile)); } catch {}
}

function clearPendingProfile() {
  try { localStorage.removeItem(PENDING_SETUP_KEY); } catch {}
}

function hasMigratableData() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    return !!(raw && JSON.parse(raw)?.profile);
  } catch { return false; }
}

function migrationAlreadyHandled() {
  return localStorage.getItem('journey-checkin-migrated') === 'true';
}

// ─── Loading / error screens ─────────────────────────────────────────────────

const loadingStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  minHeight: '100dvh', color: 'var(--semantic-color-text-muted)',
  fontFamily: 'var(--component-paragraph-font-family, sans-serif)', fontSize: 14,
};

function LoadingScreen() {
  return <div style={loadingStyle} aria-busy="true">Loading…</div>;
}

function ConfigErrorScreen() {
  return (
    <div style={{ ...loadingStyle, flexDirection: 'column', gap: 8, textAlign: 'center', padding: 32 }}>
      <strong style={{ color: 'var(--semantic-color-text-default)' }}>Supabase not configured</strong>
      <p style={{ margin: 0, fontSize: 14 }}>
        Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to{' '}
        <code>.env.local</code> and restart.
      </p>
    </div>
  );
}

// ─── Dev toolbar ─────────────────────────────────────────────────────────────

const devBarStyle = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px',
  background: 'color-mix(in srgb, var(--semantic-color-status-warn-background) 60%, transparent)',
  borderBottom: '1px solid var(--semantic-color-border-subtle)',
  fontSize: 12, fontFamily: 'var(--component-paragraph-font-family, sans-serif)',
  color: 'var(--semantic-color-text-default)',
};

const devSelectStyle = {
  fontSize: 12, padding: '2px 6px', borderRadius: 4,
  border: '1px solid var(--semantic-color-border-default)',
  background: 'var(--semantic-color-surface-default)',
  color: 'var(--semantic-color-text-default)', cursor: 'pointer',
};

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const store = useStore();

  const [page, setPage] = useState(() => pageFromPath(window.location.pathname));
  const [activeScenario, setActiveScenario] = useState(() =>
    import.meta.env.DEV ? scenarioFromSearch(window.location.search) : 'real'
  );

  // pendingProfile persists through email-confirmation reloads.
  const [pendingProfile, setPendingProfile] = useState(loadPendingProfile);
  // wantsLogin: pre-auth user clicked "Sign in" from within onboarding.
  const [wantsLogin, setWantsLogin] = useState(false);

  // accountOpen: xs "Account" dialog from BottomDrawer
  const [accountOpen, setAccountOpen] = useState(false);

  const [migrationBusy, setMigrationBusy] = useState(false);
  const [migrationError, setMigrationError] = useState(null);
  const [showMigration, setShowMigration] = useState(false);

  // Save pending profile when the user becomes authenticated.
  useEffect(() => {
    if (user && !store.dataLoading && !store.profile && pendingProfile) {
      store.saveProfile(pendingProfile);
      clearPendingProfile();
      setPendingProfile(null);
    }
  }, [user, store.dataLoading, store.profile, pendingProfile]);

  // Show migration banner after login if old localStorage data exists.
  useEffect(() => {
    if (user && !store.dataLoading) {
      setShowMigration(hasMigratableData() && !migrationAlreadyHandled());
    }
  }, [user, store.dataLoading]);

  // Apply URL scenario on mount (dev only).
  useEffect(() => {
    if (!import.meta.env.DEV || activeScenario === 'real') return;
    const scenario = MOCK_SCENARIOS.find(s => s.id === activeScenario);
    if (scenario?.state) store.loadMockData(scenario.state);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync page on browser back/forward.
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
    if (user) {
      store.saveProfile(profile);
      navigate('checkin');
    } else {
      savePendingProfile(profile);
      setPendingProfile(profile);
    }
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
  if (authLoading) return <LoadingScreen />;

  // ─── Unauthenticated: auth page ───────────────────────────────────────────────

  const showAuth = !user && (!!pendingProfile || wantsLogin);

  if (showAuth) {
    return (
      <LabelsProvider labels={labels} locale="en">
        <Suspense fallback={<LoadingScreen />}>
          <AuthPage initialMode={pendingProfile ? 'signup' : 'login'} />
        </Suspense>
      </LabelsProvider>
    );
  }

  // ─── Unauthenticated: onboarding ─────────────────────────────────────────────

  if (!user) {
    return (
      <LabelsProvider labels={labels} locale="en">
        <Suspense fallback={<LoadingScreen />}>
          <Onboarding
            onComplete={handleOnboardingComplete}
            onSignIn={() => setWantsLogin(true)}
          />
        </Suspense>
      </LabelsProvider>
    );
  }

  // ─── Authenticated but data still loading ────────────────────────────────────

  if (store.dataLoading) return <LoadingScreen />;

  // ─── Authenticated, no profile → onboarding (e.g. profile was reset) ─────────

  if (!store.profile) {
    return (
      <LabelsProvider labels={labels} locale={store.locale}>
        <Suspense fallback={<LoadingScreen />}>
          <Onboarding onComplete={handleOnboardingComplete} />
        </Suspense>
      </LabelsProvider>
    );
  }

  // ─── Authenticated + profile: main app ───────────────────────────────────────

  const appName = resolveLabel('app.name', store.locale, 'DownTrack');
  const displayName = store.profile?.name || user.email;

  const navItems = [
    { id: 'checkin',  label: resolveLabel('nav.checkin',  store.locale, 'Check In'),  href: '/checkin',  icon: 'monitor_weight', active: page === 'checkin',  onClick: (e) => { e.preventDefault(); navigate('checkin'); } },
    { id: 'data',     label: resolveLabel('nav.data',     store.locale, 'Data'),      href: '/data',     icon: 'bar_chart',      active: page === 'data',     onClick: (e) => { e.preventDefault(); navigate('data'); } },
    { id: 'settings', label: resolveLabel('nav.settings', store.locale, 'Settings'),  href: '/settings', icon: 'settings',       active: page === 'settings', onClick: (e) => { e.preventDefault(); navigate('settings'); } },
  ];

  // User menu shown in the TopHeader end slot (sm+).
  const headerActions = [{
    id: 'user',
    icon: 'account_circle',
    label: resolveLabel('settings.account', store.locale, 'Account'),
    items: [
      { isHeader: true, label: displayName, description: user.email !== displayName ? user.email : undefined },
      { icon: 'logout', label: resolveLabel('settings.signOut', store.locale, 'Sign Out'), onClick: signOut },
    ],
  }];

  // BottomDrawer includes an "Account" tab that opens a dialog on xs.
  const bottomNavItems = [
    ...navItems.map(({ href, ...item }) => ({ ...item, onClick: () => navigate(item.id) })),
    { id: 'account', label: resolveLabel('settings.account', store.locale, 'Account'), icon: 'account_circle', onClick: () => setAccountOpen(true) },
  ];

  const header = (
    <TopHeader
      logoText={appName}
      logoHref="/checkin"
      navItems={navItems}
      actions={headerActions}
      navIconPosition={{ xs: 'hidden', sm: 'above' }}
    />
  );

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
      <button style={devSelectStyle} onClick={signOut}>Sign out</button>
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
        <PageLayout header={header}>
          {page === 'checkin'  && <CheckIn store={store} onNavigate={navigate} />}
          {page === 'data'     && <DataPage store={store} onNavigate={navigate} />}
          {page === 'settings' && <SettingsPage store={store} onSignOut={signOut} />}
        </PageLayout>
      </Suspense>

      <BottomDrawer
        items={bottomNavItems}
        aria-label={resolveLabel('nav.main', store.locale, 'Main navigation')}
        className="bottom-nav-ds"
      />

      {/* Account dialog — shown when user taps Account in the xs BottomDrawer */}
      <Dialog
        open={accountOpen}
        title={displayName}
        onClose={() => setAccountOpen(false)}
      >
        <Stack gap="md">
          {user.email !== displayName && (
            <Paragraph color="muted" size="sm">{user.email}</Paragraph>
          )}
          <div>
            <Button
              variant="secondary"
              icon="logout"
              onClick={() => { setAccountOpen(false); signOut(); }}
            >
              {resolveLabel('settings.signOut', store.locale, 'Sign Out')}
            </Button>
          </div>
        </Stack>
      </Dialog>
    </LabelsProvider>
  );
}
