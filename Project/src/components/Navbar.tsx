import React from 'react';
import { ShoppingBag, ShoppingCart, LogOut, Store, MapPin, Sparkles } from 'lucide-react';
import type { Profile } from '../lib/types.ts';

interface NavbarProps {
  currentUser: Profile | null;
  activeRoute: string;
  onNavigate: (route: string) => void;
  onLogout: () => void;
  cartItemCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeRoute,
  onNavigate,
  onLogout,
  cartItemCount,
}) => {
  return (
    <nav className="navbar" aria-label="Main Navigation">
      <div className="container navbar-inner">
        <button
          onClick={() => onNavigate(currentUser?.role === 'owner' ? '/owner' : '/customer')}
          className="brand"
          style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
          aria-label="SmartCart AI Home"
        >
          <ShoppingBag className="brand-icon" aria-hidden="true" />
          <span>SmartCart AI</span>
        </button>

        <div className="nav-links">
          {currentUser ? (
            <>
              {currentUser.role === 'customer' ? (
                <>
                  <button
                    onClick={() => onNavigate('/customer')}
                    className={`nav-item ${activeRoute === '/customer' ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none' }}
                  >
                    <Sparkles size={16} aria-hidden="true" />
                    <span>Recommendations</span>
                  </button>

                  <button
                    onClick={() => onNavigate('/customer/cart')}
                    className={`nav-item ${activeRoute === '/customer/cart' ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none' }}
                    aria-label={`View Cart with ${cartItemCount} items`}
                  >
                    <ShoppingCart size={16} aria-hidden="true" />
                    <span>Cart</span>
                    {cartItemCount > 0 && (
                      <span className="cart-badge" aria-label={`${cartItemCount} items`}>
                        {cartItemCount}
                      </span>
                    )}
                  </button>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 14,
                      color: 'var(--text-secondary)',
                      backgroundColor: 'var(--bg-subtle)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      maxWidth: '220px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={currentUser.location}
                  >
                    <MapPin size={14} style={{ color: 'var(--primary-green)', flexShrink: 0 }} aria-hidden="true" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentUser.location}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate('/owner')}
                    className={`nav-item ${activeRoute === '/owner' ? 'active' : ''}`}
                    style={{ background: 'none', border: 'none' }}
                  >
                    <Store size={16} aria-hidden="true" />
                    <span>Shop Dashboard & Carts</span>
                  </button>
                </>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  borderLeft: '1px solid var(--border-color)',
                  paddingLeft: 12,
                }}
              >
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{currentUser.email}</div>
                  <span
                    className="badge"
                    style={{
                      fontSize: 12,
                      padding: '1px 6px',
                      textTransform: 'capitalize',
                      backgroundColor: currentUser.role === 'owner' ? '#FEF3C7' : 'var(--badge-bg)',
                      color: currentUser.role === 'owner' ? '#92400E' : 'var(--badge-text)',
                    }}
                  >
                    {currentUser.role === 'owner' ? 'Shop Owner' : 'Customer'}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  className="btn btn-outline btn-sm"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut size={15} aria-hidden="true" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate('/login')}
                className={`btn ${activeRoute === '/login' ? 'btn-primary' : 'btn-outline'}`}
              >
                Login
              </button>
              <button
                onClick={() => onNavigate('/signup')}
                className={`btn ${activeRoute === '/signup' ? 'btn-primary' : 'btn-outline'}`}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
