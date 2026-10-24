
import React, { useState, useEffect, useCallback } from 'react';

import { Navbar } from './components/Navbar.tsx';
import { LoginForm } from './components/LoginForm.tsx';
import { SignupForm } from './components/SignupForm.tsx';

import { CustomerDiscoveryPage } from './pages/CustomerDiscoveryPage.tsx';
import { CustomerCartPage } from './pages/CustomerCartPage.tsx';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage.tsx';

import { appStore } from './lib/store.ts';
import type { Profile, UserRole } from './lib/types.ts';

import {
  BookOpen,
  X,
  Sparkles,
  LoaderCircle,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(
    () => appStore.getCurrentUser()
  );

  const [currentRoute, setCurrentRoute] = useState('/login');
  const [showDocumentation, setShowDocumentation] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(
    null
  );

  // Restore the authenticated user and subscribe to store changes.
  useEffect(() => {
    let mounted = true;

    const syncStoreState = () => {
      if (!mounted) return;

      const user = appStore.getCurrentUser();

      setCurrentUser(user);

      if (user?.role === 'customer') {
        const { items } = appStore.getActiveCart(user.id);

        const totalQuantity = items.reduce(
          (total, item) => total + Number(item.quantity || 0),
          0
        );

        setCartCount(totalQuantity);
      } else {
        setCartCount(0);
      }
    };

    const unsubscribe = appStore.subscribe(syncStoreState);

    const initialize = async () => {
      try {
        /*
         * If your store implements initialize(), use it to restore the
         * Supabase session and load the required application data.
         *
         * The optional check keeps this component compatible with a store
         * that does not yet implement initialize().
         */
        const storeWithInitialize = appStore as typeof appStore & {
          initialize?: () => Promise<void>;
        };

        if (typeof storeWithInitialize.initialize === 'function') {
          await storeWithInitialize.initialize();
        }

        if (!mounted) return;

        syncStoreState();
        setInitializationError(null);
      } catch (error) {
        console.error('SmartCart initialization failed:', error);

        if (mounted) {
          setInitializationError(
            error instanceof Error
              ? error.message
              : 'Could not initialize SmartCart. Please try again.'
          );
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    void initialize();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Keep the route consistent with the authenticated user's role.
  useEffect(() => {
    if (isInitializing) return;

    if (!currentUser) {
      setCurrentRoute((route) =>
        route === '/signup' ? '/signup' : '/login'
      );
      return;
    }

    if (currentUser.role === 'customer') {
      setCurrentRoute((route) =>
        route === '/login' ||
        route === '/signup' ||
        route === '/owner'
          ? '/customer'
          : route
      );
    } else if (currentUser.role === 'owner') {
      setCurrentRoute((route) =>
        route === '/login' ||
        route === '/signup' ||
        route === '/customer' ||
        route === '/customer/cart'
          ? '/owner'
          : route
      );
    }
  }, [currentUser, isInitializing]);

  const handleNavigate = useCallback(
    (route: string) => {
      // Prevent customers and owners from accessing the other role's pages.
      if (
        currentUser?.role === 'customer' &&
        route === '/owner'
      ) {
        return;
      }

      if (
        currentUser?.role === 'owner' &&
        (route === '/customer' || route === '/customer/cart')
      ) {
        return;
      }

      // Only allow known application routes.
      const allowedRoutes = [
        '/login',
        '/signup',
        '/customer',
        '/customer/cart',
        '/owner',
      ];

      if (!allowedRoutes.includes(route)) return;

      // Unauthenticated users may only navigate between auth pages.
      if (
        !currentUser &&
        route !== '/login' &&
        route !== '/signup'
      ) {
        return;
      }

      setCurrentRoute(route);
    },
    [currentUser]
  );

  const handleLogout = useCallback(() => {
    try {
      appStore.logout();
      setCurrentUser(null);
      setCartCount(0);
      setCurrentRoute('/login');
      setInitializationError(null);
    } catch (error) {
      console.error('Logout failed:', error);
      setInitializationError(
        'Could not log out successfully. Please try again.'
      );
    }
  }, []);

  const handleAuthSuccess = useCallback((role: UserRole) => {
    setCurrentRoute(role === 'owner' ? '/owner' : '/customer');
  }, []);

  // Display a loading screen while restoring the Supabase session.
  if (isInitializing) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          backgroundColor: 'var(--bg-color, #f8fafc)',
        }}
        role="status"
        aria-live="polite"
      >
        <LoaderCircle
          size={32}
          className="animate-spin"
          aria-hidden="true"
        />
        <strong>Loading SmartCart AI...</strong>
        <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Restoring your session and preparing your store.
        </span>
      </div>
    );
  }

  // Surface initialization errors instead of silently switching to local data.
  if (initializationError) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <h1>SmartCart AI could not start</h1>

        <p style={{ maxWidth: 560, color: 'var(--text-secondary)' }}>
          {initializationError}
        </p>

        <p style={{ maxWidth: 560, fontSize: 13 }}>
          Check your Supabase configuration, database permissions, and
          browser console for details.
        </p>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Navbar
        currentUser={currentUser}
        activeRoute={currentRoute}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        cartItemCount={cartCount}
      />

      <main style={{ flex: 1 }}>
        {currentRoute === '/login' && !currentUser && (
          <LoginForm
            onLoginSuccess={handleAuthSuccess}
            onNavigateToSignup={() => setCurrentRoute('/signup')}
          />
        )}

        {currentRoute === '/signup' && !currentUser && (
          <SignupForm
            onSignupSuccess={handleAuthSuccess}
            onNavigateToLogin={() => setCurrentRoute('/login')}
          />
        )}

        {currentRoute === '/customer' &&
          currentUser?.role === 'customer' && (
            <CustomerDiscoveryPage
              currentUser={currentUser}
              onNavigateToCart={() =>
                setCurrentRoute('/customer/cart')
              }
            />
          )}

        {currentRoute === '/customer/cart' &&
          currentUser?.role === 'customer' && (
            <CustomerCartPage
              currentUser={currentUser}
              onNavigateToDiscovery={() =>
                setCurrentRoute('/customer')
              }
            />
          )}

        {currentRoute === '/owner' &&
          currentUser?.role === 'owner' && (
            <OwnerDashboardPage currentUser={currentUser} />
          )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-color)',
          backgroundColor: '#FFFFFF',
          padding: '16px 20px',
          marginTop: 'auto',
          fontSize: 14,
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ color: 'var(--text-secondary)' }}>
            <strong>SmartCart AI</strong> — Quality, Value &amp; Proximity
            Optimization System
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setShowDocumentation(true)}
            aria-label="View Project Architecture and Setup Guide"
          >
            <BookOpen size={14} aria-hidden="true" />
            <span>Project &amp; Algorithm Guide</span>
          </button>
        </div>
      </footer>

      {/* Architecture and Documentation Modal */}
      {showDocumentation && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 200,
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="doc-modal-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowDocumentation(false);
            }
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 720,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Sparkles
                  size={20}
                  style={{ color: 'var(--primary-green)' }}
                  aria-hidden="true"
                />

                <h2 id="doc-modal-title" style={{ fontSize: 20 }}>
                  SmartCart AI — Architecture &amp; Guide
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowDocumentation(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                }}
                aria-label="Close documentation"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                fontSize: 14,
              }}
            >
              <section>
                <h3 style={{ fontSize: 16, marginBottom: 4 }}>
                  1. Multi-Factor Scoring Formula
                </h3>

                <p
                  style={{
                    color: 'var(--text-secondary)',
                    marginBottom: 8,
                  }}
                >
                  SmartCart AI balances quality, value, and proximity on
                  a 0–100 scale.
                </p>

                <div
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    padding: 12,
                    borderRadius: 4,
                    fontFamily: 'monospace',
                    fontSize: 13,
                  }}
                >
                  Combined Score = 0.40 × Quality + 0.40 × Value + 0.20 ×
                  Distance
                </div>

                <ul
                  style={{
                    paddingLeft: 20,
                    marginTop: 8,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <li>
                    <strong>Quality Score (40%):</strong> Bayesian-adjusted
                    rating: <code>(n × R + m × C) / (n + m)</code>, with
                    prior C = 3.5 and m = 5. This reduces the influence of
                    ratings based on very few reviews.
                  </li>

                  <li>
                    <strong>Quantity-for-Price Value (40%):</strong>{' '}
                    Compares normalized quantities and prices using
                    standard-unit pricing.
                  </li>

                  <li>
                    <strong>Distance / Proximity (20%):</strong> Uses the
                    Haversine great-circle distance in kilometres and the
                    configured distance-decay function.
                  </li>
                </ul>
              </section>

              <section>
                <h3 style={{ fontSize: 16, marginBottom: 4 }}>
                  2. Supabase Integration
                </h3>

                <p style={{ color: 'var(--text-secondary)' }}>
                  Supabase PostgreSQL stores profiles, shops, products,
                  shop listings, carts, and cart items. The database
                  schema and sample data scripts are in{' '}
                  <code>supabase/schema.sql</code> and{' '}
                  <code>supabase/seed.sql</code>. Row Level Security (RLS)
                  should restrict private records to authorized users.
                </p>
              </section>

              <section>
                <h3 style={{ fontSize: 16, marginBottom: 4 }}>
                  3. Gemini API Integration
                </h3>

                <p style={{ color: 'var(--text-secondary)' }}>
                  The server-side <code>/api/ai-explanation</code> endpoint
                  can use Gemini to generate concise explanations of
                  recommendation trade-offs. Keep the Gemini API key on
                  the server and never expose it in frontend environment
                  variables.
                </p>
              </section>

              <section>
                <h3 style={{ fontSize: 16, marginBottom: 4 }}>
                  4. Demo Accounts
                </h3>

                <p style={{ color: 'var(--text-secondary)' }}>
                  Create customer and shop-owner accounts through the
                  signup flow or Supabase Authentication. Accounts must
                  exist in Supabase Auth before they can sign in; the
                  database seed script alone does not create login
                  credentials.
                </p>
              </section>
            </div>

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowDocumentation(false)}
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
