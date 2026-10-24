import React, { useState } from 'react';
import {
  Sparkles,
  ShoppingCart,
  Star,
  MapPin,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { ListingRecommendation, ProductRecommendationResult } from '../lib/types.ts';

interface ProductRecommendationCardProps {
  result: ProductRecommendationResult;
  onAddToCart: (shopProductId: string) => void;
  onExplainWithGemini?: (rec: ListingRecommendation) => void;
}

export const ProductRecommendationCard: React.FC<ProductRecommendationCardProps> = ({
  result,
  onAddToCart,
}) => {
  const [showComparison, setShowComparison] = useState(false);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [addedItemNotice, setAddedItemNotice] = useState<string | null>(null);

  const topRec = result.topRecommendation;

  const handleAdd = (shopProductId: string, shopName: string) => {
    onAddToCart(shopProductId);
    setAddedItemNotice(`Added from ${shopName}`);
    setTimeout(() => setAddedItemNotice(null), 2500);
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Product Title and Category */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <span className="badge badge-outline" style={{ marginBottom: 4 }}>
            {result.category}
          </span>
          <h2 style={{ fontSize: 20 }}>{result.productName}</h2>
        </div>

        {topRec && (
          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-top-pick" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={13} aria-hidden="true" />
              <span>SmartCart Top Pick</span>
            </span>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              Score: <strong>{topRec.scores.combinedScore}</strong>/100
            </div>
          </div>
        )}
      </div>

      {/* Top Recommendation Highlight Box */}
      {topRec ? (
        <div
          style={{
            backgroundColor: 'var(--bg-accent-light)',
            border: '1px solid #C4E2C7',
            borderRadius: 'var(--radius-sm)',
            padding: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark-green)' }}>
                {topRec.listing.shop?.shop_name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <MapPin size={13} style={{ color: 'var(--primary-green)' }} aria-hidden="true" />
                  {topRec.scores.distanceKm !== null ? `${topRec.scores.distanceKm} km away` : 'Proximity unknown'}
                </span>
                <span className="star-rating">
                  <Star size={13} fill="#D97706" color="#D97706" aria-hidden="true" />
                  <span>{topRec.scores.adjustedRating}</span> ({topRec.listing.rating_count} reviews)
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }}>
                ₹{topRec.listing.price}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                for {topRec.listing.quantity_value} {topRec.listing.quantity_unit}
                {' '}(<strong style={{ color: 'var(--primary-green)' }}>₹{topRec.scores.unitPrice}/{topRec.scores.standardUnit}</strong>)
              </div>
            </div>
          </div>

          {/* AI / Algorithmic Trade-off Explanation */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D1E7D4',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              fontSize: 14,
              color: 'var(--text-main)',
              lineHeight: 1.4,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              marginTop: 8,
            }}
          >
            <Sparkles size={16} style={{ color: 'var(--primary-green)', flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
            <div>
              <strong>Why this is recommended: </strong>
              <span>{result.explanation}</span>
            </div>
          </div>

          {/* Actions: Add to Cart and Toggle Factor Breakdown */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
            <button
              type="button"
              onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--dark-green)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: 0,
              }}
            >
              <Info size={14} aria-hidden="true" />
              <span>{showScoreBreakdown ? 'Hide score math' : 'View score breakdown'}</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => handleAdd(topRec.listing.id, topRec.listing.shop?.shop_name || '')}
              aria-label={`Add ${result.productName} from ${topRec.listing.shop?.shop_name} to cart`}
            >
              <ShoppingCart size={15} aria-hidden="true" />
              <span>Add to Cart (₹{topRec.listing.price})</span>
            </button>
          </div>

          {/* Detailed Score Breakdown Drawer */}
          {showScoreBreakdown && (
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px dashed #C4E2C7',
                fontSize: 13,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 10,
              }}
            >
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Quality (40%):</span>
                <div style={{ fontWeight: 700 }}>{topRec.scores.qualityScore}/100</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Bayesian: {topRec.scores.adjustedRating} / 5.0 (prior 3.5)
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Value (40%):</span>
                <div style={{ fontWeight: 700 }}>{topRec.scores.valueScore}/100</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  ₹{topRec.scores.unitPrice} per {topRec.scores.standardUnit}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Proximity (20%):</span>
                <div style={{ fontWeight: 700 }}>{topRec.scores.distanceScore}/100</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {topRec.scores.distanceKm !== null ? `${topRec.scores.distanceKm} km` : 'neutral'}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="alert alert-info">
          <AlertCircle size={16} aria-hidden="true" />
          <span>All listings for this product are currently out of stock.</span>
        </div>
      )}

      {/* Added feedback */}
      {addedItemNotice && (
        <div className="alert alert-success" style={{ margin: 0, padding: '8px 12px' }}>
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>{addedItemNotice}</span>
        </div>
      )}

      {/* Comparison Across All Shops */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
        <button
          type="button"
          onClick={() => setShowComparison(!showComparison)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '4px 0',
          }}
          aria-expanded={showComparison}
        >
          <span>Compare across {result.allListings.length} shops</span>
          {showComparison ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showComparison && (
          <div className="table-responsive" style={{ marginTop: 10 }}>
            <table>
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Package & Price</th>
                  <th>Unit Rate</th>
                  <th>Rating</th>
                  <th>Distance</th>
                  <th>Score</th>
                  <th>Stock</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {result.allListings.map(item => {
                  const isTop = item.isTopRecommendation;
                  const inStock = item.listing.stock_quantity > 0;

                  return (
                    <tr
                      key={item.listing.id}
                      style={{
                        backgroundColor: isTop ? 'var(--bg-accent-light)' : 'transparent',
                      }}
                    >
                      <td>
                        <strong>{item.listing.shop?.shop_name}</strong>
                        {isTop && (
                          <span
                            className="badge badge-top-pick"
                            style={{ fontSize: 11, marginLeft: 6, padding: '1px 5px' }}
                          >
                            Top Pick
                          </span>
                        )}
                      </td>
                      <td>
                        ₹{item.listing.price} ({item.listing.quantity_value} {item.listing.quantity_unit})
                      </td>
                      <td>
                        <strong style={{ color: 'var(--primary-green)' }}>
                          ₹{item.scores.unitPrice}/{item.scores.standardUnit}
                        </strong>
                      </td>
                      <td>
                        <span className="star-rating">
                          <Star size={12} fill="#D97706" color="#D97706" aria-hidden="true" />
                          <span>{item.scores.adjustedRating}</span>
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 3 }}>
                          ({item.listing.rating_count})
                        </span>
                      </td>
                      <td>
                        {item.scores.distanceKm !== null ? `${item.scores.distanceKm} km` : '—'}
                      </td>
                      <td>
                        <strong>{item.scores.combinedScore}</strong>
                      </td>
                      <td>
                        {inStock ? (
                          <span style={{ color: '#047857' }}>{item.listing.stock_quantity} in stock</span>
                        ) : (
                          <span style={{ color: 'var(--danger-color)', fontWeight: 600 }}>Out of stock</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          disabled={!inStock}
                          onClick={() => handleAdd(item.listing.id, item.listing.shop?.shop_name || '')}
                          aria-label={`Add from ${item.listing.shop?.shop_name}`}
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
