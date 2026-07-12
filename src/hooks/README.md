# `src/hooks/` — Application State

One file, one job: **`useBundleStore.ts`** is the only place in the entire
codebase that owns state. Every component — `App.tsx`, every card, the
review panel — is a "dumb" renderer that receives data and callback
functions from this hook. If you're trying to understand *why* something on
screen changed, the answer is always somewhere in this file.

---

## The core idea: one flat quantity map

Before reading the code, it helps to understand the data-modeling decision
this whole hook is built around.

Instead of state shaped like:

```ts
{ "wyze-cam-v4": { white: 1, grey: 0, black: 0 }, "wyze-cam-pan-v3": { ... } }
```

...the app stores state as one **flat** object where every distinct
selectable thing — a specific product in a specific color — gets its own
top-level key:

```ts
{
  "wyze-cam-v4::white": 1,
  "wyze-cam-v4::grey": 0,
  "wyze-cam-v4::black": 0,
  "wyze-cam-pan-v3::white": 2,
  "cam-unlimited::_default": 1,
}
```

That key format (`${productId}::${variantId ?? "_default"}`) is produced by
`lineKey()` in `lib/pricing.ts` and is used **everywhere** — this hook,
every component, the pricing math — so there is only one place that could
ever get it wrong. The payoff: switching the active color chip on a camera
never resets or merges the other color's count, because "White qty" and
"Grey qty" are two completely independent keys in the same map, not two
values nested under one product.

---

## Imports and setup

```ts
import { useCallback, useEffect, useMemo, useState } from "react";
import catalogJson from "../data/catalog.json";
import type { BundleState, Catalog, CategoryId } from "../types";
import { lineKey, seedActiveVariant, seedQuantities } from "../lib/pricing";

const catalog = catalogJson as Catalog;
const STORAGE_KEY = "corewyze:bundle-builder:v1";
```

- `catalogJson` is imported directly as a **JSON module** — Vite/TypeScript
  supports this natively (`resolveJsonModule: true` in `tsconfig.json`),
  so `catalog.json` becomes a regular JS object at build time, no `fetch`
  needed.
- `catalog = catalogJson as Catalog` — a type assertion. The raw JSON is
  untyped by default; this line tells TypeScript "treat this object as
  matching the `Catalog` interface," which is what gives every downstream
  `catalog.categories[i].products[j].price` access full autocomplete and
  type-checking.
- `catalog` is declared **once, at module scope**, outside the hook
  function. This matters: it means the catalog is parsed once when the
  module first loads, not re-created on every component render.
- `STORAGE_KEY` — the single localStorage/sessionStorage key the whole app
  reads and writes. Versioned (`:v1`) so a future breaking change to the
  state shape can bump this string and safely ignore old saved data instead
  of crashing on it.

---

## `loadInitialState()` — figuring out where the app starts

```ts
function loadInitialState(): BundleState {
  const fallback: BundleState = {
    quantities: seedQuantities(catalog),
    activeVariant: seedActiveVariant(catalog),
    openStep: "cameras",
  };

  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const saved = JSON.parse(raw) as Partial<BundleState>;
    return {
      quantities: { ...fallback.quantities, ...saved.quantities },
      activeVariant: { ...fallback.activeVariant, ...saved.activeVariant },
      openStep: saved.openStep ?? fallback.openStep,
    };
  } catch {
    return fallback;
  }
}
```

- `fallback` is built from `catalog.json`'s own `initialQuantity` fields via
  `seedQuantities()`/`seedActiveVariant()` (see
  [`lib/README.md`](../lib/README.md)) — this is what a brand-new visitor
  with no saved data sees.
- `typeof window === "undefined"` — a defensive guard for **server-side
  rendering or static analysis environments** where `window` doesn't exist.
  In this Vite/CSR app it will basically never be true at runtime, but it's
  cheap insurance and a common React pattern.
- `try { ... } catch { return fallback; }` — `localStorage` can throw (some
  browsers block it in private mode, corrupted JSON, storage quota, etc.).
  Any failure at all silently falls back to the seeded defaults rather than
  crashing the whole app on load.
- The **merge pattern** — `{ ...fallback.quantities, ...saved.quantities }`
  — is deliberate and important: it means if a *new* product gets added to
  `catalog.json` after a shopper already has old saved data, the new
  product's seeded quantity still shows up (it comes from `fallback`),
  while everything the shopper actually customized is preserved (it comes
  from `saved`, spread second so it wins on key collisions).
- `saved.openStep ?? fallback.openStep` — the nullish-coalescing operator
  here specifically preserves an explicit `null` from a previous session
  (accordion fully collapsed) as `null`, only falling back to `"cameras"`
  if the key was truly missing/`undefined`.

---

## The hook itself

```ts
export function useBundleStore() {
  const [state, setState] = useState<BundleState>(loadInitialState);
```

- `useState<BundleState>(loadInitialState)` — passing the **function
  itself**, not calling it (`loadInitialState()`), is intentional and is a
  documented React optimization: React only invokes an initializer function
  once, on the very first render, instead of re-running the
  localStorage-read/JSON.parse work on every re-render the way
  `useState(loadInitialState())` would.

```ts
  const [savedAt, setSavedAt] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw).savedAt ?? null : null;
  });
```

- A second, independent piece of state just for the "last saved" timestamp,
  used by `ReviewPanel.tsx` to render `"Save my system for later (saved
  7/12/2026)"`. It's read from the same storage blob but kept separate from
  `state` because it changes on a completely different trigger (an explicit
  save click) than the rest of the state (which changes on every quantity
  tweak).

### `setQuantity` — the single function that changes any quantity, anywhere

```ts
  const setQuantity = useCallback(
    (productId: string, variantId: string | undefined, nextQuantity: number) => {
      setState((prev) => {
        const category = catalog.categories.find((c) =>
          c.products.some((p) => p.id === productId),
        );
        const product = category?.products.find((p) => p.id === productId);
        if (product?.locked) return prev;
```

- `useCallback` memoizes this function so it keeps the same identity across
  re-renders — important because it's handed down as a prop to dozens of
  card/stepper instances, and a stable function reference avoids
  unnecessary re-renders in any child that might otherwise treat a
  brand-new function as "changed props."
- Every call re-derives which `category`/`product` the id belongs to by
  searching `catalog.categories`. This keeps `setQuantity`'s signature
  simple (`productId, variantId, next` — no need to also pass the category)
  at the cost of a small linear search, which is completely fine at this
  catalog's size.
- `if (product?.locked) return prev;` — this is the **entire
  implementation** of "you can't remove the required Sense Hub." If the
  product is flagged `locked: true` in `catalog.json`, any attempt to
  change its quantity is a no-op that returns the previous state
  unchanged. Note this is a *belt-and-suspenders* safeguard — the UI
  already disables the minus button for locked items via `QuantityStepper`
  — but this is what makes it actually unbreakable, not just
  visually-disabled.

```ts
        const clamped = Math.max(0, nextQuantity);
        const key = lineKey(productId, variantId);
        const quantities = { ...prev.quantities, [key]: clamped };
```

- `Math.max(0, nextQuantity)` — quantities can never go negative, no matter
  what caller passes in (protects against a stray "decrease past zero"
  click).
- `lineKey(productId, variantId)` — builds the exact same flat key format
  described above.
- `{ ...prev.quantities, [key]: clamped }` — a **new** object is created
  (spread + computed property), never a mutation of `prev.quantities`
  directly. This is required for React to detect the state actually
  changed and re-render.

```ts
        if (category?.singleSelect && clamped > 0) {
          for (const sibling of category.products) {
            if (sibling.id !== productId) {
              quantities[lineKey(sibling.id)] = 0;
            }
          }
        }

        return { ...prev, quantities };
      });
    },
    [],
  );
```

- This is the **entire implementation of the plan step's radio-button
  behavior**. There is no separate "selected plan" piece of state — it's
  the same `quantities` map every other product uses. The only special
  rule is: if the category this product belongs to is flagged
  `singleSelect: true` (only the `"plan"` category is, per
  `catalog.json`) and the new quantity is greater than zero, every *other*
  product in that same category gets force-set to `0`. That's what makes
  picking "Cam Basic" automatically un-pick "Cam Unlimited," using nothing
  more than the mechanism that already exists for cameras and sensors.
- `useCallback(..., [])` — empty dependency array, meaning this function is
  created exactly once and never recreated. This is safe here because the
  function only ever reads `catalog` (a module-level constant, never
  changes) and uses the **updater-function form** of `setState`
  (`setState((prev) => ...)`), so it never needs a fresh closure over
  `state` itself.

### `setActiveVariant` — which color chip is "selected" per product

```ts
  const setActiveVariant = useCallback((productId: string, variantId: string) => {
    setState((prev) => ({
      ...prev,
      activeVariant: { ...prev.activeVariant, [productId]: variantId },
    }));
  }, []);
```

Straightforward: `activeVariant` is a separate map, keyed only by
`productId` (not by variant), because only one color chip can be "active"
per product at a time. This is purely a **display/binding** concern — it
decides which quantity the stepper on the card is currently pointed at — it
has no effect on the actual saved quantities for the other colors.

### `setOpenStep` — the accordion toggle

```ts
  const setOpenStep = useCallback((stepId: CategoryId) => {
    setState((prev) => ({
      ...prev,
      openStep: prev.openStep === stepId ? null : stepId,
    }));
  }, []);
```

- The ternary is the whole accordion logic: clicking the header of the
  currently-open step **closes** it (`openStep` becomes `null`); clicking
  any other step's header **opens that one instead** (which, because only
  one `openStep` value can exist at a time, implicitly closes whatever was
  open before).

### `goToNextStep` — the "Next: Choose your plan" button

```ts
  const goToNextStep = useCallback((fromStepId: CategoryId) => {
    setState((prev) => {
      const index = catalog.categories.findIndex((c) => c.id === fromStepId);
      const next = catalog.categories[index + 1];
      return { ...prev, openStep: next ? next.id : null };
    });
  }, []);
```

Looks up the current step's position in the catalog array and opens
whatever comes immediately after it. `next ? next.id : null` guards against
calling this on the last step (though in practice `BuilderStep` never
renders the "Next" button on the last step at all, via its `isLast` prop).

### `saveForLater` / `clearSaved` — explicit persistence

```ts
  const saveForLater = useCallback(() => {
    const payload = { ...state, savedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setSavedAt(payload.savedAt);
  }, [state]);

  const clearSaved = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setSavedAt(null);
  }, []);
```

- `saveForLater` is the only place the app writes to `localStorage`
  intentionally (as opposed to the automatic `sessionStorage` mirror
  below). It snapshots the *entire current state* plus a fresh timestamp,
  and this is what powers "Save my system for later (saved …)" in the
  review panel.
- Notice `useCallback(..., [state])` here — unlike the setters above, this
  one **does** depend on `state`, because it needs to read the current
  value directly (not through an updater function) to build the
  `localStorage` payload. Its identity intentionally changes whenever
  state changes, which is fine since it's only wired to a single button
  click, not passed into a hot render path.
- `clearSaved` exists as a utility (exported, currently unused by any
  component in the UI) for wiping saved state — useful for a future "reset
  my bundle" affordance or for QA/testing.

### The `sessionStorage` safety-net effect

```ts
  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const savedAtValue = raw ? JSON.parse(raw).savedAt : undefined;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, savedAtValue }));
  }, [state]);
```

- Runs after **every** state change (`quantities`, `activeVariant`,
  `openStep` — anything). Its job is purely defensive: if a shopper
  accidentally hits refresh mid-configuration *before* explicitly clicking
  "Save my system for later," their in-progress session is still mirrored
  to `sessionStorage` (which — unlike `localStorage` — is cleared when the
  tab closes, so it never overwrites an explicit save with an
  accidentally-abandoned draft).

### `selectedCounts` — the "N selected" badge on every step header

```ts
  const selectedCounts = useMemo(() => {
    const counts: Record<CategoryId, number> = {
      cameras: 0, plan: 0, sensors: 0, accessories: 0,
    };
    for (const category of catalog.categories) {
      let distinctSelected = 0;
      for (const product of category.products) {
        const keys = product.variants?.length
          ? product.variants.map((v) => lineKey(product.id, v.id))
          : [lineKey(product.id)];
        const total = keys.reduce((sum, k) => sum + (state.quantities[k] ?? 0), 0);
        if (total > 0) distinctSelected += 1;
      }
      counts[category.id] = distinctSelected;
    }
    return counts;
  }, [state.quantities]);
```

- Deliberately counts **distinct products with any positive quantity**, not
  the raw sum of quantities. That's why, for a product with variants, it
  first builds every possible key for that product's variants (`keys`),
  sums all of them together (`total`), and only then checks `total > 0`
  once per product — so a camera that has 2 white units and 0 grey/black
  still counts as **one** selected product, matching what the "N selected"
  badge in `StepHeader.tsx` is meant to communicate (how many *items*
  you've picked, not how many *units*).
- `useMemo(..., [state.quantities])` — this recomputation genuinely is
  work worth memoizing: it's an `O(products × variants)` scan that would
  otherwise re-run on every render of `App`, including renders triggered
  by something unrelated like `activeVariant` or `openStep` changing.

### The return value

```ts
  return {
    catalog,
    state,
    selectedCounts,
    savedAt,
    setQuantity,
    setActiveVariant,
    setOpenStep,
    goToNextStep,
    saveForLater,
    clearSaved,
  };
}
```

Everything `App.tsx` destructures and hands down the tree. Notice `catalog`
itself is returned too, even though it's a module-level constant that
never changes — this keeps `App.tsx` from needing a second import, and
keeps "where does the data come from" answerable by looking at one hook
call instead of two separate imports.
