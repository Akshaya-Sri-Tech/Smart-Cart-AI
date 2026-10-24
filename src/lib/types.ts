/**
 * Core type definitions for SmartCart AI
 */

export type UserRole = 'customer' | 'owner';

export interface Profile {
  id: string;
  role: UserRole;
  email: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  created_at?: string;
}

export interface Shop {
  id: string;
  owner_id: string;
  shop_name: string;
  location: string;
  latitude: number;
  longitude: number;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string; // standard unit: kg, L, piece, pack
  created_at?: string;
}

export interface ShopProduct {
  id: string;
  shop_id: string;
  product_id: string;
  price: number; // in INR
  quantity_value: number; // e.g. 500, 1, 6
  quantity_unit: string; // e.g. g, kg, ml, L, piece
  average_rating: number; // 1.0 to 5.0
  rating_count: number;
  stock_quantity: number;
  updated_at?: string;
  // Joined fields for display
  shop?: Shop;
  product?: Product;
}

export type CartStatus = 'active' | 'submitted' | 'cancelled';

export interface Cart {
  id: string;
  customer_id: string;
  shop_id: string;
  status: CartStatus;
  created_at: string;
  updated_at: string;
  // Joined
  shop?: Shop;
  items?: CartItem[];
  customer_profile?: Profile;
}

export interface CartItem {
  id: string;
  cart_id: string;
  shop_product_id: string;
  quantity: number;
  created_at: string;
  // Joined
  shop_product?: ShopProduct;
}

export interface FactorScores {
  qualityScore: number;     // 0 - 100
  valueScore: number;       // 0 - 100
  distanceScore: number;    // 0 - 100
  combinedScore: number;    // 0 - 100
  adjustedRating: number;   // Bayesian rating (1 - 5)
  unitPrice: number;        // Price per standard unit (e.g. ₹/kg, ₹/L, ₹/piece)
  standardUnit: string;     // kg, L, piece
  distanceKm: number | null;
}

export interface ListingRecommendation {
  listing: ShopProduct;
  scores: FactorScores;
  isTopRecommendation: boolean;
  explanation?: string;
}

export interface ProductRecommendationResult {
  productId: string;
  productName: string;
  category: string;
  standardUnit: string;
  topRecommendation: ListingRecommendation | null;
  allListings: ListingRecommendation[];
  explanation: string;
}
