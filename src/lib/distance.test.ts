import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateHaversineDistanceKm, calculateProximityScore } from './distance.ts';

test('Haversine distance returns 0 for same point', () => {
  const d = calculateHaversineDistanceKm(12.9784, 77.6408, 12.9784, 77.6408);
  assert.equal(d, 0);
});

test('Haversine distance calculates accurate distance between known Bangalore points', () => {
  // Indiranagar (12.9784, 77.6408) to Domlur (12.9609, 77.6387) ~ 1.9 km
  const d = calculateHaversineDistanceKm(12.9784, 77.6408, 12.9609, 77.6387);
  assert.ok(d !== null);
  assert.ok(d >= 1.8 && d <= 2.1, `Expected ~1.95km, got ${d}`);
});

test('Haversine distance returns null on missing or invalid coordinates', () => {
  assert.equal(calculateHaversineDistanceKm(null, 77.64, 12.97, 77.64), null);
  assert.equal(calculateHaversineDistanceKm(12.97, 77.64, undefined, 77.64), null);
  assert.equal(calculateHaversineDistanceKm(100, 77.64, 12.97, 77.64), null); // Invalid lat > 90
});

test('Proximity score decreases as distance increases', () => {
  const score0km = calculateProximityScore(0);
  const score1km = calculateProximityScore(1);
  const score5km = calculateProximityScore(5);
  const score20km = calculateProximityScore(20);

  assert.equal(score0km, 100);
  assert.ok(score0km > score1km);
  assert.ok(score1km > score5km);
  assert.ok(score5km > score20km);
});

test('Proximity score returns neutral 50 for null distance', () => {
  assert.equal(calculateProximityScore(null), 50);
});
