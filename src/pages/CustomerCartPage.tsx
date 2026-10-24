import React, { useState } from 'react';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Store,
  MapPin,
  Clock
} from 'lucide-react';
import { appStore } from '../lib/store.ts';
import type { Profile } from '../lib/types.ts';

interface CustomerCartPageProps {
  currentUser: Profile;
  onNavigateToDiscovery: () => void;
}

export const CustomerCartPage: React.FC<CustomerCartPageProps> = ({
  currentUser,
  onNavigateToDiscovery,
}) => {
  const [submissionStatus, setSubmissionStatus] = useState<{
    success: boolean;
    message: string;
    orderId?: string;
    shopName?: string;
    finalTotal?: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { cart, items } = appStore.getActiveCart(currentUser.id);

  const totalPrice = items.reduce((sum, item) => {
    return sum + item.quantity * (item.shop_product?.price || 0);
  }, 0);

  const handleUpdateQuantity = (cartItemId: string, newQty: number) => {
    appStore.updateCartItemQuantity(cartItemId, newQty);
  };

  const handleRemove = (cartItemId: string) => {
    appStore.removeCartItem(cartItemId);
  };

  const handleClearCart = () => {
    appStore.clearActiveCart(currentUser.id);
  };

  const handleSubmitCart = () => {
    if (!cart) return;

    const currentShopName = cart.shop?.shop_name || 'Selected Grocery Shop';
    const currentTotal = totalPrice;

    setIsSubmitting(true);
    setSubmissionStatus(null);

    // Perform atomic submission with stock validation
    const result = appStore.submitCart(cart.id);
    setIsSubmitting(false);

    if (result.success) {
      setSubmissionStatus({
        success: true,
        message: result.message,
        orderId: cart.id.substring(0, 8).toUpperCase(),
        shopName: currentShopName,
        finalTotal: currentTotal,
      });
    } else {
      setSubmissionStatus({
        success: false,
        message: result.message,
      });
    }
  };

  if (submissionStatus?.success) {
    return (
      <div className="container" style={{ padding: '36px 20px', maxWidth: 650 }}>
        <div className="card" style={{ textAlign: 'center', padding: '36px 24px' }}>
          <CheckCircle size={48} style={{ color: 'var(--primary-green)', margin: '0 auto 16px' }} />
          <h1 style={{ marginBottom: 8 }}>Order Submitted Successfully!</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            Your grocery cart order request (Order #{submissionStatus.orderId}) has been received by <strong>{submissionStatus.shopName}</strong>.
          </p>
          <div
            style={{
              backgroundColor: 'var(--bg-accent-light)',
              borderRadius: 'var(--radius-sm)',
              padding: 16,
              marginBottom: 24,
              fontSize: 14,
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Shop:</span>
              <strong>{submissionStatus.shopName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Delivery / Pickup Address:</span>
              <span>{currentUser.location}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Order Total:</span>
              <strong style={{ color: 'var(--dark-green)' }}>₹{(submissionStatus.finalTotal ?? 0).toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Order Status:</span>
              <span className="badge" style={{ backgroundColor: '#D1E7D4', color: '#03543F' }}>
                Pending Shop Confirmation
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setSubmissionStatus(null);
                onNavigateToDiscovery();
              }}
            >
              Back to Grocery Discovery
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '24px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={onNavigateToDiscovery}
          aria-label="Back to grocery recommendations"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Continue Shopping</span>
        </button>
        <h1 style={{ fontSize: 24 }}>Your Shopping Cart</h1>
      </div>

      {submissionStatus && !submissionStatus.success && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0 }} aria-hidden="true" />
          <span>{submissionStatus.message}</span>
        </div>
      )}

      {!cart || items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <ShoppingCart size={42} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: 20, marginBottom: 6 }}>Your Cart is Empty</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
            Explore SmartCart's AI grocery recommendations to find the highest-quality and best-value items.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onNavigateToDiscovery}
          >
            Find Recommended Groceries
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)', gap: 24 }}>
          {/* Items List */}
          <div className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: 14,
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 16, fontWeight: 700 }}>
                  <Store size={18} style={{ color: 'var(--primary-green)' }} aria-hidden="true" />
                  <span>{cart.shop?.shop_name || 'Selected Grocery Shop'}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <MapPin size={13} aria-hidden="true" />
                  <span>{cart.shop?.location}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleClearCart}
                aria-label="Clear all items in cart"
              >
                Clear Cart
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {items.map(item => {
                const sp = item.shop_product;
                const itemTotal = (sp?.price || 0) * item.quantity;

                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>
                        {sp?.product?.name}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Package: {sp?.quantity_value} {sp?.quantity_unit} @ ₹{sp?.price} each
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      {/* Quantity Controls */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          backgroundColor: '#FFFFFF',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '2px 6px',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}
                          aria-label={`Decrease ${sp?.product?.name} quantity`}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}
                          aria-label={`Increase ${sp?.product?.name} quantity`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div style={{ minWidth: 70, textAlign: 'right', fontWeight: 700 }}>
                        ₹{itemTotal.toFixed(2)}
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--danger-color)',
                          padding: 4,
                          cursor: 'pointer',
                        }}
                        aria-label={`Remove ${sp?.product?.name} from cart`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary & Submit Panel */}
          <div>
            <div className="card" style={{ position: 'sticky', top: 80 }}>
              <h2 style={{ fontSize: 18, marginBottom: 14 }}>Order Summary</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Items Subtotal:</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Delivery Fee:</span>
                  <span style={{ color: '#047857', fontWeight: 600 }}>FREE (Demo)</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: 10,
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  <span>Total Payable:</span>
                  <span style={{ color: 'var(--dark-green)' }}>₹{totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 12,
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  marginBottom: 16,
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>
                  Delivery Destination:
                </div>
                <div>{currentUser.location}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Single-shop order policy enforced.
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
                onClick={handleSubmitCart}
                disabled={isSubmitting || items.length === 0}
              >
                {isSubmitting ? 'Verifying & Submitting...' : 'Submit Order Request'}
              </button>

              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 10 }}>
                Demo order request sent directly to shop owner's dashboard.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
