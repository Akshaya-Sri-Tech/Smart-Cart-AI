/**
 * SmartCart AI Recommendation Engine
 *
 * Implements deterministic multi-factor recommendation:
 * 1. Bayesian-adjusted Quality Score (40%)
 * 2. Quantity-for-Price Value Score (40%)
 * 3. Shop Proximity Score (20%)
 */

import { calculateHaversineDistanceKm, calculateProximityScore } from './distance.ts';
import { normalizeUnit } from './unit-conversion.ts';
import type { FactorScores, ListingRecommendation, ProductRecommendationResult, ShopProduct } from './types.ts';

export interface RecommendationConfig {
  weightQuality: number;   // 0.40
  weightValue: number;     // 0.40
  weightDistance: number;  // 0.20
  priorRating: number;     // 3.5
  priorWeight: number;     // 5
  distanceDecay: number;   // 0.12
}

export const DEFAULT_CONFIG: RecommendationConfig = {
  weightQuality: 0.40,
  weightValue: 0.40,
  weightDistance: 0.20,
  priorRating: 3.5,
  priorWeight: 5,
  distanceDecay: 0.12,
};

/**
 * Calculates Bayesian-adjusted rating:
 * (n * R + m * C) / (n + m)
 */
export function calculateBayesianRating(
  averageRating: number,
  ratingCount: number,
  priorRating = DEFAULT_CONFIG.priorRating,
  priorWeight = DEFAULT_CONFIG.priorWeight
): number {
  if (ratingCount <= 0 || averageRating <= 0) {
    return priorRating;
  }
  const adjusted =
    (ratingCount * averageRating + priorWeight * priorRating) /
    (ratingCount + priorWeight);
  return Math.round(adjusted * 100) / 100;
}

/**
 * Normalizes Bayesian rating (1-5 scale) to 0-100 quality score.
 */
export function calculateQualityScore(bayesianRating: number): number {
  const score = (bayesianRating / 5.0) * 100;
  return Math.round(Math.min(100, Math.max(0, score)) * 10) / 10;
}

/**
 * Calculates relative Value Score (0-100) for a listing based on its unit price
 * compared to the minimum unit price available for that product.
 * Lower unit price = higher value score.
 * Formula: (minUnitPrice / listingUnitPrice) * 100
 */
export function calculateValueScore(
  unitPrice: number,
  minUnitPrice: number
): number {
  if (unitPrice <= 0 || minUnitPrice <= 0) return 50;
  const score = (minUnitPrice / unitPrice) * 100;
  return Math.round(Math.min(100, Math.max(0, score)) * 10) / 10;
}

/**
 * Generates a concise, deterministic trade-off explanation.
 */
export function generateLocalExplanation(
  rec: ListingRecommendation,
  otherRecs: ListingRecommendation[]
): string {
  const shopName = rec.listing.shop?.shop_name || 'This shop';
  const { scores } = rec;
  const distText = scores.distanceKm !== null ? `${scores.distanceKm} km away` : 'nearby';

  if (otherRecs.length === 0) {
    return `Recommended from ${shopName} (${distText}) with solid ₹${scores.unitPrice}/${scores.standardUnit} value and ${scores.adjustedRating} stars rating.`;
  }

  // Identify standout strengths
  const isBestPrice = otherRecs.every(o => scores.unitPrice <= o.scores.unitPrice);
  const isBestRating = otherRecs.every(o => scores.adjustedRating >= o.scores.adjustedRating);
  const isClosest = otherRecs.every(
    o => scores.distanceKm !== null && o.scores.distanceKm !== null && scores.distanceKm <= o.scores.distanceKm
  );

  if (isBestPrice && isClosest) {
    return `Top pick: Best unit price (₹${scores.unitPrice}/${scores.standardUnit}) and closest location (${distText}) with reliable ${scores.adjustedRating} stars rating.`;
  }
  if (isBestPrice && !isClosest) {
    return `Lowest unit price at ₹${scores.unitPrice}/${scores.standardUnit}. Despite being ${distText}, the high quantity-for-price makes it the most economical choice.`;
  }
  if (isBestRating && isClosest) {
    return `Highest quality (${scores.adjustedRating} stars) and nearest shop (${distText}), offering balanced overall value at ₹${scores.unitPrice}/${scores.standardUnit}.`;
  }
  if (isClosest) {
    return `Nearest shop (${distText}) with competitive ₹${scores.unitPrice}/${scores.standardUnit} pricing and dependable ${scores.adjustedRating} stars rating.`;
  }

  return `Best overall trade-off: strong rating (${scores.adjustedRating} stars), competitive rate of ₹${scores.unitPrice}/${scores.standardUnit}, and ${distText} from your location.`;
}

/**
 * Evaluates and ranks all listings for a product given customer coordinates.
 */
export function evaluateProductListings(
  productOrListings: Product | ShopProduct[],
  maybeListingsOrLat?: ShopProduct[] | number | null,
  maybeLatOrLon?: number | null,
  maybeLonOrConfig?: number | null | RecommendationConfig,
  maybeConfig?: RecommendationConfig
): ProductRecommendationResult {
  let product: Product | undefined;
  let listings: ShopProduct[];
  let customerLat: number | null = null;
  let customerLon: number | null = null;
  let config: RecommendationConfig = DEFAULT_CONFIG;

  if (Array.isArray(productOrListings)) {
    listings = productOrListings;
    customerLat = (maybeListingsOrLat as number | null) ?? null;
    customerLon = (maybeLatOrLon as number | null) ?? null;
    if (maybeLonOrConfig && typeof maybeLonOrConfig === 'object') {
      config = maybeLonOrConfig;
    }
    const sample = listings[0];
    product = sample?.product || {
      id: sample?.product_id || 'unknown',
      name: 'Grocery Item',
      category: 'General',
      unit: 'unit',
    };
  } else {
    product = productOrListings;
    listings = (maybeListingsOrLat as ShopProduct[]) || [];
    customerLat = (maybeLatOrLon as number | null) ?? null;
    customerLon = (maybeLonOrConfig as number | null) ?? null;
    if (maybeConfig) config = maybeConfig;
  }

  const productId = product.id;
  const productName = product.name;
  const category = product.category;
  let resolvedStandardUnit = product.unit || 'unit';

  if (!listings || listings.length === 0) {
    return {
      productId,
      productName,
      category,
      standardUnit: resolvedStandardUnit,
      topRecommendation: null,
      allListings: [],
      explanation: 'No listings currently available for this product.',
    };
  }

  // 1. Compute unit prices & standard units for all valid listings
  const parsedListings = listings.map(item => {
    const norm = normalizeUnit(item.price, item.quantity_value, item.quantity_unit);
    const distanceKm =
      item.shop && customerLat !== null && customerLon !== null
        ? calculateHaversineDistanceKm(
            customerLat,
            customerLon,
            item.shop.latitude,
            item.shop.longitude
          )
        : null;

    return {
      listing: item,
      norm,
      distanceKm,
    };
  });

  // Filter out invalid items (price <= 0 or quantity <= 0)
  const validListings = parsedListings.filter(p => p.norm.isValid);
  if (validListings.length === 0) {
    return {
      productId,
      productName,
      category,
      standardUnit: '',
      topRecommendation: null,
      allListings: [],
      explanation: 'No valid price or quantity listings available.',
    };
  }

  // Find min unit price across available valid listings for scaling
  const minUnitPrice = Math.min(...validListings.map(v => v.norm.unitPrice));
  resolvedStandardUnit = validListings[0].norm.standardUnit || resolvedStandardUnit;

  // 2. Score each listing
  const scoredListings: ListingRecommendation[] = validListings.map(v => {
    const { listing, norm, distanceKm } = v;

    // A. Quality Score (Bayesian)
    const adjustedRating = calculateBayesianRating(
      listing.average_rating,
      listing.rating_count,
      config.priorRating,
      config.priorWeight
    );
    const qualityScore = calculateQualityScore(adjustedRating);

    // B. Value Score
    const valueScore = calculateValueScore(norm.unitPrice, minUnitPrice);

    // C. Distance Score
    const distanceScore = calculateProximityScore(distanceKm, config.distanceDecay);

    // Combined Score
    const rawCombined =
      config.weightQuality * qualityScore +
      config.weightValue * valueScore +
      config.weightDistance * distanceScore;
    const combinedScore = Math.round(rawCombined * 10) / 10;

    const scores: FactorScores = {
      qualityScore,
      valueScore,
      distanceScore,
      combinedScore,
      adjustedRating,
      unitPrice: norm.unitPrice,
      standardUnit: norm.standardUnit,
      distanceKm,
    };

    return {
      listing,
      scores,
      isTopRecommendation: false,
    };
  });

  // 3. Sort: In-stock items ranked by combinedScore descending.
  // Out of stock items (stock_quantity <= 0) are placed at the bottom.
  scoredListings.sort((a, b) => {
    const aInStock = a.listing.stock_quantity > 0;
    const bInStock = b.listing.stock_quantity > 0;
    if (aInStock && !bInStock) return -1;
    if (!aInStock && bInStock) return 1;
    return b.scores.combinedScore - a.scores.combinedScore;
  });

  // Top recommendation must be in stock
  let topRecommendation: ListingRecommendation | null = null;
  const firstInStock = scoredListings.find(l => l.listing.stock_quantity > 0);
  if (firstInStock) {
    firstInStock.isTopRecommendation = true;
    topRecommendation = firstInStock;
  }

  // 4. Generate local explanation
  const others = scoredListings.filter(l => l !== topRecommendation);
  const explanation = topRecommendation
    ? generateLocalExplanation(topRecommendation, others)
    : 'All listings for this product are currently out of stock.';

  if (topRecommendation) {
    topRecommendation.explanation = explanation;
  }

  return {
    productId,
    productName,
    category,
    standardUnit: resolvedStandardUnit,
    topRecommendation,
    allListings: scoredListings,
    explanation,
  };
}
