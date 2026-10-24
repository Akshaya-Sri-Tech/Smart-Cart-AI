-- ====================================================================
-- SMARTCART AI — POSTGRESQL SCHEMA (SUPABASE)
-- 6 Tables with Foreign Keys, Constraints, Indexes & Row Level Security (RLS)
-- ====================================================================

-- 1. PROFILES TABLE (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('customer', 'owner')),
  email TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL,
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SHOPS TABLE
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PRODUCTS TABLE (Master catalog of grocery items)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL, -- standard unit: kg, L, piece, pack
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SHOP_PRODUCTS TABLE (Individual shop pricing, quantity, rating & stock)
CREATE TABLE IF NOT EXISTS public.shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  quantity_value NUMERIC(10, 2) NOT NULL CHECK (quantity_value > 0),
  quantity_unit TEXT NOT NULL,
  average_rating NUMERIC(3, 2) NOT NULL DEFAULT 3.50 CHECK (average_rating >= 1.0 AND average_rating <= 5.0),
  rating_count INTEGER NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_shop_product UNIQUE (shop_id, product_id)
);

-- 5. CARTS TABLE (Per-customer, per-shop order containers)
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'submitted', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CART_ITEMS TABLE (Items within a cart)
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  shop_product_id UUID NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_cart_item UNIQUE (cart_id, shop_product_id)
);

-- ====================================================================
-- INDEXES FOR FAST QUERYING
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_shop_products_product ON public.shop_products(product_id);
CREATE INDEX IF NOT EXISTS idx_shop_products_shop ON public.shop_products(shop_id);
CREATE INDEX IF NOT EXISTS idx_carts_customer ON public.carts(customer_id);
CREATE INDEX IF NOT EXISTS idx_carts_shop ON public.carts(shop_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items(cart_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
-- Users can read their own profile
CREATE POLICY "Profiles readable by owner"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile on signup
CREATE POLICY "Profiles insertable by user"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own location
CREATE POLICY "Profiles updatable by user"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- SHOPS POLICIES
-- Anyone authenticated or public can read shops for discovery
CREATE POLICY "Shops readable by all"
  ON public.shops FOR SELECT
  USING (true);

-- Only shop owners can update their own shop
CREATE POLICY "Shop owners can update own shop"
  ON public.shops FOR ALL
  USING (auth.uid() = owner_id);

-- PRODUCTS POLICIES
-- Product catalog is readable by everyone
CREATE POLICY "Products readable by all"
  ON public.products FOR SELECT
  USING (true);

-- SHOP_PRODUCTS POLICIES
-- Readable by all for comparison and recommendations
CREATE POLICY "Shop products readable by all"
  ON public.shop_products FOR SELECT
  USING (true);

-- Only shop owner can insert/update/delete their listings
CREATE POLICY "Owners can manage own listings"
  ON public.shop_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = shop_products.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

-- CARTS POLICIES
-- Customers can view and manage their own carts
CREATE POLICY "Customers can manage own carts"
  ON public.carts FOR ALL
  USING (auth.uid() = customer_id);

-- Shop owners can view carts submitted to their shop
CREATE POLICY "Shop owners can view submitted carts"
  ON public.carts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = carts.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

-- CART_ITEMS POLICIES
-- Customers can manage items in their carts
CREATE POLICY "Customers can manage own cart items"
  ON public.cart_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.carts
      WHERE carts.id = cart_items.cart_id
      AND carts.customer_id = auth.uid()
    )
  );

-- Shop owners can view cart items for carts submitted to their shop
CREATE POLICY "Shop owners can view cart items"
  ON public.cart_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.carts
      JOIN public.shops ON shops.id = carts.shop_id
      WHERE carts.id = cart_items.cart_id
      AND shops.owner_id = auth.uid()
    )
  );
