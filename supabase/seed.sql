-- ====================================================================
-- SMARTCART AI — SEED DATA
-- 1 Customer, 3 Shop Owners, 3 Shops, 10 Products, 18 Listings
-- ====================================================================

-- Fixed deterministic UUIDs for reference
-- Profiles
-- Customer: '00000000-0000-0000-0000-000000000001'
-- Owner 1:  '00000000-0000-0000-0000-000000000002'
-- Owner 2:  '00000000-0000-0000-0000-000000000003'
-- Owner 3:  '00000000-0000-0000-0000-000000000004'

-- 1. SEED PROFILES
-- Note: When running in Supabase SQL editor, user records are created via Supabase Auth.
-- These profile records associate user IDs with roles and geographic coordinates.

INSERT INTO public.profiles (id, role, email, location, latitude, longitude)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'customer', 'customer@example.com', '12th Main, Indiranagar, Bangalore', 12.978400, 77.640800),
  ('00000000-0000-0000-0000-000000000002', 'owner', 'owner1@example.com', '100ft Road, Indiranagar, Bangalore', 12.971900, 77.641200),
  ('00000000-0000-0000-0000-000000000003', 'owner', 'owner2@example.com', 'Old Airport Road, Domlur, Bangalore', 12.960900, 77.638700),
  ('00000000-0000-0000-0000-000000000004', 'owner', 'owner3@example.com', 'ITPL Main Road, Whitefield, Bangalore', 12.969800, 77.749900)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  email = EXCLUDED.email,
  location = EXCLUDED.location,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude;

-- 2. SEED SHOPS
-- Shop 1: Green Basket (0.7 km from customer) - High quality, slightly premium
-- Shop 2: Fresh Daily (1.9 km from customer) - Balanced price & rating
-- Shop 3: Metro Supermarket (11.8 km from customer) - Bulk discounts, lower unit prices
INSERT INTO public.shops (id, owner_id, shop_name, location, latitude, longitude)
VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', 'Green Basket', '100ft Road, Indiranagar', 12.971900, 77.641200),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000003', 'Fresh Daily', 'Old Airport Road, Domlur', 12.960900, 77.638700),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000004', 'Metro Supermarket', 'ITPL Main Road, Whitefield', 12.969800, 77.749900)
ON CONFLICT (id) DO UPDATE SET
  shop_name = EXCLUDED.shop_name,
  location = EXCLUDED.location,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude;

-- 3. SEED 10 GROCERY PRODUCTS
INSERT INTO public.products (id, name, category, unit)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Milk', 'Dairy & Eggs', 'L'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Eggs', 'Dairy & Eggs', 'piece'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Bread', 'Bakery', 'pack'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Maida', 'Staples & Grains', 'kg'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Rice', 'Staples & Grains', 'kg'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Sugar', 'Staples & Grains', 'kg'),
  ('gggggggg-gggg-gggg-gggg-gggggggggggg', 'Cooking Oil', 'Oils & Ghee', 'L'),
  ('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'Curd', 'Dairy & Eggs', 'kg'),
  ('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'Butter', 'Dairy & Eggs', 'g'),
  ('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'Potatoes', 'Vegetables', 'kg')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  unit = EXCLUDED.unit;

-- 4. SEED 18 SHOP-PRODUCT LISTINGS
-- Varied ratings, packaging sizes, distances, and prices
INSERT INTO public.shop_products (id, shop_id, product_id, price, quantity_value, quantity_unit, average_rating, rating_count, stock_quantity)
VALUES
  -- 1. MILK:
  -- Green Basket: 500 ml for ₹28 (₹56/L), 4.8 rating (120 reviews), close
  ('sp01', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 28.00, 500, 'ml', 4.80, 120, 45),
  -- Fresh Daily: 1000 ml for ₹52 (₹52/L), 4.4 rating (65 reviews), 1.9km
  ('sp02', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 52.00, 1000, 'ml', 4.40, 65, 30),
  -- Metro Supermarket: 1000 ml for ₹49 (₹49/L), 4.0 rating (22 reviews), 11.8km
  ('sp03', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 49.00, 1000, 'ml', 4.00, 22, 100),

  -- 2. EGGS:
  -- Green Basket: 6 eggs for ₹48 (₹8/egg), 4.70 rating (90 reviews), 0.7km
  ('sp04', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 48.00, 6, 'piece', 4.70, 90, 40),
  -- Fresh Daily: 12 eggs for ₹84 (₹7/egg), 4.30 rating (40 reviews), 1.9km
  ('sp05', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 84.00, 12, 'piece', 4.30, 40, 25),
  -- Metro Supermarket: 30 eggs tray for ₹180 (₹6/egg), 4.10 rating (35 reviews), 11.8km
  ('sp06', '33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 180.00, 30, 'piece', 4.10, 35, 60),

  -- 3. BREAD:
  -- Green Basket: Artisanal Whole Wheat 400g pack ₹45, 4.90 rating (80 reviews)
  ('sp07', '11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 45.00, 1, 'pack', 4.90, 80, 18),
  -- Fresh Daily: Sandwich White Bread 400g pack ₹35, 4.20 rating (50 reviews)
  ('sp08', '22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 35.00, 1, 'pack', 4.20, 50, 30),

  -- 4. MAIDA:
  -- Fresh Daily: 1 kg pack ₹46, 4.30 rating (15 reviews)
  ('sp09', '22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 46.00, 1, 'kg', 4.30, 15, 20),
  -- Metro Supermarket: 2 kg pack ₹82 (₹41/kg), 4.00 rating (10 reviews)
  ('sp10', '33333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 82.00, 2, 'kg', 4.00, 10, 50),

  -- 5. RICE (SONA MASOORI):
  -- Green Basket: Premium Sona Masoori 1 kg ₹68, 4.80 rating (95 reviews)
  ('sp11', '11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 68.00, 1, 'kg', 4.80, 95, 35),
  -- Fresh Daily: 5 kg bag ₹295 (₹59/kg), 4.40 rating (48 reviews)
  ('sp12', '22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 295.00, 5, 'kg', 4.40, 48, 20),
  -- Metro Supermarket: 10 kg bulk bag ₹540 (₹54/kg), 4.20 rating (30 reviews)
  ('sp13', '33333333-3333-3333-3333-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 540.00, 10, 'kg', 4.20, 30, 80),

  -- 6. SUGAR:
  -- Fresh Daily: 1 kg ₹48, 4.50 rating (25 reviews)
  ('sp14', '22222222-2222-2222-2222-222222222222', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 48.00, 1, 'kg', 4.50, 25, 40),
  -- Metro Supermarket: 5 kg ₹220 (₹44/kg), 4.10 rating (18 reviews)
  ('sp15', '33333333-3333-3333-3333-333333333333', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 220.00, 5, 'kg', 4.10, 18, 75),

  -- 7. COOKING OIL (SUNFLOWER):
  -- Green Basket: Cold Pressed Sunflower Oil 1 L ₹165, 4.85 rating (70 reviews)
  ('sp16', '11111111-1111-1111-1111-111111111111', 'gggggggg-gggg-gggg-gggg-gggggggggggg', 165.00, 1, 'L', 4.85, 70, 22),
  -- Fresh Daily: Refined Sunflower Oil 1 L ₹142, 4.30 rating (35 reviews)
  ('sp17', '22222222-2222-2222-2222-222222222222', 'gggggggg-gggg-gggg-gggg-gggggggggggg', 142.00, 1, 'L', 4.30, 35, 30),

  -- 8. POTATOES:
  -- Green Basket: Fresh Farm Potatoes 1 kg ₹38, 4.60 rating (55 reviews)
  ('sp18', '11111111-1111-1111-1111-111111111111', 'jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 38.00, 1, 'kg', 4.60, 55, 60),

  -- 9. CURD:
  -- Green Basket: 500 g pouch ₹35, 4.75 rating (80 reviews)
  ('sp19', '11111111-1111-1111-1111-111111111111', 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 35.00, 500, 'g', 4.75, 80, 30),
  -- Fresh Daily: 1 kg tub ₹65, 4.35 rating (40 reviews)
  ('sp20', '22222222-2222-2222-2222-222222222222', 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 65.00, 1, 'kg', 4.35, 40, 20),

  -- 10. BUTTER:
  -- Green Basket: 100 g pack ₹58, 4.90 rating (110 reviews)
  ('sp21', '11111111-1111-1111-1111-111111111111', 'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 58.00, 100, 'g', 4.90, 110, 25),
  -- Fresh Daily: 500 g pack ₹275, 4.60 rating (75 reviews)
  ('sp22', '22222222-2222-2222-2222-222222222222', 'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 275.00, 500, 'g', 4.60, 75, 15)
ON CONFLICT (id) DO UPDATE SET
  price = EXCLUDED.price,
  quantity_value = EXCLUDED.quantity_value,
  quantity_unit = EXCLUDED.quantity_unit,
  average_rating = EXCLUDED.average_rating,
  rating_count = EXCLUDED.rating_count,
  stock_quantity = EXCLUDED.stock_quantity;
