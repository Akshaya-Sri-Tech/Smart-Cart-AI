/**
 * Distance calculations using Haversine formula and proximity scoring
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates great-circle distance between two coordinates in kilometers.
 * Returns null if any coordinate is missing or invalid.
 */
export function calculateHaversineDistanceKm(
  lat1: number | null | undefined,
  lon1: number | null | undefined,
  lat2: number | null | undefined,
  lon2: number | null | undefined
): number | null {
  if (
    lat1 === null ||
    lat1 === undefined ||
    lon1 === null ||
    lon1 === undefined ||
    lat2 === null ||
    lat2 === undefined ||
    lon2 === null ||
    lon2 === undefined
  ) {
    return null;
  }

  // Validate coordinates ranges
  if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) return null;
  if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) return null;

  const toRad = (angle: number) => (angle * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = EARTH_RADIUS_KM * c;
  // Round to 2 decimal places for consistency
  return Math.round(distance * 100) / 100;
}

/**
 * Calculates a proximity score from 0 to 100 based on distance in kilometers.
 * 
 * We use a smooth hyperbolic decay function:
 * Score = 100 / (1 + distanceKm * decayFactor)
 * 
 * With decayFactor = 0.12:
 * - 0 km -> 100
 * - 1 km -> 89.3
 * - 2 km -> 80.6
 * - 5 km -> 62.5
 * - 10 km -> 45.5
 * - 20 km -> 29.4
 * 
 * If distance is null (missing coordinates), default to a neutral penalty score (50).
 */
export function calculateProximityScore(
  distanceKm: number | null,
  decayFactor = 0.12
): number {
  if (distanceKm === null || distanceKm === undefined) {
    return 50; // Neutral fallback when distance cannot be computed
  }

  if (distanceKm < 0) return 100;

  const score = 100 / (1 + distanceKm * decayFactor);
  return Math.round(Math.min(100, Math.max(0, score)) * 10) / 10;
}
