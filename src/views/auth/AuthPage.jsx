import { useState } from 'react';
import {
  Card, Stack, Heading, Paragraph,
  TextField, Button, ButtonContainer, Banner,
} from '@gtivr4/a1-design-system-react';
import { useAuth } from '../../lib/AuthContext.jsx';

const linkStyle = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: 'var(--semantic-color-action-background)',
  cursor: 'pointer',
  fontSize: 'inherit',
  textDecoration: 'underline',
  fontFamily: 'inherit',
};

const containerStyle = {
  minHeight: '100dvh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 16px',
};

// initialMode: 'login' | 'signup'
export function AuthPage({ initialMode = 'login' }) {
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
      <div style={containerStyle}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <Card>
            <Stack gap="lg" align="center">
              <Heading type="display" size="xl">Check your email</Heading>
              <Paragraph color="muted" align="center">
                We sent a link to <strong>{email}</strong>. Open it to continue — then come back here.
              </Paragraph>
              <button style={linkStyle} onClick={() => switchTo('login')}>
                Back to log in
              </button>
            </Stack>
          </Card>
        </div>
      </div>
    );
  }

  if (mode === 'forgot') {
    return (
      <div style={containerStyle}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <Card>
            <form onSubmit={handleForgot}>
              <Stack gap="lg">
                <Stack gap="xs">
                  <Heading type="display" size="xl">Reset password</Heading>
                  <Paragraph color="muted" size="sm">
                    Enter your email and we'll send a reset link.
                  </Paragraph>
                </Stack>
                {error && <Banner status="error">{error}</Banner>}
                <TextField
                  label="Email"
                  type="email"
                  size="comfortable"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <ButtonContainer fillButtons>
                  <Button type="submit" variant="primary" disabled={busy}>
                    {busy ? 'Sending…' : 'Send reset link'}
                  </Button>
                </ButtonContainer>
                <Paragraph size="sm" align="center">
                  <button style={linkStyle} type="button" onClick={() => switchTo('login')}>
                    Back to log in
                  </button>
                </Paragraph>
              </Stack>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  const isLogin = mode === 'login';

  return (
    <div style={containerStyle}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <Card>
          <form onSubmit={isLogin ? handleLogin : handleSignUp}>
            <Stack gap="lg">
              <Stack gap="xs">
                <Heading type="display" size="xxl" align="center">DownTrack</Heading>
                <Paragraph color="muted" size="sm" align="center">
                  {isLogin ? 'Log in to your account' : 'Create an account to save your progress'}
                </Paragraph>
              </Stack>

              {error && <Banner status="error">{error}</Banner>}

              <Stack gap="md">
                <TextField
                  label="Email"
                  type="email"
                  size="comfortable"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete={isLogin ? 'email' : 'username'}
                />
                <TextField
                  label="Password"
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
                  <button style={linkStyle} type="button" onClick={() => switchTo('forgot')}>
                    Forgot password?
                  </button>
                </Paragraph>
              )}

              <ButtonContainer fillButtons>
                <Button type="submit" variant="primary" disabled={busy}>
                  {busy ? '…' : isLogin ? 'Log in' : 'Create account & save'}
                </Button>
              </ButtonContainer>

              <Paragraph size="sm" align="center">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button
                  style={linkStyle}
                  type="button"
                  onClick={() => switchTo(isLogin ? 'signup' : 'login')}
                >
                  {isLogin ? 'Sign up' : 'Log in'}
                </button>
              </Paragraph>
            </Stack>
          </form>
        </Card>
      </div>
    </div>
  );
}
