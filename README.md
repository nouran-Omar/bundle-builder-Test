# Corewyze Bundle Builder

A data-driven, two-column bundle builder: a 4-step accordion on the left
(cameras → plan → sensors → extra protection) and a live order-review panel
on the right that stays in sync with every change.

Built with **React 18 + TypeScript + Vite + Tailwind CSS**, no backend
required (the "bonus" JSON-API step was skipped in favor of a well-typed
local `catalog.json` — see *Tradeoffs* below).

## Run it

Requires Node 18+.

```bash
npm install
npm run dev       # http://localhost:5173
```

Other scripts:

```bash
npm run build      # type-checks then builds to /dist
npm run preview    # serves the production build locally
```

## Project structure

```
src/
  data/catalog.json        # the single source of truth for every product,
                            # its variants, prices, and seed quantities
  types.ts                 # shared domain types (Product, Variant, Catalog…)
  lib/pricing.ts            # pure functions: line totals, grouping, grand total
  hooks/useBundleStore.ts  # all app state: quantities, active variant per
                            # product, open accordion step, localStorage sync
  components/
    BuilderStep.tsx         # one accordion step (header + its product grid)
    StepHeader.tsx          # "STEP X OF 4" header row shared by every step
    ProductCard.tsx         # camera/sensor/accessory card (badge, variants,
                            # stepper, pricing, selected-state border)
    PlanOption.tsx          # radio-style plan card (no stepper — the plan
                            # step is single-select)
    VariantSelector.tsx     # the color/variant chip row
    QuantityStepper.tsx     # shared +/- control, used on cards AND in the
                            # review panel so they can never drift apart
    ReviewPanel.tsx         # "Your security system" summary + totals
public/images/              # where real Figma-exported product photos go
                            # (see public/images/README.md)
```

## How the data model works

Every product lives in `catalog.json` under one of four categories
(`cameras`, `plan`, `sensors`, `accessories`). Nothing about a specific
product is hardcoded into a component — add a fifth camera or a third plan
tier by editing the JSON only.

- **Quantities** are stored in a single flat map keyed by
  `` `${productId}::${variantId ?? "_default"}` ``. That's what makes the
  variant behavior in the spec work correctly: Red and Blue of the same
  camera are genuinely separate counters, and switching the active color chip
  only changes *which* counter the stepper is currently pointed at — it never
  merges or resets the other variant's count.
- **`activeVariant`** tracks which chip is "selected" per product, purely for
  display/stepper-binding purposes (per the brief, chip highlight styling
  itself wasn't required).
- The **plan** category is flagged `singleSelect: true`. Picking a plan
  zeroes every sibling in that category, which is what gives it radio-button
  behavior while reusing the exact same quantity map as everything else.
- The **review panel never re-implements pricing**. It calls the same
  `computeTotals` / `selectedLineItems` helpers the builder cards use, so the
  "N selected" counters, the line prices, and the grand total are always
  derived from one place.

## Persistence ("Save my system for later")

Clicking **Save my system for later** writes the full state (quantities,
active variants, which step is open) to `localStorage` under
`corewyze:bundle-builder:v1`. On load, `useBundleStore` reads that key back
before falling back to the seeded defaults — so configure → save → reload →
it's exactly as you left it. The current in-progress session is also
mirrored to `sessionStorage` on every change as a safety net against an
accidental refresh before the shopper has explicitly saved.

## Motion & layout

- The accordion doesn't just mount/unmount — each step's body animates open
  and closed over 500ms using a `grid-template-rows: 0fr → 1fr` transition
  (paired with an opacity fade), so expanding a step actually "drops down"
  instead of popping into place. Collapsed panels get `inert` so keyboard
  and screen-reader users can't tab into hidden content.
- Hover/selection feedback (cards, chips, steppers, buttons) uses a
  deliberate 300ms color transition rather than an instant snap.
- Layout leans on **CSS Grid** for structure — the page shell is a
  `grid-cols-[1fr_399px]` two-column grid on desktop, and each step's
  product cards sit in a `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` grid —
  with **Flexbox** used inside individual cards/rows for alignment.

## Responsiveness

The two columns stack (builder first, review panel second) below the `lg`
breakpoint, product cards drop from a fixed width to `flex-1 min-w-[…]`
so they wrap naturally, and the review panel becomes `sticky` only once
there's room for it beside the builder. All interactive targets keep a
visible focus ring (`focus-ring` utility) for keyboard use.

## Tradeoffs / what's simplified vs. the Figma file

- **Images**: `catalog.json` now points at the exact filenames from your
  exported Figma asset folder (`wyze-cam-v4.png`, `wyze-cam-v4-gray.png`,
  `wyze-cam-v4-black.png`, `wyze-cam-pan-v3-white.png`, etc. — see
  `public/images/README.md` for the full list). Drop your actual PNG/SVG
  files into `public/images/` with those names and every card and review
  line picks them up automatically, no code changes needed.
- **Per-unit vs. line-total pricing**: the Figma mockup shows Wyze Cam Pan
  v3's price as if it were a fixed line total ($47.98 at qty 2) rather than
  a per-unit price × quantity. Since the brief explicitly requires the total
  to *recalculate* as quantities change, I treat every price in the catalog
  as **per-unit** and multiply by quantity everywhere. This reproduces the
  exact numbers shown in the screenshots at the seeded quantities, but if you
  change a quantity the math stays internally consistent rather than copying
  the mockup's apparent inconsistency.
- **"as low as $X/mo" financing line**: the source design doesn't specify the
  financing formula, so this is a placeholder estimate, not a real financing
  integration.
- **Plan step** only ships two example tiers (Cam Unlimited / Cam Basic) — the
  brief's screenshots only ever show one plan selected with no second option
  visible, so a second tier was invented to make the single-select behavior
  demonstrable.
- **Checkout** is a placeholder alert, as explicitly allowed by the brief.
- No backend/API layer (the "bonus" requirement) — `catalog.json` is bundled
  directly. Swapping it for a fetch from a small Express/Next route would
  only touch `useBundleStore`'s initial load.

## Accessibility & SEO notes

- Each accordion step is a proper disclosure: `aria-expanded` /
  `aria-controls` on the trigger, `role="region"` + `aria-labelledby` on the
  panel.
- Quantity steppers use `<output>` with `aria-label`s that name the exact
  product (and variant, in the review panel) they control.
- The plan step uses `role="radiogroup"` / `role="radio"` since only one
  selection is meaningful at a time.
- `index.html` ships a descriptive `<title>`, meta description, canonical
  tag, and Open Graph / Twitter card tags for link previews.
