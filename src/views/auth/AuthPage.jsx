import { useState } from 'react';
import {
  Card, Stack, Heading, Paragraph, Section,
  TextField, Button, ButtonContainer, Banner, Link,
} from '@gtivr4/a1-design-system-react';
import { useLabel } from '@gtivr4/a1-design-system-react';
import { useAuth } from '../../lib/AuthContext.jsx';

// initialMode: 'login' | 'signup'
export function AuthPage({ initialMode = 'login', onBack }) {
  const l = useLabel;
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function switchTo(next) {
    setError(null);
    setPassword('');
    setMode(next);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await signIn(email, password);
    if (err) setError(err.message);
    setBusy(false);
    // On success, onAuthStateChange fires → App.jsx re-renders automatically
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await signUp(email, password);
    if (err) {
      setError(err.message);
    } else {
      setMode('check_email');
    }
    setBusy(false);
  }

  async function handleForgot(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await resetPassword(email);
    if (err) {
      setError(err.message);
    } else {
      setMode('check_email');
    }
    setBusy(false);
  }

  if (mode === 'check_email') {
    return (
      <Section contentWidth="xs" padding="md" height="hero">
        <Card>
          <Stack gap="lg" align="center">
            <Heading type="display" size="xl">{l('auth.checkEmailTitle', 'Check your email')}</Heading>
            <Paragraph color="muted" align="center">
              {(() => {
                const [before, after] = l('auth.checkEmailBody', 'We sent a link to {email}. Open it to continue — then come back here.').split('{email}');
                return <>{before}<strong>{email}</strong>{after}</>;
              })()}
            </Paragraph>
            <Link href="#" onClick={(e) => { e.preventDefault(); switchTo('login'); }}>
              {l('auth.backToLogin', 'Back to log in')}
            </Link>
          </Stack>
        </Card>
      </Section>
    );
  }

  if (mode === 'forgot') {
    return (
      <Section contentWidth="xs" padding="md" height="hero">
        <Card>
          <form onSubmit={handleForgot}>
            <Stack gap="lg">
              <Stack gap="xs">
                <Heading type="display" size="xl">{l('auth.resetTitle', 'Reset password')}</Heading>
                <Paragraph color="muted" size="sm">
                  {l('auth.resetSubtitle', "Enter your email and we'll send a reset link.")}
                </Paragraph>
              </Stack>
              {error && <Banner status="error">{error}</Banner>}
              <TextField
                label={l('auth.email', 'Email')}
                type="email"
                size="comfortable"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <ButtonContainer fillButtons>
                <Button type="submit" variant="primary" disabled={busy}>
                  {busy ? l('auth.sending', 'Sending…') : l('auth.sendReset', 'Send reset link')}
                </Button>
              </ButtonContainer>
              <Paragraph size="sm" align="center">
                <Link href="#" onClick={(e) => { e.preventDefault(); switchTo('login'); }}>
                  {l('auth.backToLogin', 'Back to log in')}
                </Link>
              </Paragraph>
            </Stack>
          </form>
        </Card>
      </Section>
    );
  }

  const isLogin = mode === 'login';

  return (
    <Section contentWidth="xs" padding="md" height="hero">
      <Card>
        <form onSubmit={isLogin ? handleLogin : handleSignUp}>
          <Stack gap="lg">
            {onBack && (
              <Button
                variant="tertiary"
                icon="arrow_back"
                size="sm"
                onClick={onBack}
                style={{ alignSelf: 'flex-start' }}
              >
                {l('common.back', 'Back')}
              </Button>
            )}
            <Stack gap="xs">
              <Heading type="display" size="xl" align="center">DownTrack</Heading>
              <Paragraph color="muted" size="sm" align="center">
                {isLogin
                  ? l('auth.loginSubtitle', 'Log in to your account')
                  : l('auth.signupSubtitle', 'Create an account to save your progress')}
              </Paragraph>
            </Stack>

            {error && <Banner status="error">{error}</Banner>}

            <Stack gap="md">
              <TextField
                label={l('auth.email', 'Email')}
                type="email"
                size="comfortable"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete={isLogin ? 'email' : 'username'}
              />
              <TextField
                label={l('auth.password', 'Password')}
                type="password"
                size="comfortable"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </Stack>

            {isLogin && (
              <Paragraph size="sm">
                <Link href="#" onClick={(e) => { e.preventDefault(); switchTo('forgot'); }}>
                  {l('auth.forgotPassword', 'Forgot password?')}
                </Link>
              </Paragraph>
            )}

            <ButtonContainer fillButtons>
              <Button type="submit" size="lg" variant="primary" disabled={busy}>
                {busy ? '…' : isLogin ? l('auth.login', 'Log in') : l('auth.createAccount', 'Create account')}
              </Button>
            </ButtonContainer>

            <Paragraph size="md" align="center">
              {isLogin ? `${l('auth.noAccount', "Don't have an account?")} ` : `${l('auth.haveAccount', 'Already have an account?')} `}
              <Link href="#" onClick={(e) => { e.preventDefault(); switchTo(isLogin ? 'signup' : 'login'); }}>
                {isLogin ? l('auth.signUp', 'Sign up') : l('auth.login', 'Log in')}
              </Link>
            </Paragraph>
          </Stack>
        </form>
      </Card>
    </Section>
  );
}
