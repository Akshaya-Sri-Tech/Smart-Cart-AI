
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Store,
  MapPin,
  Package,
  ShoppingCart,
  Plus,
  Edit2,
  Clock,
  CheckCircle,
  X,
  Star,
  ChevronDown,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

import { appStore } from '../lib/store.ts';
import { supabase } from '../lib/supabase.ts';
import type { Cart, Profile, Shop, ShopProduct } from '../lib/types.ts';

interface OwnerDashboardPageProps {
  currentUser: Profile;
}

type ProductOption = {
  id: string;
  name: string;
  category: string;
  unit: string;
};

type ListingForm = {
  price: number;
  quantity: number;
  unit: string;
  stock: number;
  rating: number;
};

const emptyForm: ListingForm = {
  price: 50,
  quantity: 1,
  unit: 'kg',
  stock: 25,
  rating: 4.5,
};

const units = ['kg', 'g', 'L', 'ml', 'piece', 'pack'];

const formatPrice = (price: number) =>
  `₹${Number(price || 0).toFixed(2)}`;

export const OwnerDashboardPage: React.FC<OwnerDashboardPageProps> = ({
  currentUser,
}) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [allListings, setAllListings] = useState<ShopProduct[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [submittedCarts, setSubmittedCarts] = useState<Cart[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const [editingListing, setEditingListing] = useState<ShopProduct | null>(
    null
  );
  const [isAddingListing, setIsAddingListing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'incoming_carts' | 'inventory'
  >('inventory');

  const [form, setForm] = useState<ListingForm>(emptyForm);
  const [selectedProductId, setSelectedProductId] = useState('');

  const shop = useMemo(
    () => shops.find((item) => item.id === selectedShopId),
    [shops, selectedShopId]
  );

  const shopListings = useMemo(
    () => allListings.filter((item) => item.shop_id === selectedShopId),
    [allListings, selectedShopId]
  );

  const refreshStoreCarts = useCallback((shopId: string) => {
    if (!shopId) {
      setSubmittedCarts([]);
      return;
    }

    try {
      setSubmittedCarts(appStore.getSubmittedCartsForShop(shopId));
    } catch (error) {
      console.error('Could not load submitted carts:', error);
      setSubmittedCarts([]);
    }
  }, []);

  const loadShops = useCallback(async () => {
    if (!supabase) {
      throw new Error(
        'Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
      );
    }

    const { data, error } = await supabase
      .from('shops')
      .select('id, owner_id, shop_name, location, latitude, longitude, created_at')
      .eq('owner_id', currentUser.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const ownerShops = (data ?? []) as Shop[];

    setShops(ownerShops);

    setSelectedShopId((previousId) => {
      if (ownerShops.some((item) => item.id === previousId)) {
        return previousId;
      }

      return ownerShops[0]?.id ?? '';
    });

    return ownerShops;
  }, [currentUser.id]);

  const loadProducts = useCallback(async () => {
    if (!supabase) throw new Error('Supabase client is unavailable.');

    const { data, error } = await supabase
      .from('products')
      .select('id, name, category, unit')
      .order('name', { ascending: true });

    if (error) throw error;

    setProducts((data ?? []) as ProductOption[]);
  }, []);

  const loadListings = useCallback(async (shopId: string) => {
    if (!supabase) throw new Error('Supabase client is unavailable.');

    if (!shopId) {
      setAllListings([]);
      return;
    }

    const { data, error } = await supabase
      .from('shop_products')
      .select(`
        id,
        shop_id,
        product_id,
        price,
        quantity_value,
        quantity_unit,
        average_rating,
        rating_count,
        stock_quantity,
        updated_at,
        product:products (
          id,
          name,
          category,
          unit
        )
      `)
      .eq('shop_id', shopId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const listings = (data ?? []).map((row: any) => ({
      ...row,
      price: Number(row.price),
      quantity_value: Number(row.quantity_value),
      average_rating: Number(row.average_rating),
      rating_count: Number(row.rating_count),
      stock_quantity: Number(row.stock_quantity),
      product: Array.isArray(row.product)
        ? row.product[0]
        : row.product,
    })) as ShopProduct[];

    setAllListings((previous) => [
      ...previous.filter((item) => item.shop_id !== shopId),
      ...listings,
    ]);
  }, []);

  const refreshCurrentShop = useCallback(async (shopId: string) => {
    if (!shopId) {
      setSubmittedCarts([]);
      return;
    }

    await loadListings(shopId);
    refreshStoreCarts(shopId);
  }, [loadListings, refreshStoreCarts]);

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const ownerShops = await loadShops();
        await loadProducts();

        if (!active) return;

        const initialShopId = ownerShops[0]?.id;

        if (initialShopId) {
          await loadListings(initialShopId);
          refreshStoreCarts(initialShopId);
        }
      } catch (error) {
        console.error('Failed to initialize owner dashboard:', error);

        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Unable to load your shops.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void initialize();

    return () => {
      active = false;
    };
  }, [loadShops, loadProducts, loadListings, refreshStoreCarts]);

  useEffect(() => {
    if (!selectedShopId) {
      setSubmittedCarts([]);
      return;
    }

    let active = true;

    const loadSelectedShop = async () => {
      try {
        await loadListings(selectedShopId);

        if (active) {
          refreshStoreCarts(selectedShopId);
        }
      } catch (error) {
        console.error('Failed to load selected shop:', error);

        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Unable to load this shop.'
          );
        }
      }
    };

    void loadSelectedShop();

    return () => {
      active = false;
    };
  }, [selectedShopId, loadListings, refreshStoreCarts]);

  useEffect(() => {
    const unsubscribe = appStore.subscribe(() => {
      if (selectedShopId) {
        refreshStoreCarts(selectedShopId);
      }
    });

    return unsubscribe;
  }, [selectedShopId, refreshStoreCarts]);

  const showSuccess = (message: string) => {
    setFeedbackNotice(message);
    setErrorMessage(null);
    window.setTimeout(() => setFeedbackNotice(null), 3000);
  };

  const updateForm = <K extends keyof ListingForm>(
    key: K,
    value: ListingForm[K]
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const validateForm = () => {
    if (
      !Number.isFinite(form.price) ||
      form.price <= 0 ||
      !Number.isFinite(form.quantity) ||
      form.quantity <= 0 ||
      !Number.isInteger(form.stock) ||
      form.stock < 0 ||
      !Number.isFinite(form.rating) ||
      form.rating < 1 ||
      form.rating > 5
    ) {
      setErrorMessage(
        'Enter a positive price and quantity, non-negative whole-number stock, and a rating from 1 to 5.'
      );
      return false;
    }

    return true;
  };

  const handleOpenAdd = () => {
    setEditingListing(null);
    setForm(emptyForm);
    setSelectedProductId(products[0]?.id ?? '');
    setErrorMessage(null);
    setIsAddingListing(true);
  };

  const handleOpenEdit = (listing: ShopProduct) => {
    setIsAddingListing(false);
    setEditingListing(listing);
    setForm({
      price: Number(listing.price),
      quantity: Number(listing.quantity_value),
      unit: listing.quantity_unit,
      stock: Number(listing.stock_quantity),
      rating: Number(listing.average_rating),
    });
    setErrorMessage(null);
  };

  const handleSaveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase || !editingListing || !shop) return;
    if (!validateForm()) return;

    setSaving(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase
        .from('shop_products')
        .update({
          price: form.price,
          quantity_value: form.quantity,
          quantity_unit: form.unit,
          stock_quantity: form.stock,
          average_rating: form.rating,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingListing.id)
        .eq('shop_id', shop.id);

      if (error) throw error;

      await loadListings(shop.id);
      setEditingListing(null);
      showSuccess('Product listing updated successfully.');
    } catch (error) {
      console.error('Failed to update listing:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not update this listing.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNew = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase || !shop || !selectedProductId) {
      setErrorMessage('Select a shop and a product first.');
      return;
    }

    if (!validateForm()) return;

    setSaving(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase
        .from('shop_products')
        .insert({
          shop_id: shop.id,
          product_id: selectedProductId,
          price: form.price,
          quantity_value: form.quantity,
          quantity_unit: form.unit,
          average_rating: form.rating,
          rating_count: 0,
          stock_quantity: form.stock,
        });

      if (error) throw error;

      await loadListings(shop.id);
      setIsAddingListing(false);
      setSelectedProductId('');
      showSuccess('Product listing added to this shop.');
    } catch (error) {
      console.error('Failed to create listing:', error);

      const message =
        error instanceof Error ? error.message : 'Could not add this listing.';

      setErrorMessage(
        message.toLowerCase().includes('duplicate') ||
        message.toLowerCase().includes('unique')
          ? 'This product is already listed in this shop. Edit its existing listing instead.'
          : message
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      await loadShops();
      await loadProducts();

      if (selectedShopId) {
        await refreshCurrentShop(selectedShopId);
      }

      showSuccess('Dashboard refreshed.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Refresh failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const openAddForSelectedShop = () => {
    if (!shop) {
      setErrorMessage('Create a shop before adding product listings.');
      return;
    }

    if (products.length === 0) {
      setErrorMessage(
        'No products are available in the products table. Add products first.'
      );
      return;
    }

    handleOpenAdd();
  };

  if (loading && shops.length === 0) {
    return (
      <div className="container" style={{ padding: '48px 20px' }}>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <RefreshCw
            size={28}
            className="animate-spin"
            style={{ margin: '0 auto 12px' }}
          />
          <h2>Loading your shops...</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Retrieving your shop details from Supabase.
          </p>
        </div>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className="container" style={{ padding: '40px 20px' }}>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <Store
            size={40}
            style={{
              color: 'var(--text-muted)',
              margin: '0 auto 12px',
            }}
          />
          <h2>No Shops Found</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            No shop is linked to {currentUser.email}. Check the
            <code> shops </code>
            table and confirm that its <code>owner_id</code> matches your
            profile UUID.
          </p>

          {errorMessage && (
            <p role="alert" style={{ color: 'var(--danger-color)' }}>
              {errorMessage}
            </p>
          )}

          <button
            type="button"
            className="btn btn-outline"
            onClick={handleRefresh}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '24px 20px' }}>
      {/* Shop selector and summary */}
      <section
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '20px 24px',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 280px' }}>
            <label
              htmlFor="owner-shop-selector"
              style={{
                display: 'block',
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              <Store
                size={16}
                style={{
                  display: 'inline',
                  verticalAlign: 'middle',
                  marginRight: 6,
                }}
              />
              Select a shop to manage
            </label>

            <div style={{ position: 'relative', maxWidth: 440 }}>
              <select
                id="owner-shop-selector"
                value={selectedShopId}
                onChange={(event) => {
                  setSelectedShopId(event.target.value);
                  setErrorMessage(null);
                }}
                style={{
                  width: '100%',
                  appearance: 'none',
                  padding: '12px 40px 12px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  background: '#fff',
                  fontSize: 15,
                }}
              >
                {shops.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.shop_name}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={17}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
            </div>

            <p
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                marginTop: 8,
              }}
            >
              {shops.length} shop{shops.length === 1 ? '' : 's'} associated
              with {currentUser.email}
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw
              size={15}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>

        {shop && (
          <>
            <div
              style={{
                borderTop: '1px solid var(--border-color)',
                marginTop: 18,
                paddingTop: 18,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginBottom: 6,
                  }}
                >
                  <Store
                    size={22}
                    style={{ color: 'var(--primary-green)' }}
                  />
                  <h1 style={{ fontSize: 24 }}>{shop.shop_name}</h1>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: '#FEF3C7',
                      color: '#92400E',
                    }}
                  >
                    Owner Portal
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <MapPin
                    size={15}
                    style={{ color: 'var(--primary-green)' }}
                  />
                  <span>
                    {shop.location} (
                    {Number(shop.latitude).toFixed(4)}°,{' '}
                    {Number(shop.longitude).toFixed(4)}°)
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div
                  style={{
                    textAlign: 'center',
                    padding: '10px 16px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {submittedCarts.length}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Incoming Orders
                  </div>
                </div>

                <div
                  style={{
                    textAlign: 'center',
                    padding: '10px 16px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {shopListings.length}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Listed Items
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {errorMessage && (
        <div
          className="alert"
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            marginBottom: 16,
            color: 'var(--danger-color)',
          }}
        >
          <AlertCircle size={17} />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            aria-label="Dismiss error"
            style={{ marginLeft: 'auto', background: 'none', border: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {feedbackNotice && (
        <div
          className="alert alert-success"
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <CheckCircle size={16} />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: 8,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('incoming_carts')}
          className={`btn ${
            activeTab === 'incoming_carts' ? 'btn-primary' : 'btn-outline'
          }`}
        >
          <ShoppingCart size={16} />
          Incoming Customer Carts ({submittedCarts.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`btn ${
            activeTab === 'inventory' ? 'btn-primary' : 'btn-outline'
          }`}
        >
          <Package size={16} />
          Manage Grocery Listings ({shopListings.length})
        </button>
      </div>

      {/* Incoming orders */}
      {activeTab === 'incoming_carts' && (
        <section>
          {submittedCarts.length === 0 ? (
            <div
              className="card"
              style={{ textAlign: 'center', padding: '48px 20px' }}
            >
              <ShoppingCart
                size={40}
                style={{
                  color: 'var(--text-muted)',
                  margin: '0 auto 12px',
                }}
              />
              <h2 style={{ fontSize: 20, marginBottom: 6 }}>
                No Submitted Carts Yet
              </h2>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  maxWidth: 440,
                  margin: '0 auto',
                }}
              >
                Submitted customer carts for {shop?.shop_name} will appear
                here when your store's order data is loaded.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {submittedCarts.map((cart) => {
                const cartTotal = (cart.items || []).reduce(
                  (sum, item) =>
                    sum +
                    Number(item.quantity) *
                      Number(item.shop_product?.price || 0),
                  0
                );

                return (
                  <div key={cart.id} className="card">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: 12,
                        borderBottom: '1px solid var(--border-color)',
                        paddingBottom: 12,
                        marginBottom: 14,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap',
                          }}
                        >
                          <strong>
                            Order #{cart.id.substring(0, 8).toUpperCase()}
                          </strong>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: '#D1E7D4',
                              color: '#03543F',
                            }}
                          >
                            Submitted
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap',
                            marginTop: 6,
                          }}
                        >
                          <span>
                            Customer:{' '}
                            <strong>
                              {cart.customer_profile?.email ||
                                'Registered Customer'}
                            </strong>
                          </span>
                          <span>
                            <Clock
                              size={13}
                              style={{
                                display: 'inline',
                                verticalAlign: 'middle',
                                marginRight: 3,
                              }}
                            />
                            {new Date(cart.created_at).toLocaleString()}
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            color: 'var(--text-secondary)',
                            marginTop: 4,
                          }}
                        >
                          <MapPin
                            size={13}
                            style={{
                              display: 'inline',
                              verticalAlign: 'middle',
                              marginRight: 4,
                            }}
                          />
                          Delivery location:{' '}
                          {cart.customer_profile?.location || 'Not provided'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: 13,
                            color: 'var(--text-secondary)',
                          }}
                        >
                          Order Total
                        </div>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: 'var(--dark-green)',
                          }}
                        >
                          {formatPrice(cartTotal)}
                        </div>
                      </div>
                    </div>

                    <div className="table-responsive">
                      <table>
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Package Size</th>
                            <th>Unit Rate</th>
                            <th>Quantity</th>
                            <th style={{ textAlign: 'right' }}>Item Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(cart.items || []).map((item) => {
                            const listing = item.shop_product;
                            const price = Number(listing?.price || 0);
                            const lineTotal = Number(item.quantity) * price;

                            return (
                              <tr key={item.id}>
                                <td>
                                  <strong>
                                    {listing?.product?.name || 'Grocery Item'}
                                  </strong>
                                </td>
                                <td>
                                  {listing?.quantity_value}{' '}
                                  {listing?.quantity_unit}
                                </td>
                                <td>{formatPrice(price)}</td>
                                <td>{item.quantity}</td>
                                <td style={{ textAlign: 'right' }}>
                                  <strong>{formatPrice(lineTotal)}</strong>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Inventory */}
      {activeTab === 'inventory' && (
        <section>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 16,
            }}
          >
            <div>
              <h2 style={{ fontSize: 20 }}>Your Grocery Listings</h2>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  marginTop: 4,
                }}
              >
                Changes apply only to {shop?.shop_name}.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={openAddForSelectedShop}
              disabled={!shop}
            >
              <Plus size={16} />
              Add New Listing
            </button>
          </div>

          <div className="card">
            {shopListings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 36 }}>
                <Package
                  size={34}
                  style={{
                    color: 'var(--text-muted)',
                    margin: '0 auto 12px',
                  }}
                />
                <h3>No Listings in This Shop</h3>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    margin: '8px auto 16px',
                  }}
                >
                  Add an existing grocery product to this shop.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={openAddForSelectedShop}
                >
                  <Plus size={16} />
                  Add First Product
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Package Quantity</th>
                      <th>Price</th>
                      <th>Stock Units</th>
                      <th>Rating</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shopListings.map((listing) => (
                      <tr key={listing.id}>
                        <td>
                          <strong>
                            {listing.product?.name || 'Unnamed Product'}
                          </strong>
                        </td>
                        <td>{listing.product?.category || '—'}</td>
                        <td>
                          {listing.quantity_value} {listing.quantity_unit}
                        </td>
                        <td>
                          <strong>{formatPrice(listing.price)}</strong>
                        </td>
                        <td>
                          {listing.stock_quantity > 0 ? (
                            <span style={{ color: '#047857', fontWeight: 600 }}>
                              {listing.stock_quantity} available
                            </span>
                          ) : (
                            <span
                              style={{
                                color: 'var(--danger-color)',
                                fontWeight: 600,
                              }}
                            >
                              Out of stock
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="star-rating">
                            <Star
                              size={13}
                              fill="#D97706"
                              color="#D97706"
                            />
                            {Number(listing.average_rating).toFixed(1)} (
                            {listing.rating_count})
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenEdit(listing)}
                            aria-label={`Edit ${listing.product?.name}`}
                          >
                            <Edit2 size={13} />
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Edit listing dialog */}
      {editingListing && (
        <div
          className="modal-backdrop"
          style={modalBackdropStyle}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-dialog-title"
        >
          <div className="card" style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <h2 id="edit-dialog-title" style={{ fontSize: 18 }}>
                Edit: {editingListing.product?.name}
              </h2>
              <button
                type="button"
                onClick={() => setEditingListing(null)}
                style={closeButtonStyle}
                aria-label="Close edit dialog"
              >
                <X size={18} />
              </button>
            </div>

            <p
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                marginBottom: 16,
              }}
            >
              Shop: {shop?.shop_name}
            </p>

            <form onSubmit={handleSaveEdit}>
              <ListingFields
                form={form}
                updateForm={updateForm}
                prefix="edit"
              />

              <div style={modalActionsStyle}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingListing(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add listing dialog */}
      {isAddingListing && (
        <div
          className="modal-backdrop"
          style={modalBackdropStyle}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-dialog-title"
        >
          <div className="card" style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <h2 id="add-dialog-title" style={{ fontSize: 18 }}>
                Add Product Listing
              </h2>
              <button
                type="button"
                onClick={() => setIsAddingListing(false)}
                style={closeButtonStyle}
                aria-label="Close add dialog"
              >
                <X size={18} />
              </button>
            </div>

            <p
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                marginBottom: 16,
              }}
            >
              Adding to: {shop?.shop_name}
            </p>

            <form onSubmit={handleSaveNew}>
              <div className="form-group">
                <label htmlFor="add-product">Select Grocery Product</label>
                <select
                  id="add-product"
                  value={selectedProductId}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  required
                >
                  <option value="" disabled>
                    Choose a product
                  </option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.category})
                    </option>
                  ))}
                </select>
              </div>

              <ListingFields
                form={form}
                updateForm={updateForm}
                prefix="add"
              />

              <div style={modalActionsStyle}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsAddingListing(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || !selectedProductId}
                >
                  {saving ? 'Adding...' : 'Create Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface ListingFieldsProps {
  form: ListingForm;
  updateForm: <K extends keyof ListingForm>(
    key: K,
    value: ListingForm[K]
  ) => void;
  prefix: string;
}

const ListingFields: React.FC<ListingFieldsProps> = ({
  form,
  updateForm,
  prefix,
}) => (
  <>
    <div className="form-group">
      <label htmlFor={`${prefix}-price`}>Package Price (₹)</label>
      <input
        id={`${prefix}-price`}
        type="number"
        min="0.01"
        step="0.01"
        value={form.price}
        onChange={(event) =>
          updateForm('price', Number(event.target.value) || 0)
        }
        required
      />
    </div>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: 10,
      }}
    >
      <div className="form-group">
        <label htmlFor={`${prefix}-quantity`}>Package Quantity</label>
        <input
          id={`${prefix}-quantity`}
          type="number"
          min="0.01"
          step="0.01"
          value={form.quantity}
          onChange={(event) =>
            updateForm('quantity', Number(event.target.value) || 0)
          }
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor={`${prefix}-unit`}>Unit</label>
        <select
          id={`${prefix}-unit`}
          value={form.unit}
          onChange={(event) => updateForm('unit', event.target.value)}
        >
          {units.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div className="form-group">
      <label htmlFor={`${prefix}-stock`}>Available Stock Units</label>
      <input
        id={`${prefix}-stock`}
        type="number"
        min="0"
        step="1"
        value={form.stock}
        onChange={(event) =>
          updateForm('stock', Number(event.target.value) || 0)
        }
        required
      />
    </div>

    <div className="form-group">
      <label htmlFor={`${prefix}-rating`}>Average Rating (1–5)</label>
      <input
        id={`${prefix}-rating`}
        type="number"
        min="1"
        max="5"
        step="0.1"
        value={form.rating}
        onChange={(event) =>
          updateForm('rating', Number(event.target.value) || 0)
        }
        required
      />
    </div>
  </>
);

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  zIndex: 100,
  overflowY: 'auto',
};

const modalCardStyle: React.CSSProperties = {
  maxWidth: 460,
  width: '100%',
  padding: 24,
  maxHeight: '90vh',
  overflowY: 'auto',
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  marginBottom: 12,
};

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 4,
};

const modalActionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 10,
  marginTop: 20,
};
