import React from 'react';
import ReactDOM from 'react-dom/client';
import { PostHogProvider } from 'posthog-js/react';
import App from './App.jsx';
import { AuthProvider } from './lib/AuthContext.jsx';
import { posthog, posthogEnabled, initPostHog } from './lib/posthog.js';

import '@gtivr4/a1-design-system-react/tokens.css';
import '@gtivr4/a1-design-system-react/themes.css';
import '@gtivr4/a1-design-system-react/breakpoints.css';
import '@gtivr4/a1-design-system-react/color-scheme.css';
import './App.css';

document.documentElement.classList.add('a1-theme-fresh');

// No-op unless VITE_POSTHOG_KEY is set.
initPostHog();

const tree = (
  <AuthProvider>
    <App />
  </AuthProvider>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {posthogEnabled ? <PostHogProvider client={posthog}>{tree}</PostHogProvider> : tree}
  </React.StrictMode>
);
