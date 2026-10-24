
import type {
  Cart,
  CartItem,
  Product,
  Profile,
  Shop,
  ShopProduct,
  UserRole,
} from './types.ts';
import { supabase } from './supabase.ts';

interface AppStoreState {
  currentUser: Profile | null;
  profiles: Profile[];
  shops: Shop[];
  products: Product[];
  shopProducts: ShopProduct[];
  carts: Cart[];
  cartItems: CartItem[];
}

type JoinedShopProduct = ShopProduct & {
  shop?: Shop;
  product?: Product;
};

const emptyState = (): AppStoreState => ({
  currentUser: null,
  profiles: [],
  shops: [],
  products: [],
  shopProducts: [],
  carts: [],
  cartItems: [],
});

function toProfile(row: any): Profile {
  return {
    ...row,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
  };
}

function toShop(row: any): Shop {
  return {
    ...row,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
  };
}

function toShopProduct(row: any): ShopProduct {
  return {
    ...row,
    price: Number(row.price),
    quantity_value: Number(row.quantity_value),
    average_rating: Number(row.average_rating),
    rating_count: Number(row.rating_count),
    stock_quantity: Number(row.stock_quantity),
  };
}

function toCart(row: any): Cart {
  return { ...row };
}

function toCartItem(row: any): CartItem {
  return { ...row, quantity: Number(row.quantity) };
}

function newId(): string {
  return crypto.randomUUID();
}

function reportError(action: string, error: unknown): void {
  console.error(`[SmartCart] ${action} failed:`, error);
}

class DataStore {
  private state: AppStoreState = emptyState();
  private listeners = new Set<() => void>();
  private initialized = false;
  private initialization: Promise<void> | null = null;
  private writeQueue: Promise<void> = Promise.resolve();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(listener => listener());
  }

  getState(): AppStoreState {
    return this.state;
  }

  getCurrentUser(): Profile | null {
    return this.state.currentUser;
  }

  /**
   * Call once when the application starts.
   * Reads the signed-in user and fetches data allowed by database RLS.
   */
  async initialize(): Promise<void> {
    if (this.initialization) return this.initialization;

    this.initialization = (async () => {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const user = sessionData.session?.user ?? null;

      if (user) {
        const { data: profileRow, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (profileRow) {
          this.state.currentUser = toProfile(profileRow);
        } else {
          console.warn(
            '[SmartCart] The signed-in user has no profile row. Check the signup trigger and profiles table.'
          );
        }
      }

      await this.refreshData();
      this.initialized = true;

      supabase.auth.onAuthStateChange((_event, session) => {
        // Avoid querying Supabase directly inside the auth callback.
        // A separate task prevents auth callback deadlocks.
        setTimeout(() => {
          void this.loadCurrentProfile(session?.user.id ?? null).catch(error =>
            reportError('Refreshing authenticated profile', error)
          );
        }, 0);
      });

      this.notify();
    })().catch(error => {
      this.initialization = null;
      throw error;
    });

    return this.initialization;
  }

  private async loadCurrentProfile(userId: string | null): Promise<void> {
    if (!userId) {
      this.state.currentUser = null;
      this.state.carts = [];
      this.state.cartItems = [];
      this.notify();
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;

    this.state.currentUser = data ? toProfile(data) : null;
    await this.refreshData();
    this.notify();
  }

  /**
   * Re-fetches the current user's accessible records and public catalogue.
   */
  async refreshData(): Promise<void> {
    const [
      profilesResult,
      shopsResult,
      productsResult,
      shopProductsResult,
      cartsResult,
      cartItemsResult,
    ] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('shops').select('*'),
      supabase.from('products').select('*'),
      supabase.from('shop_products').select('*'),
      supabase.from('carts').select('*'),
      supabase.from('cart_items').select('*'),
    ]);

    for (const result of [
      profilesResult,
      shopsResult,
      productsResult,
      shopProductsResult,
      cartsResult,
      cartItemsResult,
    ]) {
      if (result.error) throw result.error;
    }

    this.state.profiles = (profilesResult.data ?? []).map(toProfile);
    this.state.shops = (shopsResult.data ?? []).map(toShop);
    this.state.products = productsResult.data ?? [];
    this.state.shopProducts = (shopProductsResult.data ?? []).map(toShopProduct);
    this.state.carts = (cartsResult.data ?? []).map(toCart);
    this.state.cartItems = (cartItemsResult.data ?? []).map(toCartItem);

    if (this.state.currentUser) {
      const latestProfile = this.state.profiles.find(
        profile => profile.id === this.state.currentUser?.id
      );
      if (latestProfile) this.state.currentUser = latestProfile;
    }

    this.notify();
  }

  private queueWrite(
    label: string,
    operation: () => Promise<void>
  ): void {
    this.writeQueue = this.writeQueue
      .then(operation)
      .catch(error => {
        reportError(label, error);
      });
  }

  async login(email: string, role: UserRole, password: string): Promise<Profile> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Supabase did not return an authenticated user.');

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      await supabase.auth.signOut();
      throw new Error(
        'Login succeeded, but the profile could not be loaded. Check your profiles table and signup trigger.'
      );
    }

    const profile = toProfile(profileRow);

    if (profile.role !== role) {
      await supabase.auth.signOut();
      this.state.currentUser = null;
      this.notify();
      throw new Error(`This account is registered as a ${profile.role}. Select the correct role.`);
    }

    this.state.currentUser = profile;
    await this.refreshData();
    return profile;
  }

  async signup(
    email: string,
    role: UserRole,
    location: string,
    latitude?: number,
    longitude?: number,
    password?: string
  ): Promise<Profile> {
    if (!password) {
      throw new Error('A password is required to create an account.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          role,
          location: location.trim(),
          latitude: latitude ?? null,
          longitude: longitude ?? null,
        },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('Supabase did not return a user.');

    // With email confirmation enabled, a session may not exist yet.
    // The SQL trigger in the next section creates the profile row.
    if (!data.session) {
      throw new Error(
        'Account created. Check your email to confirm it, then sign in. Ensure the database signup trigger is installed.'
      );
    }

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      throw new Error(
        'Your account was created, but the profile is not ready. Check the database signup trigger.'
      );
    }

    const profile = toProfile(profileRow);
    this.state.currentUser = profile;
    await this.refreshData();
    return profile;
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    this.state = {
      ...this.state,
      currentUser: null,
      carts: [],
      cartItems: [],
    };
    this.notify();
  }

  updateProfileLocation(location: string, lat: number, lon: number): void {
    const user = this.state.currentUser;
    if (!user) return;

    user.location = location;
    user.latitude = lat;
    user.longitude = lon;

    const profile = this.state.profiles.find(item => item.id === user.id);
    if (profile) Object.assign(profile, user);

    this.notify();

    this.queueWrite('Updating profile location', async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ location, latitude: lat, longitude: lon })
        .eq('id', user.id);

      if (error) throw error;
    });
  }

  getProducts(): Product[] {
    return this.state.products;
  }

  getShops(): Shop[] {
    return this.state.shops;
  }

  getShopProducts(): JoinedShopProduct[] {
    return this.state.shopProducts.map(item => ({
      ...item,
      shop: this.state.shops.find(shop => shop.id === item.shop_id),
      product: this.state.products.find(product => product.id === item.product_id),
    }));
  }

  getShopByOwnerId(ownerId: string): Shop | undefined {
    return this.state.shops.find(shop => shop.owner_id === ownerId);
  }

  updateShopProduct(updated: Partial<ShopProduct> & { id: string }): void {
    const index = this.state.shopProducts.findIndex(item => item.id === updated.id);
    if (index < 0) return;

    const existing = this.state.shopProducts[index];
    const next = { ...existing, ...updated, updated_at: new Date().toISOString() };
    this.state.shopProducts[index] = next;
    this.notify();

    const dbUpdate = {
      price: next.price,
      quantity_value: next.quantity_value,
      quantity_unit: next.quantity_unit,
      average_rating: next.average_rating,
      rating_count: next.rating_count,
      stock_quantity: next.stock_quantity,
      updated_at: next.updated_at,
    };

    this.queueWrite('Updating shop listing', async () => {
      const { error } = await supabase
        .from('shop_products')
        .update(dbUpdate)
        .eq('id', next.id);

      if (error) throw error;
      await this.refreshData();
    });
  }

  addShopProduct(newListing: Omit<ShopProduct, 'id'>): void {
    const listing: ShopProduct = {
      ...newListing,
      id: newId(),
      updated_at: new Date().toISOString(),
    };

    this.state.shopProducts.push(listing);
    this.notify();

    this.queueWrite('Adding shop listing', async () => {
      const { error } = await supabase.from('shop_products').insert({
        id: listing.id,
        shop_id: listing.shop_id,
        product_id: listing.product_id,
        price: listing.price,
        quantity_value: listing.quantity_value,
        quantity_unit: listing.quantity_unit,
        average_rating: listing.average_rating,
        rating_count: listing.rating_count,
        stock_quantity: listing.stock_quantity,
      });

      if (error) throw error;
      await this.refreshData();
    });
  }

  getActiveCart(customerId: string): {
    cart: Cart | null;
    items: (CartItem & { shop_product: JoinedShopProduct })[];
  } {
    const cart = this.state.carts.find(
      item => item.customer_id === customerId && item.status === 'active'
    ) ?? null;

    if (!cart) return { cart: null, items: [] };

    const shop = this.state.shops.find(item => item.id === cart.shop_id);
    const cartWithShop = { ...cart, shop };

    const items = this.state.cartItems
      .filter(item => item.cart_id === cart.id)
      .map(item => {
        const listing = this.state.shopProducts.find(
          product => product.id === item.shop_product_id
        );

        if (!listing) return null;

        return {
          ...item,
          shop_product: {
            ...listing,
            shop: this.state.shops.find(shopItem => shopItem.id === listing.shop_id),
            product: this.state.products.find(product => product.id === listing.product_id),
          },
        };
      })
      .filter((item): item is CartItem & { shop_product: JoinedShopProduct } => item !== null);

    return { cart: cartWithShop, items };
  }

  addToCart(
    customerId: string,
    shopProductId: string,
    quantity = 1
  ): { success: boolean; requiresShopReset?: boolean; currentShopName?: string } {
    const listing = this.state.shopProducts.find(item => item.id === shopProductId);

    if (!listing || listing.stock_quantity <= 0) {
      throw new Error('This item is currently out of stock.');
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error('Quantity must be a positive whole number.');
    }

    let cart = this.state.carts.find(
      item => item.customer_id === customerId && item.status === 'active'
    );

    if (cart && cart.shop_id !== listing.shop_id) {
      return {
        success: false,
        requiresShopReset: true,
        currentShopName:
          this.state.shops.find(shop => shop.id === cart?.shop_id)?.shop_name ??
          'another shop',
      };
    }

    const now = new Date().toISOString();

    if (!cart) {
      cart = {
        id: newId(),
        customer_id: customerId,
        shop_id: listing.shop_id,
        status: 'active',
        created_at: now,
        updated_at: now,
      };
      this.state.carts.push(cart);
    }

    const existingItem = this.state.cartItems.find(
      item => item.cart_id === cart!.id && item.shop_product_id === shopProductId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.state.cartItems.push({
        id: newId(),
        cart_id: cart.id,
        shop_product_id: shopProductId,
        quantity,
        created_at: now,
      });
    }

    cart.updated_at = now;
    const savedCart = cart;
    const savedItem = this.state.cartItems.find(
      item => item.cart_id === savedCart.id && item.shop_product_id === shopProductId
    )!;

    this.notify();

    this.queueWrite('Adding item to cart', async () => {
      const { error: cartError } = await supabase.from('carts').upsert({
        id: savedCart.id,
        customer_id: savedCart.customer_id,
        shop_id: savedCart.shop_id,
        status: savedCart.status,
        created_at: savedCart.created_at,
        updated_at: savedCart.updated_at,
      });

      if (cartError) throw cartError;

      const { error: itemError } = await supabase.from('cart_items').upsert(
        {
          id: savedItem.id,
          cart_id: savedItem.cart_id,
          shop_product_id: savedItem.shop_product_id,
          quantity: savedItem.quantity,
        },
        { onConflict: 'cart_id,shop_product_id' }
      );

      if (itemError) throw itemError;
      await this.refreshData();
    });

    return { success: true };
  }

  clearActiveCart(customerId: string): void {
    const cart = this.state.carts.find(
      item => item.customer_id === customerId && item.status === 'active'
    );

    if (!cart) return;

    this.state.cartItems = this.state.cartItems.filter(item => item.cart_id !== cart.id);
    this.state.carts = this.state.carts.filter(item => item.id !== cart.id);
    this.notify();

    this.queueWrite('Clearing cart', async () => {
      const { error } = await supabase.from('carts').delete().eq('id', cart.id);
      if (error) throw error;
      await this.refreshData();
    });
  }

  updateCartItemQuantity(cartItemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeCartItem(cartItemId);
      return;
    }

    const item = this.state.cartItems.find(entry => entry.id === cartItemId);
    if (!item) return;

    item.quantity = quantity;
    this.notify();

    this.queueWrite('Updating cart item quantity', async () => {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId);

      if (error) throw error;
      await this.refreshData();
    });
  }

  removeCartItem(cartItemId: string): void {
    this.state.cartItems = this.state.cartItems.filter(item => item.id !== cartItemId);
    this.notify();

    this.queueWrite('Removing cart item', async () => {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;
      await this.refreshData();
    });
  }

  submitCart(cartId: string): { success: boolean; message: string } {
    const cart = this.state.carts.find(item => item.id === cartId);
    if (!cart) return { success: false, message: 'Cart not found.' };

    const items = this.state.cartItems.filter(item => item.cart_id === cartId);
    if (items.length === 0) return { success: false, message: 'Your cart is empty.' };

    for (const item of items) {
      const listing = this.state.shopProducts.find(
        product => product.id === item.shop_product_id
      );
      if (!listing || listing.stock_quantity < item.quantity) {
        return {
          success: false,
          message: 'Insufficient stock for one or more items. Please adjust your cart.',
        };
      }
    }

    // Mark as submitted remotely. Stock deduction should ultimately be handled
    // in a PostgreSQL transaction/RPC to avoid race conditions.
    cart.status = 'submitted';
    cart.updated_at = new Date().toISOString();
    this.notify();

    this.queueWrite('Submitting order', async () => {
      const { error } = await supabase
        .from('carts')
        .update({ status: 'submitted', updated_at: cart.updated_at })
        .eq('id', cartId);

      if (error) throw error;
      await this.refreshData();
    });

    return { success: true, message: 'Order submission started.' };
  }

  getSubmittedCartsForShop(shopId: string): Cart[] {
    return this.state.carts
      .filter(cart => cart.shop_id === shopId && cart.status === 'submitted')
      .map(cart => {
        const customer = this.state.profiles.find(
          profile => profile.id === cart.customer_id
        );

        const items = this.state.cartItems
          .filter(item => item.cart_id === cart.id)
          .map(item => {
            const listing = this.state.shopProducts.find(
              product => product.id === item.shop_product_id
            );
            if (!listing) return null;

            return {
              ...item,
              shop_product: {
                ...listing,
                product: this.state.products.find(
                  product => product.id === listing.product_id
                ),
              },
            };
          })
          .filter(item => item !== null);

        return { ...cart, customer_profile: customer, items };
      });
  }

  /**
   * Legacy button compatibility: this no longer resets to fake local seed data.
   */
  async resetToSeed(): Promise<void> {
    await this.refreshData();
  }
}

export const appStore = new DataStore();
