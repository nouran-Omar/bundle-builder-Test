# `src/data/` — The Product Catalog

One file: **`catalog.json`**. This is the single source of truth for every
product, price, variant, and seed quantity in the app. Nothing else in the
codebase hard-codes a product name or a dollar amount — everything you see
on screen (cards, plan options, review lines, totals) is derived from this
file by `lib/pricing.ts` and rendered by the components in
`src/components/`.

It's imported as a typed JSON module in `useBundleStore.ts`
(`import catalogJson from "../data/catalog.json"`, then cast `as Catalog`),
so its shape is checked against the `Catalog` / `CatalogCategory` / `Product`
/ `Variant` interfaces in `src/types.ts` at compile time. If you add a field
here that the type doesn't expect, or omit a required one, `npm run build`
(which runs `tsc -b` first) will fail loudly rather than shipping a broken
catalog.

---

## Top-level shape

```json
{
  "categories": [ /* CatalogCategory[] */ ],
  "shipping": {
    "name": "Fast Shipping",
    "originalPrice": 5.99,
    "priceLabel": "FREE"
  }
}
```

- `categories` — an ordered array of the four accordion steps. Order here
  is display order: `App.tsx` does one `catalog.categories.map()` and
  renders a `BuilderStep` for each entry in the array, in array order — so
  reordering steps in the product is a matter of reordering this array, not
  touching any component.
- `shipping` — a single flat object, not a product. It's rendered as its
  own line in `ReviewPanel.tsx` (with the `ShippingIcon`) but is
  deliberately **excluded** from `computeTotals()`'s sum in `lib/pricing.ts`
  because it's always free and isn't a "thing you add more units of" — see
  the comment above `computeTotals()` in
  [`lib/README.md`](../lib/README.md).
  - `originalPrice` — shown with a strikethrough (`$5.99`).
  - `priceLabel` — the actual display value (`"FREE"`), overriding the
    computed price the same way `Product.priceLabel` does.

---

## Anatomy of a `CatalogCategory`

```json
{
  "id": "cameras",
  "step": 1,
  "title": "Choose your cameras",
  "products": [ /* Product[] */ ]
}
```

- `id` — must be one of the four literal strings in the `CategoryId` union
  type (`"cameras" | "plan" | "sensors" | "accessories"`), defined in
  `types.ts`. This is also the key `BuilderStep.tsx` uses to pick the right
  step icon out of `STEP_ICONS`, and the key `useBundleStore.ts`'s
  `openStep` field points at when a step is expanded.
- `step` — the human-facing number shown in "STEP 1 OF 4." It's optional in
  the type (`step?: number`) and defaults to `1` in `BuilderStep.tsx`
  (`category.step ?? 1`) if ever omitted, though every category currently
  sets it explicitly and in order (1, 2, 3, 4).
- `title` — the heading text rendered next to the step icon
  (`"Choose your cameras"`, `"Choose your plan"`, etc.), and also what
  drives the "Next: …" button labels via the separate `NEXT_LABELS` map in
  `BuilderStep.tsx` (that map is keyed by `id`, not `title`, so changing a
  title here doesn't automatically change the "Next: …" button text — see
  the note on the `plan` category below).
- `singleSelect` — **only present on the `"plan"` category.** This one
  boolean flag is what makes `BuilderStep.tsx` render `<PlanOption>` radio
  cards inside a `role="radiogroup"` instead of the normal `<ProductCard>`
  grid, and it's what makes `useBundleStore.ts`'s `setQuantity` zero out
  every sibling product in the category whenever one is picked. Every other
  category simply omits this field (falsy by default).
- `products` — the array of `Product` objects that appear inside this
  step's panel, in display order.

---

## Anatomy of a `Product`

Every product in the catalog is one JSON object matching the `Product`
interface in `types.ts`. Two concrete examples cover every field in use:

### A variant product — `wyze-cam-v4`

```json
{
  "id": "wyze-cam-v4",
  "category": "cameras",
  "name": "Wyze Cam v4",
  "description": "The clearest Wyze Cam ever made.",
  "learnMoreHref": "#",
  "badge": "Save 22%",
  "image": "/images/wyze-cam-v4.png",
  "originalPrice": 35.98,
  "price": 27.98,
  "initialQuantity": { "white": 1, "grey": 0, "black": 0 },
  "variants": [
    { "id": "white", "name": "White", "image": "/images/wyze-cam-v4.png", "swatchColor": "#f2f2f2" },
    { "id": "grey", "name": "Grey", "image": "/images/wyze-cam-v4-gray.png", "swatchColor": "#9aa0a6" },
    { "id": "black", "name": "Black", "image": "/images/wyze-cam-v4-black.png", "swatchColor": "#1f1f1f" }
  ]
}
```

- `id` — must be **globally unique across the entire catalog**, not just
  within its category. It's what `lineKey()` in `lib/pricing.ts` uses as
  the first half of every quantity-map key, and what `useBundleStore.ts`
  searches `catalog.categories` for on every `setQuantity` call.
- `category` — a `CategoryId` that should match the id of the
  `CatalogCategory` this product lives under. Nothing in the code
  cross-checks this against the actual array nesting, so it's a bit of
  redundant data — but it's kept on the type because a `Product` object is
  occasionally handled on its own (e.g. inside a `LineItem` in
  `ReviewPanel.tsx`) without its parent category in scope.
- `badge` — the small purple pill ("Save 22%") rendered in the top-left
  corner of the product image in `ProductCard.tsx`. Purely cosmetic/
  marketing copy — it doesn't have to mathematically match the discount
  percentage implied by `price`/`originalPrice`, so keep it in sync by hand
  if either price changes.
- `originalPrice` / `price` — **both are always per-unit**, never a line
  total. `originalPrice` is optional; its mere presence is what triggers a
  strikethrough price everywhere this product is rendered (card, review
  line, plan option). Omit it entirely for non-discounted products (see
  `wyze-duo-cam-doorbell` below) rather than setting it equal to `price`.
- `initialQuantity` — here it's an **object keyed by variant id**
  (`{ white: 1, grey: 0, black: 0 }`) because this product has `variants`.
  This is what `seedQuantities()` in `lib/pricing.ts` reads to build the
  starting `quantities` map, and what `seedActiveVariant()` reads to decide
  which color chip is highlighted by default (whichever variant has a
  positive seed — White, here — falling back to the first listed variant
  if none do).
- `variants` — an array of `{ id, name, image?, swatchColor? }` objects,
  rendered as the color-chip row by `VariantSelector.tsx`. Each `variant.id`
  must be unique **within this product** (it doesn't need to be globally
  unique — `lineKey()` combines it with the parent `product.id`). Every
  entry in `initialQuantity` should have a matching `variant.id` here, and
  vice versa; if a variant is added to `variants` without a matching
  `initialQuantity` entry, `seedQuantities()` safely defaults it to `0`
  rather than crashing (see [`lib/README.md`](../lib/README.md)).

### A non-variant product — `wyze-duo-cam-doorbell`

```json
{
  "id": "wyze-duo-cam-doorbell",
  "category": "cameras",
  "name": "Wyze Duo Cam Doorbell",
  "description": "Two cameras. Two views. Double the porch protection.",
  "learnMoreHref": "#",
  "image": "/images/wyze-duo-cam-doorbell.png",
  "price": 69.98,
  "initialQuantity": 0
}
```

- No `variants` key at all (rather than an empty array) — `ProductCard.tsx`
  checks `product.variants && product.variants.length > 0` before
  rendering a `VariantSelector`, so omitting the key entirely is the
  correct way to say "this product has no color options."
- No `originalPrice` — no strikethrough shown anywhere for this product.
- `initialQuantity` here is a **plain number** (`0`), matching the
  non-variant branch of the `initialQuantity?: number | Record<string,
  number>` union type. `seedQuantities()` branches on
  `product.variants && product.variants.length > 0` to decide which half
  of that union to expect.

### Special-case fields, seen elsewhere in the file

- **`priceLabel`** (on `wyze-sense-hub` and both `plan` products' price
  displays) — overrides the computed `formatUsd(price)` string outright.
  `wyze-sense-hub` sets `"price": 0, "priceLabel": "FREE"` — the numeric
  `price` still participates correctly in `computeTotals()` (adding `$0`),
  while the *display* says "FREE" instead of "$0.00" everywhere it's shown.
- **`locked`** (only on `wyze-sense-hub`) — the required sensor hub. This
  single boolean is the entire implementation of "the shopper can't remove
  this." `useBundleStore.ts`'s `setQuantity` no-ops any change to a locked
  product, and `QuantityStepper` (via `ReviewPanel.tsx` passing
  `minQuantity={item.product.locked ? 1 : 0}`) disables its own minus
  button once quantity would drop below 1.
- **`billingSuffix`** (only on the two `plan` products,
  `cam-unlimited`/`cam-basic`) — the type restricts this to the literal
  `"/mo"` (not a general string), since the plan category is the only
  recurring-billing item in the catalog. It's appended after the formatted
  price in `PlanOption.tsx` and `ReviewPanel.tsx` (`{formatUsd(price)}{
  product.billingSuffix}` → `"$9.99/mo"`).
- **`learnMoreHref`** — when present, `ProductCard.tsx` renders a
  `"Learn More"` link right after the description text. It's `"#"` for
  every product currently (a placeholder), but any real URL works with no
  code changes since the component just renders `<a href={learnMoreHref}>`.

---

## Why one big JSON file instead of one file per product

Every price/quantity/grouping function in `lib/pricing.ts` takes the whole
`Catalog` object and walks it top-to-bottom
(`for (const category of catalog.categories) { for (const product of
category.products) { ... } } }`). Splitting products into separate files
would mean assembling them back into this same nested shape somewhere
before any of that math could run — so keeping it as one file that already
matches the `Catalog` type exactly is what lets `catalogJson as Catalog` in
`useBundleStore.ts` be a zero-work, one-line type assertion instead of a
build step.

## Adding a new product or step

Because everything downstream is data-driven off this file:

1. **New product in an existing category** — add a new object to that
   category's `products` array. It appears in the grid automatically; no
   component changes needed. Remember to add a matching entry under
   `public/images/` if it has an `image` (see
   [`public/images/README.md`](../../public/images/README.md)).
2. **New color variant on an existing product** — add an entry to that
   product's `variants` array *and* a matching key in its
   `initialQuantity` object (or let it default to `0`, which is safe but
   means the variant starts unselected).
3. **New accordion step entirely** — add a new `CatalogCategory` object to
   `categories`, giving it the next `step` number and a `CategoryId` that
   you've also added to the `CategoryId` union in `types.ts` (and to
   `STEP_ICONS`/`NEXT_LABELS` in `BuilderStep.tsx`, and to the initial
   `counts` object in `useBundleStore.ts`'s `selectedCounts` — those three
   spots are the only places a category id is still enumerated by hand
   rather than derived from the catalog).