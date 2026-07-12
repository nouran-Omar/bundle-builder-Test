# `src/` — App Shell & Foundations

This folder holds everything that isn't a component, a hook, a data file, or
a pricing helper: the actual entry point, the top-level page layout, the
global stylesheet, and the shared TypeScript types every other file imports
from.

Sub-folders have their own README:
- [`components/`](./components/README.md)
- [`components/icons/`](./components/icons/README.md)
- [`hooks/`](./hooks/README.md)
- [`lib/`](./lib/README.md)
- [`data/`](./data/README.md)

---

## `main.tsx` — the entry point

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Line by line:

- `import React from "react";` — needed for JSX to compile under the classic
  runtime assumptions some tooling still expects; with the modern `jsx:
  "react-jsx"` setting in `tsconfig.json` this isn't strictly required for
  JSX itself, but it's kept for clarity and for `React.StrictMode` below.
- `import ReactDOM from "react-dom/client";` — pulls in React 18's
  **client** rendering API (`createRoot`), as opposed to the legacy
  `ReactDOM.render` from React 17 and earlier.
- `import App from "./App";` — the single top-level component that contains
  the entire page.
- `import "./index.css";` — this is what actually loads Tailwind's
  generated styles and the app's CSS custom properties into the page. Vite
  treats this as a side-effect import: nothing is exported, but the CSS
  ends up in the final bundle.
- `document.getElementById("root")!` — grabs the empty `<div id="root">`
  that `index.html` (project root) ships with. The trailing `!` is a
  TypeScript **non-null assertion**: it tells the compiler "trust me, this
  element exists," since `getElementById` is typed to possibly return
  `null`.
- `ReactDOM.createRoot(...).render(...)` — creates a React 18 root and
  mounts the tree into it. This is what enables React 18 features like
  automatic batching.
- `<React.StrictMode>` — a development-only wrapper that intentionally
  double-invokes certain lifecycle functions and renders to help catch
  side-effect bugs early. It has zero effect on the production build.

---

## `App.tsx` — the page layout

This is the only component in the whole app that talks to
`useBundleStore` directly. Every other component receives what it needs as
props — `App.tsx` is the wiring closet.

```tsx
import { useBundleStore } from "./hooks/useBundleStore";
import { BuilderStep } from "./components/BuilderStep";
import { ReviewPanel } from "./components/ReviewPanel";

export default function App() {
  const {
    catalog,
    state,
    selectedCounts,
    savedAt,
    setQuantity,
    setActiveVariant,
    setOpenStep,
    goToNextStep,
    saveForLater,
  } = useBundleStore();

  const totalSteps = catalog.categories.length;
```

- The destructured object is *everything* the UI needs: the static product
  data (`catalog`), the live state (`state`), a derived summary
  (`selectedCounts`), the last-saved timestamp (`savedAt`), and five setter
  functions. Nothing here is computed inside `App.tsx` itself — all of that
  logic lives in the hook (see [`hooks/README.md`](./hooks/README.md)).
- `totalSteps = catalog.categories.length` — instead of hard-coding "4" in
  the `StepHeader` (`STEP {n} OF {totalSteps}`), it's derived from the
  actual catalog. Add a 5th step to `catalog.json` and every "STEP X OF 4"
  label updates itself to "OF 5" automatically.

```tsx
  return (
    <main
      className="min-h-screen bg-white grid grid-cols-1 md:grid-cols-[1fr_399px] gap-6 md:gap-[29px] dxl:grid-cols-1 dxl:gap-6 px-4 sm:px-6 lg:px-[60px] pt-8 pb-16 mx-auto max-w-[1440px] items-start"
      aria-label="Security setup and order review"
    >
```

- This single `className` string is the entire responsive layout system for
  the page:
  - `grid grid-cols-1` — mobile default: one column, builder stacked above
    review.
  - `md:grid-cols-[1fr_399px]` — from the `md` breakpoint up, it becomes a
    **two-column CSS grid**: the builder column takes all remaining space
    (`1fr`) and the review panel gets a fixed `399px` sidebar.
  - `dxl:grid-cols-1` — `dxl` is a **custom breakpoint** defined in
    `tailwind.config.js` (`1440px`). At very large viewports the layout
    intentionally goes back to a single column so the review panel can
    become its own separate sidebar layout (its internal grid takes over —
    see `ReviewPanel.tsx`).
  - `max-w-[1440px] mx-auto` — caps the whole page width and centers it on
    ultra-wide monitors.
  - `aria-label="Security setup and order review"` — gives assistive
    technology a name for this landmark region since `<main>` alone doesn't
    describe what's inside.

```tsx
      <header className="md:hidden">
        <h1 className="font-display text-[#1f1f1f] text-[31.875px] leading-[110%] tracking-[-0.064px] text-center">
          Let&apos;s get started!
        </h1>
      </header>
```

- A mobile-only (`md:hidden`) greeting heading. On tablet/desktop the design
  doesn't show this — the step headers themselves carry enough context.

```tsx
      <section aria-label="Security setup flow" className="flex-1 flex flex-col gap-3">
        {catalog.categories.map((category, index) => (
          <BuilderStep
            key={category.id}
            category={category}
            totalSteps={totalSteps}
            isOpen={state.openStep === category.id}
            isLast={index === catalog.categories.length - 1}
            selectedCount={selectedCounts[category.id]}
            quantities={state.quantities}
            activeVariant={state.activeVariant}
            onToggle={() => setOpenStep(category.id)}
            onQuantityChange={(productId, variantId, next) =>
              setQuantity(productId, variantId, next)
            }
            onVariantChange={setActiveVariant}
            onNext={() => goToNextStep(category.id)}
          />
        ))}
      </section>
```

- The entire accordion is one `.map()` over `catalog.categories` — there is
  no component in the codebase called `<CamerasStep>` or `<PlanStep>`.
  Every step is the *same* `BuilderStep` component, driven entirely by the
  category object it's given. This is the "data-driven" part of the
  project: adding a 5th step to the JSON automatically produces a 5th
  accordion panel with zero component changes.
- `key={category.id}` — React's list-reconciliation key; using the stable
  `id` string (`"cameras"`, `"plan"`, …) instead of the array index avoids
  subtle re-render bugs if categories were ever reordered.
- `isOpen={state.openStep === category.id}` — only one step is "open" at a
  time; `openStep` in the hook's state holds a single category id (or
  `null`), so this comparison is what turns the accordion into an
  accordion rather than a plain expand-all list.
- `isLast={index === catalog.categories.length - 1}` — the last step
  doesn't get a "Next: …" button (there's nowhere to go), so `BuilderStep`
  needs to know it's the final one.
- `onQuantityChange` — deliberately re-wrapped in an arrow function here
  even though it could be passed directly, purely to keep the prop's
  parameter names self-documenting at the call site (`productId, variantId,
  next`) rather than relying on the reader to know `setQuantity`'s
  signature by memory.
- `onVariantChange={setActiveVariant}` — passed directly (no wrapper)
  because its signature already matches exactly what `BuilderStep` expects.

```tsx
      <ReviewPanel
        catalog={catalog}
        quantities={state.quantities}
        onQuantityChange={setQuantity}
        onSave={saveForLater}
        savedAt={savedAt}
      />
    </main>
  );
}
```

- The review panel gets the **same** `catalog` and `quantities` the builder
  uses, and the **same** `setQuantity` function. That's deliberate: a
  shopper can decrease a camera's quantity from the summary panel on the
  right just as easily as from the card on the left, and both paths update
  the exact same state, so they can never drift out of sync.

---

## `index.css` — Tailwind layers & design tokens

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --corewyze-purple: rgba(78, 47, 210, 1);
  --gray-c200: rgba(240, 244, 247, 1);
  --gray-c300: rgba(230, 235, 240, 1);
  --gray-c500: rgba(168, 178, 189, 1);
  --gray-c600: rgba(111, 120, 130, 1);
  --gray-cobsidian: rgba(11, 13, 16, 1);
  --gray-cwhite: rgba(255, 255, 255, 1);
  --review-bg: rgba(237, 244, 255, 1);
  --utility-white: rgba(255, 255, 255, 1);
}
```

- The three `@tailwind` directives inject Tailwind's base reset, its
  component layer, and its generated utility classes, in that order — this
  is the standard entry point for any Tailwind project.
- The `:root` block defines every brand color as a **CSS custom property**
  rather than a hard-coded hex value. `tailwind.config.js` then maps
  Tailwind class names (like `bg-corewyze-purple` or `text-gray-c600`)
  straight to these variables (`var(--corewyze-purple)`). The benefit: a
  rebrand or dark-mode variant only ever needs to touch this one block —
  every component using `corewyze-purple` picks up the change automatically
  without a single line of component code changing.

```css
@layer base {
  button, input, select, textarea {
    @apply appearance-none bg-transparent border-0 outline-none;
  }
  button { cursor: pointer; }
  button:disabled { cursor: not-allowed; }
  * { -webkit-tap-highlight-color: transparent; }
}
```

- Strips every browser's default form-control chrome (borders, background,
  the blue focus outline) so that **every** visual state — hover, focus,
  disabled — is explicitly designed in the component itself via Tailwind
  classes, rather than fighting inconsistent native styling across
  browsers.
- `-webkit-tap-highlight-color: transparent` removes the gray flash Safari
  and Chrome on mobile show when you tap a link/button, since the app
  already has its own deliberate hover/active states.

```css
@layer utilities {
  .all-unset { all: unset; }
  .focus-ring:focus-visible {
    outline: 2px solid var(--corewyze-purple);
    outline-offset: 2px;
    border-radius: 4px;
  }
}
```

- `.focus-ring` is a hand-rolled utility class used throughout the
  component tree (buttons, chips, the save link) to restore a **visible,
  accessible** keyboard focus indicator — since the base layer above just
  removed the browser's default one. `:focus-visible` (rather than plain
  `:focus`) ensures the ring only shows for keyboard/assistive-tech
  navigation, not for a mouse click, matching modern accessibility best
  practice.

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- Respects the OS-level "Reduce Motion" accessibility setting. Any user who
  has that turned on will see the 500ms accordion-open animation, the 300ms
  color transitions, etc. all collapse to effectively instant — nothing in
  the app moves against their preference.

---

## `types.ts` — the shared vocabulary

Every file in the project imports its shapes from here instead of
redefining them locally, which is what keeps `ProductCard`, `pricing.ts`,
and `catalog.json` all speaking the same language.

```ts
export type CategoryId = "cameras" | "plan" | "sensors" | "accessories";
```
A string **union type**, not a generic `string`. This means anywhere a
`CategoryId` is expected, TypeScript will reject a typo like `"camera"` or
`"Plan"` at compile time — the four valid step ids are enumerated once,
here, and everything else refers back to this type.

```ts
export interface Variant {
  id: string;
  name: string;
  image?: string;
  swatchColor?: string;
}
```
One entry in a product's color-chip row. `image` and `swatchColor` are both
optional (`?`) because `VariantSelector.tsx` falls back to a flat
`swatchColor` circle when no real product photo exists yet for that color.

```ts
export interface Product {
  id: string;
  category: CategoryId;
  name: string;
  description?: string;
  learnMoreHref?: string;
  badge?: string;
  image?: string;
  originalPrice?: number;
  price: number;
  priceLabel?: string;
  billingSuffix?: "/mo";
  variants?: Variant[];
  locked?: boolean;
  initialQuantity?: number | Record<string, number>;
}
```
This is the type every single card, plan option, and review-panel line item
is built from. A few fields worth calling out:
- `originalPrice?` — only present when a product is discounted; its
  presence is literally what triggers the strikethrough price everywhere
  it's rendered.
- `priceLabel?` — overrides the computed price display outright (used for
  `"FREE"` on the required sensor hub).
- `locked?` — the sensor hub can't be removed by the shopper; the review
  panel's `QuantityStepper` reads this flag to disable its own minus
  button.
- `initialQuantity?: number | Record<string, number>` — a **union type**
  that's the seed value for a product's quantity. It's a plain `number` for
  products with no color variants, but a `{ variantId: number }` map for
  products that do have variants, so each color can start with a different
  seeded quantity (see `catalog.json`'s `wyze-cam-v4`, which seeds white at
  `1` and grey/black at `0`).

```ts
export interface CatalogCategory {
  id: CategoryId;
  step?: number;
  title: string;
  singleSelect?: boolean;
  products: Product[];
}

export interface Catalog {
  categories: CatalogCategory[];
  shipping: { name: string; originalPrice: number; priceLabel: string };
}
```
`singleSelect?: boolean` is the one flag that turns a whole accordion step
into radio-button behavior. `BuilderStep.tsx` branches its rendering on
this exact property: `true` → render `<PlanOption>` cards inside a
`role="radiogroup"`; falsy → render the normal `<ProductCard>` grid.

```ts
export type LineKey = string;

export interface BundleState {
  quantities: Record<LineKey, number>;
  activeVariant: Record<string, string>;
  openStep: CategoryId | null;
}
```
- `LineKey` is a **type alias**, not a new type — it exists purely so that
  `Record<LineKey, number>` reads as "a map of line-item keys to
  quantities" instead of the less meaningful `Record<string, number>`.
- `BundleState` is the entire shape of what `useBundleStore` manages and
  what gets written to `localStorage`/`sessionStorage`. See
  [`hooks/README.md`](./hooks/README.md) for how `quantities` keys are
  actually constructed and why a flat map (instead of nested per-product
  state) was the right call here.
