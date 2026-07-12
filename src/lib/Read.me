# `src/lib/` — Pricing & Data-Shaping Logic

One file: **`pricing.ts`**. Every function in it is a **pure function** —
given the same inputs, it always returns the same output, with no side
effects, no state, no `fetch`, nothing. That's a deliberate constraint: it's
what allows both the builder cards *and* the review panel to call the exact
same functions and always agree on the numbers, and it's what makes this
file trivially unit-testable in isolation (no React, no DOM, no mocking
required).

---

## `lineKey()` and `DEFAULT_VARIANT_KEY`

```ts
export const DEFAULT_VARIANT_KEY = "_default";

export function lineKey(productId: string, variantId?: string): LineKey {
  return `${productId}::${variantId ?? DEFAULT_VARIANT_KEY}`;
}
```

- This is the single most important function in the project — it's the
  formula for every key used in the `quantities` map throughout
  `useBundleStore.ts` and every component that reads from it.
- `variantId ?? DEFAULT_VARIANT_KEY` — for a product with no color variants
  (like the MicroSD card or the Duo Cam Doorbell), `variantId` is
  `undefined`, so the key falls back to a fixed `"_default"` suffix instead
  of, say, `"undefined"` leaking into the key string.
- Using `::` as the separator is an arbitrary but safe choice — it's a
  sequence that will never legitimately appear inside a product id or
  variant id defined in `catalog.json`, so splitting/matching on it is
  unambiguous.
- Because this is the *only* place this string format is constructed, if
  the separator or fallback ever needed to change, it's a one-line edit
  here rather than a search-and-replace across the whole codebase.

---

## `seedQuantities()` — turning catalog defaults into initial state

```ts
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
```

- Walks every category → every product in `catalog.json` and builds the
  complete flat `quantities` map that `useBundleStore` uses as its
  fallback/default state.
- The branch on `product.variants && product.variants.length > 0` mirrors
  the union type on `Product.initialQuantity` (`number |
  Record<string, number>`, defined in `types.ts`): if the product has
  color variants, `initialQuantity` is expected to be an object keyed by
  variant id (e.g. `{ white: 1, grey: 0, black: 0 }`); otherwise it's a
  single number.
- `seed[variant.id] ?? 0` — if `catalog.json` ever adds a new color variant
  to a product without also adding a matching entry to `initialQuantity`,
  this defaults that variant's seed quantity to `0` instead of throwing or
  producing `undefined` in the map — the app never crashes on an
  incomplete catalog entry.
- The `as Record<string, number>` / `as number` casts exist because
  TypeScript can't narrow the union type `initialQuantity` automatically
  just from checking `product.variants.length > 0` (the two fields aren't
  formally linked in the type system) — these are intentional, scoped
  assertions rather than a sign anything is unsafe, since the branch logic
  guarantees the right shape at runtime.

---

## `seedActiveVariant()` — which color chip starts "on"

```ts
export function seedActiveVariant(catalog: Catalog): Record<string, string> {
  const active: Record<string, string> = {};
  for (const category of catalog.categories) {
    for (const product of category.products) {
      if (product.variants && product.variants.length > 0) {
        const seed = (product.initialQuantity as Record<string, number>) ?? {};
        const withStock = product.variants.find((v) => (seed[v.id] ?? 0) > 0);
        active[product.id] = (withStock ?? product.variants[0]).id;
      }
    }
  }
  return active;
}
```

- For every product that has color variants, this decides which chip is
  highlighted by default when the page first loads.
- `product.variants.find((v) => (seed[v.id] ?? 0) > 0)` — it specifically
  looks for whichever variant was **seeded with a positive quantity** in
  `catalog.json` first. For the Wyze Cam v4, that's White (seeded at `1`
  while grey/black are `0`), so White is the variant that's active on
  load — which matches what a shopper would expect to see, since it's the
  one that already has a unit in their cart.
- `withStock ?? product.variants[0]` — if no variant happens to have a
  positive seed quantity (e.g. everything starts at `0`, like the
  Floodlight or Battery Cam Pro), it simply falls back to the first
  variant listed in the array, so there's always *some* sensible default
  rather than an undefined active chip.

---

## `LineItem` and `selectedLineItems()` — from raw quantities to display rows

```ts
export interface LineItem {
  product: Product;
  variantId?: string;
  variantName?: string;
  quantity: number;
  currentTotal: number;
  originalTotal?: number;
}
```

The shape every rendered row in both the builder and the review panel is
built from — it bundles the static product data together with the
*derived* numbers (line total at the current price, and — if applicable —
what that line would have cost at the original, pre-discount price).

```ts
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
```

- This is the function `ReviewPanel.tsx` calls to know exactly what to
  render: "every product+variant combination with a quantity greater than
  zero, grouped by category." A camera in white *and* black, each with
  quantity > 0, becomes **two separate `LineItem` rows** — this is exactly
  why the flat-key data model matters: the review panel doesn't need any
  special-case logic to show two colors of the same camera as two lines,
  it falls out naturally from iterating every variant independently.
- `if (quantity <= 0) continue;` — this single line is the entirety of
  "don't show items the shopper hasn't selected." There's no separate
  "isSelected" flag stored anywhere; selection is just "does this line's
  quantity map entry exist and is it positive."
- `currentTotal: round2(product.price * quantity)` — **always** per-unit
  price times quantity, for every product, with no exceptions. This is the
  concrete implementation of the "per-unit pricing everywhere" decision
  mentioned in the root README: it's what guarantees the total on screen
  is mathematically consistent even as a shopper drags a quantity up or
  down, rather than ever showing a value that was hard-coded to match one
  specific screenshot.
- `originalTotal` is `undefined` (not `0`) when a product has no
  `originalPrice` at all — this matters downstream because
  `ProductCard`/`ReviewPanel` check for truthiness (`item.originalTotal ?`)
  to decide whether to render a strikethrough price at all; a product with
  no discount correctly shows no strikethrough, rather than a strikethrough
  showing `$0.00`.
- `if (items.length > 0) grouped[category.id] = items;` — categories with
  nothing selected are simply omitted from the returned object entirely,
  rather than included as an empty array — which is what lets
  `ReviewPanel.tsx` write `if (!items || items.length === 0) return null;`
  and cleanly skip rendering, e.g., a "SENSORS" section header with nothing
  under it.

---

## `BundleTotals` and `computeTotals()` — the grand total

```ts
export interface BundleTotals {
  current: number;
  original: number;
  savings: number;
  planMonthly?: { current: number; original?: number };
}
```

- `savings` is intentionally its own field rather than something every
  caller re-derives as `original - current` inline — computed once, here,
  so the "Congrats! You're saving $X" message in the review panel and any
  future consumer always agree.
- `planMonthly` is broken out **separately** from the general `current`/
  `original` totals because the plan is billed monthly while everything
  else is a one-time purchase — callers that specifically need to render
  "$9.99/mo" differently from "$247.92" one-time need this split out,
  not merged into one undifferentiated number.

```ts
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
        planMonthly = { current: item.currentTotal, original: item.originalTotal };
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
```

- Deliberately built **on top of** `selectedLineItems()` rather than
  re-scanning `catalog`/`quantities` independently — this is the whole
  point of keeping pricing logic centralized: the review panel's line
  items and its grand total are guaranteed to be summing the exact same
  set of rows, computed the exact same way, because they share this one
  intermediate function.
- `original += item.originalTotal ?? item.currentTotal` — for a product
  with no discount (`originalTotal` is `undefined`), its *current* price is
  used as its own "original" contribution. This is what makes `savings =
  original - current` correctly come out to `0` for non-discounted
  products, instead of accidentally under-counting the "original" total and
  showing phantom savings that don't exist.
- The `categoryId === "plan"` branch both captures `planMonthly` *and*
  still folds the plan's price into the overall `current`/`original`
  totals — so the plan genuinely does count toward "Congrats, you're
  saving $X," while also being independently available for the
  `"$X.XX/mo"` display.
- `Object.entries(grouped)` naturally skips any category that
  `selectedLineItems` already omitted (nothing selected), so there's no
  need for a second round of empty-array guards here.

---

## `formatUsd()` and `round2()` — the small utilities everything else leans on

```ts
export function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
```

- `formatUsd` is the **only** place a dollar sign or `.toFixed(2)` appears
  in the whole codebase — every price shown anywhere in the UI (card,
  plan option, review line, grand total) goes through this one function,
  so a future currency/locale change is a single-function edit.
- `round2` exists specifically to avoid classic floating-point artifacts
  (e.g. `0.1 + 0.2` not being exactly `0.3` in JavaScript). It's applied
  right after every multiplication/summation in `selectedLineItems` and
  `computeTotals`, so a value like `27.98 * 3` can never silently render as
  `$83.94000000000001` — it's rounded to the nearest cent immediately,
  every time money math happens. It's kept as a **private** (non-exported)
  helper deliberately: nothing outside this file should ever need to round
  currency independently, since every currency value already leaves this
  file pre-rounded.
