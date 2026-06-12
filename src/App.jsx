import { useState, useEffect, lazy, Suspense } from 'react';
import {
  LabelsProvider, PageLayout, TopHeader, BottomDrawer,
  Stack, Button, Paragraph, CircularProgress,
  Menu, MenuSection, MenuItem,
} from '@gtivr4/a1-design-system-react';
import { useStore, LEGACY_STORAGE_KEY } from './store/useStore.js';
import { useAuth } from './lib/AuthContext.jsx';
import { supabaseConfigured } from './lib/supabase.js';
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

// ─── Screens ─────────────────────────────────────────────────────────────────

const loadingStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  minHeight: '100dvh',
};

function LoadingScreen() {
  return (
    <div style={loadingStyle} aria-busy="true">
      <CircularProgress size="lg" indeterminate aria-label="Loading" />
    </div>
  );
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

// ─── App ─────────────────────────────────────────────────────────────────────
// view state machine:
//   'loading'   — auth or data not yet settled
//   'onboarding'— unauthenticated new user, or authenticated post-reset
//   'login'     — user tapped "Sign In" from onboarding
//   'signup'    — user completed onboarding steps, needs to create account
//   'app'       — authenticated + profile loaded

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const store = useStore();

  const [view, setView]                   = useState('loading');
  const [pendingProfile, setPendingProfile] = useState(loadPendingProfile);
  // reonboard: set only when the user resets their data while in the app. It's the
  // sole reason an authenticated user is sent back through onboarding. Signing in
  // always lands on the app, even if the account has no profile yet.
  const [reonboard, setReonboard]         = useState(false);
  const [page, setPage]                   = useState(() => pageFromPath(window.location.pathname));
  const [accountOpen, setAccountOpen]     = useState(false);
  const [migrationBusy, setMigrationBusy] = useState(false);
  const [migrationError, setMigrationError] = useState(null);
  const [showMigration, setShowMigration] = useState(false);

  // ─── View state machine ──────────────────────────────────────────────────────
  // Drives transitions; never derives view from momentarily-stale async state.
  // The explicit 'view' variable means the one-render gap after login renders
  // the PREVIOUS screen (e.g. 'login') rather than flashing 'onboarding'.
  useEffect(() => {
    if (authLoading) { setView('loading'); return; }

    if (user) {
      // Wait for Supabase fetch to complete for this user session.
      if (store.dataLoading || !store.settled) { setView('loading'); return; }
      // A profile exists → straight to the app.
      if (store.profile) { setReonboard(false); setView('app'); return; }
      // Pending profile still needs to be written (new signup) — show loading.
      if (pendingProfile) { setView('loading'); return; }
      // No profile: only re-onboard if the user explicitly reset their data.
      // Otherwise (e.g. signing in) go to the app — CheckIn prompts to finish setup.
      setView(reonboard ? 'onboarding' : 'app');
      return;
    }

    // Unauthenticated — the auth/onboarding views are sticky once set. Transitions
    // happen via explicit handlers (onSignIn → login, onComplete → signup,
    // onBack → onboarding), so the effect must not bounce them around.
    if (view === 'login' || view === 'signup' || view === 'onboarding') return;
    // First resolution out of 'loading' (or after sign-out): pick up a persisted
    // pending profile so an email-confirmation reload returns to signup.
    setView(pendingProfile ? 'signup' : 'onboarding');
  }, [authLoading, user, store.dataLoading, store.settled, store.profile, pendingProfile, reonboard, view]);

  // ─── Pending profile → Supabase ─────────────────────────────────────────────
  // After a new signup, save the profile that was collected during onboarding.
  useEffect(() => {
    if (user && store.settled && !store.profile && pendingProfile) {
      store.saveProfile(pendingProfile);
      clearPendingProfile();
      setPendingProfile(null);
    }
  }, [user, store.settled, store.profile, pendingProfile]);

  // ─── Migration offer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (view === 'app') {
      setShowMigration(hasMigratableData() && !migrationAlreadyHandled());
    }
  }, [view]);

  // ─── Browser back/forward ────────────────────────────────────────────────────
  useEffect(() => {
    function onPop() { setPage(pageFromPath(window.location.pathname)); }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // ─── Document title ──────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.lang = store.locale;
    const [titleKey, fallback] = PAGE_TITLE_KEYS[page] ?? ['app.name', 'DownTrack'];
    document.title = resolveLabel(titleKey, store.locale, fallback);
  }, [page, store.locale]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  function navigate(newPage) {
    setPage(newPage);
    window.history.pushState(null, '', `/${newPage}`);
  }

  function handleOnboardingComplete(profile) {
    if (user) {
      // Already authenticated (e.g. re-onboarding after data reset).
      store.saveProfile(profile);
      // view effect will fire and set view to 'app' once profile is in store.
    } else {
      savePendingProfile(profile);
      setPendingProfile(profile);
      setView('signup');
    }
  }

  function handleResetData() {
    store.reset();
    setReonboard(true);
  }

  // Back from the auth screen (create-account / sign-in) → return to onboarding.
  // pendingProfile is kept so the onboarding form is restored where they left off.
  function handleAuthBack() {
    setView('onboarding');
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

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (!supabaseConfigured) return <ConfigErrorScreen />;

  if (view === 'loading') return <LoadingScreen />;

  if (view === 'onboarding') return (
    <LabelsProvider labels={labels} locale={store.locale}>
      <Suspense fallback={<LoadingScreen />}>
        <Onboarding
          onComplete={handleOnboardingComplete}
          onSignIn={!user ? () => setView('login') : undefined}
          initialProfile={pendingProfile}
        />
      </Suspense>
    </LabelsProvider>
  );

  if (view === 'login' || view === 'signup') return (
    <LabelsProvider labels={labels} locale={store.locale}>
      <Suspense fallback={<LoadingScreen />}>
        <AuthPage initialMode={view === 'signup' ? 'signup' : 'login'} onBack={handleAuthBack} />
      </Suspense>
    </LabelsProvider>
  );

  // ─── view === 'app' ──────────────────────────────────────────────────────────
  // Safety: sign-out sets user=null one render before the view effect corrects to 'onboarding'.
  if (!user) return <LoadingScreen />;

  const appName = resolveLabel('app.name', store.locale, 'DownTrack');
  const displayName = store.profile?.name || user.email;

  const navItems = [
    { id: 'checkin',  label: resolveLabel('nav.checkin',  store.locale, 'Check In'),  href: '/checkin',  icon: 'monitor_weight', active: page === 'checkin',  onClick: (e) => { e.preventDefault(); navigate('checkin'); } },
    { id: 'data',     label: resolveLabel('nav.data',     store.locale, 'Data'),      href: '/data',     icon: 'bar_chart',      active: page === 'data',     onClick: (e) => { e.preventDefault(); navigate('data'); } },
    { id: 'settings', label: resolveLabel('nav.settings', store.locale, 'Settings'),  href: '/settings', icon: 'settings',       active: page === 'settings', onClick: (e) => { e.preventDefault(); navigate('settings'); } },
  ];

  const headerActions = [{
    id: 'user',
    icon: 'account_circle',
    label: resolveLabel('settings.account', store.locale, 'Account'),
    items: [
      { isHeader: true, label: displayName, description: user.email !== displayName ? user.email : undefined },
      { icon: 'logout', label: resolveLabel('settings.signOut', store.locale, 'Sign Out'), onClick: signOut },
    ],
  }];

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

  return (
    <LabelsProvider labels={labels} locale={store.locale}>
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
          {page === 'settings' && <SettingsPage store={store} onSignOut={signOut} onResetData={handleResetData} />}
        </PageLayout>
      </Suspense>

      <BottomDrawer
        items={bottomNavItems}
        aria-label={resolveLabel('nav.main', store.locale, 'Main navigation')}
        className="bottom-nav-ds"
      />

      <Menu
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        aria-label={resolveLabel('settings.account', store.locale, 'Account')}
      >
        <MenuSection label={displayName}>
          {user.email !== displayName && (
            <Paragraph
              size="sm"
              color="muted"
              style={{ padding: '0 var(--base-spacing-8) var(--base-spacing-4)' }}
            >
              {user.email}
            </Paragraph>
          )}
          <MenuItem
            icon="logout"
            onClick={() => { setAccountOpen(false); signOut(); }}
          >
            {resolveLabel('settings.signOut', store.locale, 'Sign Out')}
          </MenuItem>
        </MenuSection>
      </Menu>
    </LabelsProvider>
  );
}
