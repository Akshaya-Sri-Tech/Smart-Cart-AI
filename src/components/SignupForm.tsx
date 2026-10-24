
import React, { useState } from 'react';
import {
  Eye, EyeOff, UserPlus, Mail, MapPin, ShieldAlert,
} from 'lucide-react';
import type { UserRole } from '../lib/types.ts';
import { appStore } from '../lib/store.ts';

interface SignupFormProps {
  onSignupSuccess: (role: UserRole) => void;
  onNavigateToLogin: () => void;
}

const LOCATION_PRESETS = [
  { name: 'Indiranagar, Bangalore', lat: 12.9784, lon: 77.6408 },
  { name: 'Domlur, Bangalore', lat: 12.9609, lon: 77.6387 },
  { name: 'Koramangala, Bangalore', lat: 12.9352, lon: 77.6245 },
  { name: 'Whitefield, Bangalore', lat: 12.9698, lon: 77.7499 },
  { name: 'HSR Layout, Bangalore', lat: 12.9121, lon: 77.6446 },
];

export const SignupForm: React.FC<SignupFormProps> = ({
  onSignupSuccess,
  onNavigateToLogin,
}) => {
  const [role, setRole] = useState<UserRole>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [locationName, setLocationName] = useState(LOCATION_PRESETS[0].name);
  const [latitude, setLatitude] = useState<number>(LOCATION_PRESETS[0].lat);
  const [longitude, setLongitude] = useState<number>(LOCATION_PRESETS[0].lon);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePresetChange = (name: string) => {
    const preset = LOCATION_PRESETS.find(item => item.name === name);
    if (!preset) return;

    setLocationName(preset.name);
    setLatitude(preset.lat);
    setLongitude(preset.lon);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!locationName.trim()) {
      setErrorMessage('Please provide your location.');
      return;
    }

    setIsLoading(true);

    try {
      const profile = await appStore.signup(
        email,
        role,
        locationName,
        latitude,
        longitude,
        password
      );
      onSignupSuccess(profile.role);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Registration failed.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1 style={{ marginBottom: 6 }}>Create SmartCart Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Register as a Customer or Shop Owner.
          </p>
        </div>

        {errorMessage && (
          <div className="alert alert-error" role="alert">
            <ShieldAlert size={18} />
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
            <label htmlFor="signup-email">Account Email</label>
            <div style={{ position: 'relative' }}>
              <input
                id="signup-email"
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
            <label htmlFor="signup-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
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

          <div className="form-group">
            <label htmlFor="signup-confirm-password">Confirm Password</label>
            <input
              id="signup-confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-location">
              {role === 'customer' ? 'Customer Delivery Location' : 'Shop Physical Location'}
            </label>

            <select
              id="signup-location-preset"
              value={LOCATION_PRESETS.some(p => p.name === locationName) ? locationName : ''}
              onChange={e => handlePresetChange(e.target.value)}
              style={{ marginBottom: 8 }}
            >
              <option value="">Choose a preset location</option>
              {LOCATION_PRESETS.map(preset => (
                <option key={preset.name} value={preset.name}>{preset.name}</option>
              ))}
            </select>

            <div style={{ position: 'relative' }}>
              <input
                id="signup-location"
                type="text"
                value={locationName}
                onChange={e => setLocationName(e.target.value)}
                placeholder="Street address or locality"
                required
              />
              <MapPin
                size={16}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--primary-green)', pointerEvents: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
              <div>
                <label htmlFor="signup-latitude">Latitude</label>
                <input
                  id="signup-latitude"
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={e => setLatitude(Number(e.target.value))}
                />
              </div>
              <div>
                <label htmlFor="signup-longitude">Longitude</label>
                <input
                  id="signup-longitude"
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={e => setLongitude(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 12 }}
            disabled={isLoading}
          >
            <UserPlus size={16} />
            <span>
              {isLoading ? 'Creating account...' : `Sign Up as ${role === 'customer' ? 'Customer' : 'Shop Owner'}`}
            </span>
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14 }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
          </span>
          <button
            type="button"
            onClick={onNavigateToLogin}
            style={{
              background: 'none', border: 'none',
              color: 'var(--primary-green)', fontWeight: 600,
              cursor: 'pointer', padding: 0,
            }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};
