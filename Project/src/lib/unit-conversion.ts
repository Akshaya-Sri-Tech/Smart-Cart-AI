/**
 * Unit conversion and unit price calculation
 */

export interface UnitConversionResult {
  standardQuantity: number; // e.g. 0.5 for 500g in kg
  standardUnit: string;     // kg, L, piece, pack
  unitPrice: number;        // price per 1 standard unit
  isValid: boolean;
}

/**
 * Normalizes a quantity and its unit into a standard unit:
 * - Weight: 'g', 'gram', 'grams' -> 'kg'
 * - Volume: 'ml', 'milliliter', 'millilitre' -> 'L'
 * - Count/Items: 'egg', 'eggs', 'piece', 'pieces', 'pc' -> 'piece'
 * - Pack: 'pack', 'packet' -> 'pack'
 */
export function normalizeUnit(
  price: number,
  quantityValue: number,
  quantityUnit: string
): UnitConversionResult {
  if (price <= 0 || quantityValue <= 0 || !quantityUnit) {
    return {
      standardQuantity: 0,
      standardUnit: quantityUnit || 'unit',
      unitPrice: 0,
      isValid: false,
    };
  }

  const unitLower = quantityUnit.trim().toLowerCase();

  // Weight normalization -> kg
  if (unitLower === 'g' || unitLower === 'gram' || unitLower === 'grams') {
    const standardQuantity = quantityValue / 1000;
    const unitPrice = price / standardQuantity;
    return {
      standardQuantity,
      standardUnit: 'kg',
      unitPrice: Math.round(unitPrice * 100) / 100,
      isValid: true,
    };
  }
  if (unitLower === 'kg' || unitLower === 'kilogram' || unitLower === 'kilograms') {
    const standardQuantity = quantityValue;
    const unitPrice = price / standardQuantity;
    return {
      standardQuantity,
      standardUnit: 'kg',
      unitPrice: Math.round(unitPrice * 100) / 100,
      isValid: true,
    };
  }

  // Volume normalization -> L
  if (
    unitLower === 'ml' ||
    unitLower === 'milliliter' ||
    unitLower === 'millilitre' ||
    unitLower === 'mls'
  ) {
    const standardQuantity = quantityValue / 1000;
    const unitPrice = price / standardQuantity;
    return {
      standardQuantity,
      standardUnit: 'L',
      unitPrice: Math.round(unitPrice * 100) / 100,
      isValid: true,
    };
  }
  if (
    unitLower === 'l' ||
    unitLower === 'liter' ||
    unitLower === 'litre' ||
    unitLower === 'liters' ||
    unitLower === 'litres'
  ) {
    const standardQuantity = quantityValue;
    const unitPrice = price / standardQuantity;
    return {
      standardQuantity,
      standardUnit: 'L',
      unitPrice: Math.round(unitPrice * 100) / 100,
      isValid: true,
    };
  }

  // Count/Pieces -> piece
  if (
    unitLower === 'egg' ||
    unitLower === 'eggs' ||
    unitLower === 'piece' ||
    unitLower === 'pieces' ||
    unitLower === 'pc' ||
    unitLower === 'pcs' ||
    unitLower === 'item' ||
    unitLower === 'items'
  ) {
    const standardQuantity = quantityValue;
    const unitPrice = price / standardQuantity;
    return {
      standardQuantity,
      standardUnit: 'piece',
      unitPrice: Math.round(unitPrice * 100) / 100,
      isValid: true,
    };
  }

  // Pack/Packets -> pack
  if (
    unitLower === 'pack' ||
    unitLower === 'packet' ||
    unitLower === 'packs' ||
    unitLower === 'packets' ||
    unitLower === 'loaf' ||
    unitLower === 'loaves'
  ) {
    const standardQuantity = quantityValue;
    const unitPrice = price / standardQuantity;
    return {
      standardQuantity,
      standardUnit: 'pack',
      unitPrice: Math.round(unitPrice * 100) / 100,
      isValid: true,
    };
  }

  // Fallback for custom units
  const standardQuantity = quantityValue;
  const unitPrice = price / standardQuantity;
  return {
    standardQuantity,
    standardUnit: unitLower,
    unitPrice: Math.round(unitPrice * 100) / 100,
    isValid: true,
  };
}
