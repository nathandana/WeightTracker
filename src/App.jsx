import { useState } from 'react';
import {
  LabelsProvider, PageLayout, TopHeader,
} from '@gtivr4/a1-design-system-react';
import { useStore } from './store/useStore.js';
import { Onboarding } from './views/Onboarding.jsx';
import { CheckIn } from './views/CheckIn.jsx';
import { DataPage } from './views/DataPage.jsx';
import { SettingsPage } from './views/SettingsPage.jsx';
import { SettingsMenu } from './components/SettingsMenu.jsx';
import { MOCK_SCENARIOS } from './dev/mockScenarios.js';
import labels from './labels/labels.json';

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

export default function App() {
  const store = useStore();
  const [activeScenario, setActiveScenario] = useState('real');
  const [page, setPage] = useState('checkin');

  function handleOnboardingComplete(profile) {
    store.saveProfile(profile);
  }

  function handleScenarioChange(e) {
    const id = e.target.value;
    setActiveScenario(id);
    if (id === 'real') {
      store.restoreRealData();
    } else {
      const scenario = MOCK_SCENARIOS.find(s => s.id === id);
      if (scenario?.state) store.loadMockData(scenario.state);
    }
  }

  const appName = resolveLabel('app.name', store.locale, 'DownTrack');

  const navItems = [
    { label: 'Check In', href: '#', icon: 'monitor_weight', active: page === 'checkin', onClick: (e) => { e.preventDefault(); setPage('checkin'); } },
    { label: 'Data',     href: '#', icon: 'bar_chart',      active: page === 'data',    onClick: (e) => { e.preventDefault(); setPage('data'); } },
    { label: 'Settings', href: '#', icon: 'settings',       active: page === 'settings', onClick: (e) => { e.preventDefault(); setPage('settings'); } },
  ];

  const header = store.profile ? (
    <TopHeader logoText={appName} logoHref="#" navItems={navItems} />
  ) : null;

  const devBar = (
    <div style={devBarStyle}>
      <span>🧪 Dev</span>
      <select style={devSelectStyle} value={activeScenario} onChange={handleScenarioChange}>
        {MOCK_SCENARIOS.map(s => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <LabelsProvider labels={labels} locale={store.locale}>
      {import.meta.env.DEV && devBar}
      {store.profile && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: 'var(--component-top-header-height)',
          display: 'flex',
          alignItems: 'center',
          paddingInlineEnd: '12px',
          zIndex: 'calc(var(--component-top-header-z-index) + 1)',
        }}>
          <SettingsMenu
            locale={store.locale}
            setLocale={store.setLocale}
            onReset={store.reset}
          />
        </div>
      )}
      {!store.profile ? (
        <Onboarding onComplete={handleOnboardingComplete} />
      ) : (
        <PageLayout header={header}>
          {page === 'checkin'  && <CheckIn store={store} onNavigate={setPage} />}
          {page === 'data'     && <DataPage store={store} onNavigate={setPage} />}
          {page === 'settings' && <SettingsPage />}
        </PageLayout>
      )}
    </LabelsProvider>
  );
}
