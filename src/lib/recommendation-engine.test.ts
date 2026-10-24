import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBayesianRating,
  calculateQualityScore,
  calculateValueScore,
  evaluateProductListings,
} from './recommendation-engine.ts';
import { normalizeUnit } from './unit-conversion.ts';
import type { ShopProduct } from './types.ts';

test('Bayesian rating pulls low-count extreme ratings toward prior (3.5)', () => {
  // A product with 1 five-star rating
  const adjusted1 = calculateBayesianRating(5.0, 1, 3.5, 5);
  // (1 * 5 + 5 * 3.5) / 6 = (5 + 17.5) / 6 = 22.5 / 6 = 3.75
  assert.equal(adjusted1, 3.75);

  // A product with 50 ratings averaging 4.8
  const adjusted50 = calculateBayesianRating(4.8, 50, 3.5, 5);
  // (50 * 4.8 + 5 * 3.5) / 55 = (240 + 17.5) / 55 = 257.5 / 55 = 4.68
  assert.equal(adjusted50, 4.68);

  // High review volume product has higher confidence than single 5-star
  assert.ok(adjusted50 > adjusted1);
});

test('Unit conversion normalizes grams to kilograms and ml to liters', () => {
  const rice500g = normalizeUnit(30, 500, 'g');
  assert.equal(rice500g.standardUnit, 'kg');
  assert.equal(rice500g.unitPrice, 60);

  const milk500ml = normalizeUnit(28, 500, 'ml');
  assert.equal(milk500ml.standardUnit, 'L');
  assert.equal(milk500ml.unitPrice, 56);

  const eggs6 = normalizeUnit(48, 6, 'eggs');
  assert.equal(eggs6.standardUnit, 'piece');
  assert.equal(eggs6.unitPrice, 8);
});

test('Value score scores lower unit price higher', () => {
  const minPrice = 50;
  const scoreCheapest = calculateValueScore(50, minPrice);
  const scoreHigher = calculateValueScore(75, minPrice);

  assert.equal(scoreCheapest, 100);
  assert.equal(scoreHigher, 66.7);
  assert.ok(scoreCheapest > scoreHigher);
});

test('Recommendation engine identifies best trade-off and excludes out-of-stock from top recommendation', () => {
  const mockShopA = {
    id: 's1',
    owner_id: 'o1',
    shop_name: 'Shop A (Close, Balanced)',
    location: '1km away',
    latitude: 12.9784,
    longitude: 77.6408,
  };
  const mockShopB = {
    id: 's2',
    owner_id: 'o2',
    shop_name: 'Shop B (Far, Cheap)',
    location: '15km away',
    latitude: 12.8500,
    longitude: 77.6408,
  };
  const mockShopC = {
    id: 's3',
    owner_id: 'o3',
    shop_name: 'Shop C (Out of Stock)',
    location: '2km away',
    latitude: 12.9700,
    longitude: 77.6400,
  };

  const product = {
    id: 'p1',
    name: 'Farm Fresh Eggs',
    category: 'Dairy & Eggs',
    unit: 'piece',
  };

  const listings: ShopProduct[] = [
    {
      id: 'lp1',
      shop_id: 's1',
      product_id: 'p1',
      price: 50,
      quantity_value: 6,
      quantity_unit: 'piece',
      average_rating: 4.8,
      rating_count: 50,
      stock_quantity: 20,
      shop: mockShopA,
      product,
    },
    {
      id: 'lp2',
      shop_id: 's2',
      product_id: 'p1',
      price: 180,
      quantity_value: 30, // ₹6 / piece
      quantity_unit: 'piece',
      average_rating: 4.0,
      rating_count: 10,
      stock_quantity: 15,
      shop: mockShopB,
      product,
    },
    {
      id: 'lp3',
      shop_id: 's3',
      product_id: 'p1',
      price: 45,
      quantity_value: 6,
      quantity_unit: 'piece',
      average_rating: 5.0,
      rating_count: 100,
      stock_quantity: 0, // OUT OF STOCK
      shop: mockShopC,
      product,
    },
  ];

  // Customer at coordinates of Shop A (0 km from Shop A, ~14 km from Shop B)
  const result = evaluateProductListings(listings, 12.9784, 77.6408);

  assert.ok(result.topRecommendation !== null);
  // Out of stock listing lp3 cannot be top recommendation
  assert.notEqual(result.topRecommendation.listing.id, 'lp3');
  // Shop A is right next door (0 km) with 4.8 rating vs Shop B 14 km away
  assert.equal(result.topRecommendation.listing.shop_id, 's1');
  assert.ok(result.topRecommendation.scores.combinedScore > 0);
  assert.ok(result.explanation.length > 10);
});
