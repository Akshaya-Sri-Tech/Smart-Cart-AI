
import React, { useState } from 'react';
import {
  Eye, EyeOff, Lock, Mail, ShieldAlert, UserCheck,
} from 'lucide-react';
import type { UserRole } from '../lib/types.ts';
import { appStore } from '../lib/store.ts';

interface LoginFormProps {
  onLoginSuccess: (role: UserRole) => void;
  onNavigateToSignup: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  onNavigateToSignup,
}) => {
  const [role, setRole] = useState<UserRole>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const profile = await appStore.login(email, role, password);
      onLoginSuccess(profile.role);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Login failed. Check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoRole: UserRole) => {
    setRole(demoRole);
    setEmail(demoEmail);
    setPassword('password123');
    setErrorMessage(
      'Demo credentials selected. Click Log In to authenticate with Supabase.'
    );
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1 style={{ marginBottom: 6 }}>Welcome to SmartCart AI</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Sign in to compare groceries and find the best value.
          </p>
        </div>

        {errorMessage && (
          <div className="alert alert-error" role="alert">
            <ShieldAlert size={18} aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>Account Role</label>
            <div className="role-selector" role="radiogroup">
              {(['customer', 'owner'] as UserRole[]).map(item => (
                <button
                  key={item}
                  type="button"
                  role="radio"
                  aria-checked={role === item}
                  className={`role-btn ${role === item ? 'active' : ''}`}
                  onClick={() => setRole(item)}
                >
                  {item === 'customer' ? 'Customer' : 'Shop Owner'}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                required
              />
              <Mail
                size={16}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(value => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute', right: 8, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  padding: 4, color: 'var(--text-muted)', cursor: 'pointer',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={isLoading}
          >
            <Lock size={15} />
            <span>{isLoading ? 'Signing in...' : `Log In as ${role === 'customer' ? 'Customer' : 'Shop Owner'}`}</span>
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14 }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
          </span>
          <button
            type="button"
            onClick={onNavigateToSignup}
            style={{
              background: 'none', border: 'none',
              color: 'var(--primary-green)', fontWeight: 600,
              cursor: 'pointer', padding: 0,
            }}
          >
            Create an account
          </button>
        </div>

        </div>
    </div>
  );
};
