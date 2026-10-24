import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  ArrowUpDown,
  MapPin,
  AlertTriangle,
  RefreshCw,
  Store,
  Info
} from 'lucide-react';
import { appStore } from '../lib/store.ts';
import { evaluateProductListings } from '../lib/recommendation-engine.ts';
import { ProductRecommendationCard } from '../components/ProductRecommendationCard.tsx';
import type { Profile, ProductRecommendationResult } from '../lib/types.ts';

interface CustomerDiscoveryPageProps {
  currentUser: Profile;
  onNavigateToCart: () => void;
}

export const CustomerDiscoveryPage: React.FC<CustomerDiscoveryPageProps> = ({
  currentUser,
  onNavigateToCart,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedShopId, setSelectedShopId] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'recommended' | 'unit_price' | 'rating' | 'distance'>('recommended');
  const [shopConflictModal, setShopConflictModal] = useState<{
    pendingShopProductId: string;
    currentShopName: string;
  } | null>(null);

  // Store subscription
  const [products, setProducts] = useState(appStore.getProducts());
  const [shops, setShops] = useState(appStore.getShops());
  const [shopProducts, setShopProducts] = useState(appStore.getShopProducts());

  useEffect(() => {
    const unsubscribe = appStore.subscribe(() => {
      setProducts(appStore.getProducts());
      setShops(appStore.getShops());
      setShopProducts(appStore.getShopProducts());
    });
    return unsubscribe;
  }, []);

  // Compute recommendation results for each product
  const recommendationResults = useMemo(() => {
    return products.map(product => {
      const listings = shopProducts.filter(sp => sp.product_id === product.id);
      return evaluateProductListings(
        product,
        listings,
        currentUser.latitude,
        currentUser.longitude
      );
    });
  }, [products, shopProducts, currentUser.latitude, currentUser.longitude]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category));
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered and Sorted Recommendations
  const displayedResults = useMemo(() => {
    let list = recommendationResults.filter(res => {
      // Search
      if (
        searchQuery &&
        !res.productName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !res.category.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      // Category
      if (selectedCategory !== 'All' && res.category !== selectedCategory) {
        return false;
      }
      // Shop filter
      if (selectedShopId !== 'All') {
        const hasShop = res.allListings.some(l => l.listing.shop_id === selectedShopId);
        if (!hasShop) return false;
      }
      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      const aScore = a.topRecommendation?.scores;
      const bScore = b.topRecommendation?.scores;

      if (!aScore && !bScore) return 0;
      if (!aScore) return 1;
      if (!bScore) return -1;

      switch (sortBy) {
        case 'unit_price':
          return aScore.unitPrice - bScore.unitPrice;
        case 'rating':
          return bScore.adjustedRating - aScore.adjustedRating;
        case 'distance':
          return (aScore.distanceKm ?? 999) - (bScore.distanceKm ?? 999);
        case 'recommended':
        default:
          return bScore.combinedScore - aScore.combinedScore;
      }
    });

    return list;
  }, [recommendationResults, searchQuery, selectedCategory, selectedShopId, sortBy]);

  const handleAddToCart = (shopProductId: string) => {
    const res = appStore.addToCart(currentUser.id, shopProductId, 1);
    if (res.requiresShopReset) {
      setShopConflictModal({
        pendingShopProductId: shopProductId,
        currentShopName: res.currentShopName || 'another shop',
      });
    }
  };

  const handleConfirmShopSwitch = () => {
    if (!shopConflictModal) return;
    appStore.clearActiveCart(currentUser.id);
    appStore.addToCart(currentUser.id, shopConflictModal.pendingShopProductId, 1);
    setShopConflictModal(null);
  };

  return (
    <div className="container" style={{ padding: '24px 20px' }}>
      {/* Top Banner: Context and Location */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
          padding: '16px 20px',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>Intelligent Grocery Recommendations</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Evaluating star ratings, quantity-for-price unit value, and real distance across 3 local shops.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'var(--bg-accent-light)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #C4E2C7',
          }}
        >
          <MapPin size={16} style={{ color: 'var(--primary-green)' }} aria-hidden="true" />
          <div style={{ fontSize: 13 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Delivery Location: </span>
            <strong>{currentUser.location}</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 24,
          backgroundColor: '#FFFFFF',
          padding: 16,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Search */}
        <div>
          <label htmlFor="search-input" style={{ fontSize: 13 }}>Search Groceries</label>
          <div style={{ position: 'relative' }}>
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="e.g. Milk, Eggs, Rice..."
            />
            <Search
              size={15}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label htmlFor="category-select" style={{ fontSize: 13 }}>Category</label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Shop Filter */}
        <div>
          <label htmlFor="shop-select" style={{ fontSize: 13 }}>Filter by Shop</label>
          <select
            id="shop-select"
            value={selectedShopId}
            onChange={e => setSelectedShopId(e.target.value)}
          >
            <option value="All">All 3 Shops (Compare)</option>
            {shops.map(s => (
              <option key={s.id} value={s.id}>
                {s.shop_name}
              </option>
            ))}
          </select>
        </div>

        {/* Sorting */}
        <div>
          <label htmlFor="sort-select" style={{ fontSize: 13 }}>Sort Recommendations</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
          >
            <option value="recommended">SmartCart AI Score (Quality + Value + Distance)</option>
            <option value="unit_price">Lowest Unit Price (₹/unit)</option>
            <option value="rating">Highest Bayesian Rating</option>
            <option value="distance">Nearest Shop</option>
          </select>
        </div>
      </div>

      {/* Product List */}
      {displayedResults.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No grocery products matched your criteria.</p>
          <button
            type="button"
            className="btn btn-outline"
            style={{ marginTop: 12 }}
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedShopId('All');
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {displayedResults.map(res => (
            <ProductRecommendationCard
              key={res.productId}
              result={res}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}

      {/* Shop Conflict Modal */}
      {shopConflictModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 100,
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="conflict-dialog-title"
        >
          <div className="card" style={{ maxWidth: 440, width: '100%', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#D97706', marginBottom: 12 }}>
              <AlertTriangle size={24} aria-hidden="true" />
              <h2 id="conflict-dialog-title" style={{ fontSize: 18 }}>Start Order from New Shop?</h2>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Your current cart already contains items from <strong>{shopConflictModal.currentShopName}</strong>.
              SmartCart AI enforces one shop per order request.
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-main)', marginBottom: 20 }}>
              Would you like to clear your current cart and start a new cart with this item?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShopConflictModal(null)}
              >
                Keep Current Cart
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmShopSwitch}
              >
                Clear & Start New Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
