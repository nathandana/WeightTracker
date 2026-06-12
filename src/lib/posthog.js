// PostHog analytics — initialised only when VITE_POSTHOG_KEY is set, so dev
// builds without the env var stay off and never pollute production data.
import posthog from 'posthog-js';

const KEY = import.meta.env.VITE_POSTHOG_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

export const posthogEnabled = !!KEY;

export function initPostHog() {
  if (!posthogEnabled || typeof window === 'undefined') return;
  posthog.init(KEY, {
    api_host: HOST,
    // 2025 defaults enable history-based $pageview capture, which is what this
    // manual-routing SPA needs (a view on every navigation, not just first load).
    defaults: '2025-05-24',
    person_profiles: 'identified_only',
  });
}

export { posthog };
