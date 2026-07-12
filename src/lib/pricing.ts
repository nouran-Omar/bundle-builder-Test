import type { Catalog, LineKey, Product } from "../types";

export const DEFAULT_VARIANT_KEY = "_default";

export function lineKey(productId: string, variantId?: string): LineKey {
  return `${productId}::${variantId ?? DEFAULT_VARIANT_KEY}`;
}

export function seedQuantities(catalog: Catalog): Record<LineKey, number> {
  const quantities: Record<LineKey, number> = {};
  for (const category of catalog.categories) {
    for (const product of category.products) {
      if (product.variants && product.variants.length > 0) {
        const seed = (product.initialQuantity as Record<string, number>) ?? {};
        for (const variant of product.variants) {
          quantities[lineKey(product.id, variant.id)] = seed[variant.id] ?? 0;
        }
      } else {
        quantities[lineKey(product.id)] = (product.initialQuantity as number) ?? 0;
      }
    }
  }
  return quantities;
}

export function seedActiveVariant(catalog: Catalog): Record<string, string> {
  const active: Record<string, string> = {};
  for (const category of catalog.categories) {
    for (const product of category.products) {
      if (product.variants && product.variants.length > 0) {
        // prefer whichever variant was seeded with a positive quantity, else the first
        const seed = (product.initialQuantity as Record<string, number>) ?? {};
        const withStock = product.variants.find((v) => (seed[v.id] ?? 0) > 0);
        active[product.id] = (withStock ?? product.variants[0]).id;
      }
    }
  }
  return active;
}

export interface LineItem {
  product: Product;
  variantId?: string;
  variantName?: string;
  quantity: number;
  currentTotal: number;
  originalTotal?: number;
}

/** every product+variant combination that currently has quantity > 0, grouped by category */
export function selectedLineItems(
  catalog: Catalog,
  quantities: Record<LineKey, number>,
): Record<string, LineItem[]> {
  const grouped: Record<string, LineItem[]> = {};

  for (const category of catalog.categories) {
    const items: LineItem[] = [];
    for (const product of category.products) {
      if (product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
          const quantity = quantities[lineKey(product.id, variant.id)] ?? 0;
          if (quantity <= 0) continue;
          items.push({
            product,
            variantId: variant.id,
            variantName: variant.name,
            quantity,
            currentTotal: round2(product.price * quantity),
            originalTotal: product.originalPrice
              ? round2(product.originalPrice * quantity)
              : undefined,
          });
        }
      } else {
        const quantity = quantities[lineKey(product.id)] ?? 0;
        if (quantity <= 0) continue;
        items.push({
          product,
          quantity,
          currentTotal: round2(product.price * quantity),
          originalTotal: product.originalPrice
            ? round2(product.originalPrice * quantity)
            : undefined,
        });
      }
    }
    if (items.length > 0) grouped[category.id] = items;
  }

  return grouped;
}

export interface BundleTotals {
  current: number;
  original: number;
  savings: number;
  planMonthly?: { current: number; original?: number };
}

/**
 * Totals include every one-time line item (cameras/sensors/accessories) plus the
 * selected plan's monthly price. Fast Shipping is always free and shown separately,
 * so it's intentionally excluded from this sum.
 */
export function computeTotals(
  catalog: Catalog,
  quantities: Record<LineKey, number>,
): BundleTotals {
  const grouped = selectedLineItems(catalog, quantities);
  let current = 0;
  let original = 0;
  let planMonthly: BundleTotals["planMonthly"];

  for (const [categoryId, items] of Object.entries(grouped)) {
    for (const item of items) {
      if (categoryId === "plan") {
        planMonthly = {
          current: item.currentTotal,
          original: item.originalTotal,
        };
        current += item.currentTotal;
        original += item.originalTotal ?? item.currentTotal;
        continue;
      }
      current += item.currentTotal;
      original += item.originalTotal ?? item.currentTotal;
    }
  }

  return {
    current: round2(current),
    original: round2(original),
    savings: round2(original - current),
    planMonthly,
  };
}

export function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
