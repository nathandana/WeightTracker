import { useState } from 'react';
import {
  LabelsProvider, PageLayout, TopHeader, Section,
} from '@gtivr4/a1-design-system-react';
import { useStore } from './store/useStore.js';
import { Onboarding } from './views/Onboarding.jsx';
import { WelcomeResults } from './views/WelcomeResults.jsx';
import { CheckIn } from './views/CheckIn.jsx';
import { Progress } from './views/Progress.jsx';
import { Profile } from './views/Profile.jsx';
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
  const [view, setView] = useState('today');
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeScenario, setActiveScenario] = useState('real');

  function handleOnboardingComplete(profile) {
    store.saveProfile(profile);
    setShowWelcome(true);
  }

  function handleScenarioChange(e) {
    const id = e.target.value;
    setActiveScenario(id);
    setView('today');
    if (id === 'real') {
      store.restoreRealData();
    } else {
      const scenario = MOCK_SCENARIOS.find(s => s.id === id);
      if (scenario?.state) store.loadMockData(scenario.state);
    }
  }

  const appName = resolveLabel('app.name', store.locale, 'Journey Check-In');

  const navItems = [
    {
      id: 'today',
      label: resolveLabel('nav.today', store.locale, 'Today'),
      icon: 'home',
      active: view === 'today',
      onClick: () => setView('today'),
    },
    {
      id: 'progress',
      label: resolveLabel('nav.progress', store.locale, 'Progress'),
      icon: 'bar_chart',
      active: view === 'progress',
      onClick: () => setView('progress'),
    },
    {
      id: 'profile',
      label: resolveLabel('nav.profile', store.locale, 'Profile'),
      icon: 'person',
      active: view === 'profile',
      onClick: () => setView('profile'),
    },
  ];

  const header = store.profile && !showWelcome ? (
    <TopHeader
      logoText={appName}
      logoHref="#"
      navItems={navItems}
    />
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
      {devBar}
      {!store.profile ? (
        <Onboarding onComplete={handleOnboardingComplete} />
      ) : showWelcome ? (
        <WelcomeResults profile={store.profile} onDone={() => setShowWelcome(false)} />
      ) : (
        <PageLayout header={header}>
            {view === 'today'    && <CheckIn  store={store} navigate={setView} />}
            {view === 'progress' && <Progress store={store} />}
            {view === 'profile'  && <Profile  store={store} />}
        </PageLayout>
      )}
    </LabelsProvider>
  );
}
