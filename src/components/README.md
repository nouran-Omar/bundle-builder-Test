# `src/components/` — UI Components

Every file here is a **"dumb" renderer**: it receives data and callback
functions as props and renders markup — nothing in this folder calls
`useState`, touches `localStorage`, or does any pricing math. State lives
exclusively in [`../hooks/useBundleStore.ts`](../hooks/README.md); math
lives exclusively in [`../lib/pricing.ts`](../lib/README.md). If you're
reading a component and asking "where does this number come from" or "what
actually changes when I click this," the answer is always one level up the
prop chain, ultimately back in the hook.

Sub-folder: [`icons/`](./icons/README.md) — every inline SVG icon used
below.

---

## Component tree, top to bottom

```
App.tsx
 ├── BuilderStep.tsx        (×4, one per catalog category)
 │    ├── StepHeader.tsx
 │    ├── PlanOption.tsx     (only for the singleSelect "plan" category)
 │    └── ProductCard.tsx    (every other category)
 │         └── VariantSelector.tsx
 │         └── QuantityStepper.tsx
 └── ReviewPanel.tsx
      └── QuantityStepper.tsx   (same component, reused verbatim)
```

The single most important thing to notice in that tree: **`QuantityStepper`
appears twice**, once inside a builder card and once inside the review
panel, and it's the *same component instance type* both times, wired to the
*same* `setQuantity` function from the hook either way. That's what
guarantees a shopper can change a quantity from either side of the screen
and never see the two panels disagree.

---

## `BuilderStep.tsx` — one accordion panel

```tsx
const STEP_ICONS = {
  cameras: CameraStepIcon,
  plan: PlanStepIcon,
  sensors: SensorStepIcon,
  accessories: ExtraProtectionStepIcon,
};
```

- A lookup table from `CategoryId` to the icon component for that step's
  header. This is the **one place** a category id is mapped to something
  visual by hand — add a 5th category and you must add a 5th entry here (and
  to `NEXT_LABELS` below), or `Icon` will be `undefined` for that step.

```tsx
export function BuilderStep({ category, totalSteps, isOpen, isLast, selectedCount,
  quantities, activeVariant, onToggle, onQuantityChange, onVariantChange, onNext }: BuilderStepProps) {
  const headingId = useId();
  const panelId = `${headingId}-panel`;
  const Icon = STEP_ICONS[category.id];
```

- `useId()` generates a stable, unique id per rendered instance (four
  separate ids across the four steps) used to wire up
  `aria-controls`/`aria-labelledby`/`id` between the header button and its
  panel — the accessible, standards-compliant version of a disclosure
  widget, without any third-party accordion library.
- `Icon` is capitalized because it's about to be used as a JSX tag
  (`<Icon .../>`) — JavaScript/JSX requires component variables to start
  with a capital letter to be treated as a component rather than an HTML
  tag.

```tsx
      <div
        className="grid transition-[grid-template-rows] duration-500 ease-in-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div
          id={panelId}
          role="region"
          aria-labelledby={headingId}
          aria-hidden={!isOpen}
          {...(!isOpen ? { inert: "" as unknown as boolean } : {})}
          className={`overflow-hidden min-h-0 transition-opacity duration-500 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        >
```

- This is the **animated collapse/expand mechanism**, and it's a
  CSS-only trick, not a JS height measurement: animating a `grid-template-
  rows` from `"0fr"` to `"1fr"` on a wrapping `grid` element lets the inner
  `overflow-hidden` content smoothly grow/shrink to its natural height,
  which plain `max-height` transitions can't do reliably for
  dynamically-sized content (like a product grid whose height changes as
  the viewport resizes).
- `aria-hidden={!isOpen}` plus the spread-in `inert` attribute together
  mean a **closed panel is fully invisible to assistive tech and
  unfocusable/unclickable by keyboard**, even though its DOM nodes still
  technically exist (mid-collapse-animation) — without `inert`, a sighted
  mouse user tabbing through the page could still land keyboard focus
  inside a visually-collapsed panel.
- `{...(!isOpen ? { inert: "" as unknown as boolean } : {})}` — a
  conditional spread that only adds the `inert` attribute at all when
  closed; the `as unknown as boolean` cast exists because React's TS types
  for the native `inert` attribute lag behind the DOM spec, so this is a
  narrow, deliberate escape hatch rather than a sign of an actual type
  error.

```tsx
            {category.singleSelect ? (
              <div role="radiogroup" aria-label={category.title} className="flex flex-wrap gap-[15px]">
                {category.products.map((product) => {
                  const quantity = quantities[lineKey(product.id)] ?? 0;
                  return (
                    <PlanOption
                      key={product.id}
                      product={product}
                      isSelected={quantity > 0}
                      onSelect={() => onQuantityChange(product.id, undefined, 1)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[15px] ...">
                 {category.products.map((product) => { /* ProductCard branch */ })}
              </div>
            )}
```

- The **entire fork** between "radio-button plan step" and "normal product
  grid" is this one ternary on `category.singleSelect`. Nothing else in
  `BuilderStep` special-cases the plan category by id (`=== "plan"`) — it's
  driven purely by that one boolean flag from `catalog.json`, which is what
  keeps this component reusable for any future single-select step.
- Inside the plan branch: `onSelect={() => onQuantityChange(product.id,
  undefined, 1)}` — clicking a plan option always sets its quantity to
  exactly `1` (never increments), since a plan is either chosen or not.
  The actual "un-pick the other plan" behavior isn't here at all — it lives
  in `useBundleStore.ts`'s `setQuantity`, triggered by the same
  `category.singleSelect` flag on the hook side.

```tsx
                 {category.products.map((product) => {
                  const hasVariants = !!product.variants?.length;
                  const activeId = hasVariants ? activeVariant[product.id] : undefined;
                  const quantity = hasVariants
                    ? quantities[lineKey(product.id, activeId)] ?? 0
                    : quantities[lineKey(product.id)] ?? 0;
                  const isSelected = hasVariants
                    ? (product.variants ?? []).some(
                        (v) => (quantities[lineKey(product.id, v.id)] ?? 0) > 0,
                      )
                    : quantity > 0;
```

- `quantity` (what the stepper on the card shows) is **the count for
  whichever variant is currently active** — switching the color chip
  changes which number the +/- buttons operate on, without touching the
  other colors' saved quantities.
- `isSelected` (what draws the purple selection border around the whole
  card) is intentionally computed **differently**: it checks whether *any*
  variant of this product has a positive quantity, not just the active
  one. This is why a Wyze Cam v4 with 2 units in Black still shows as
  "selected" even while the White chip happens to be the one currently
  displayed — the border reflects "is this product in your cart at all,"
  not "is the currently-viewed color in your cart."

```tsx
            {!isLast ? (
              <div className="flex justify-center self-stretch">
                <button type="button" onClick={onNext} ...>
                  Next: {NEXT_LABELS[category.id]}
                </button>
              </div>
            ) : null}
```

- `NEXT_LABELS` is a second by-hand lookup table (cameras → "Choose your
  plan", plan → "Choose your sensors", sensors → "Add extra protection"),
  deliberately **not** derived from the next category's own `title` field.
  This means the button copy can differ slightly from the next step's
  actual heading if that reads better (worth keeping in sync by hand when
  editing either).
- `!isLast` — the accessories step (the last one) never renders this
  button at all, since `onNext` would have nowhere useful to send the
  accordion (`goToNextStep` in the hook already guards this too, but the
  button is simply absent here rather than disabled).

---

## `StepHeader.tsx` — the "STEP X OF 4" clickable disclosure trigger

```tsx
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        id={`${headingId}-trigger`}
        onClick={onToggle}
        className={`... border-t-[0.5px] border-[#1f1f1f] ... ${isOpen ? "" : "border-b-[0.5px]"}`}
      >
```

- The entire header — icon, title, "N selected" count, chevron — is one
  native `<button>`, not a `<div onClick>`. This is deliberate for
  accessibility: a real button is keyboard-focusable and activatable with
  Enter/Space out of the box, and `aria-expanded`/`aria-controls` together
  give screen readers the standard "disclosure widget" semantics without
  any extra ARIA role needed on the button itself.
- The conditional `border-b-[0.5px]` — only drawn when **closed** — is a
  small but deliberate visual detail: an open step's panel content
  visually continues the same card, so the bottom border would look like
  an unwanted seam; a closed step needs it to look like a complete,
  separate row.
- `{selectedCount} selected` and the chevron direction are the only two
  bits of the header that respond to component state at all — everything
  else (title, icon, step number) is static per-category content passed
  straight through from `catalog.json`.

---

## `ProductCard.tsx` — camera / sensor / accessory card

```tsx
      <div className={`relative shrink-0 rounded-[5px] overflow-hidden bg-gray-c200 flex items-center justify-center ${
          compact ? "w-[72px] h-[72px]" : "w-[90px] h-[122px] sm:w-[101px] sm:h-[137px] dxl:w-full dxl:h-[117px]"
        }`}
      >
```

- `compact` — a prop that exists on the component's interface but is
  **never actually passed `true` anywhere in the current app** (every call
  site uses the default `false`). It's there so a future denser layout
  (e.g. a "recently viewed" strip or a smaller card variant) can reuse
  `ProductCard` at a smaller fixed size without forking the component.
- The image container uses a **fixed aspect box with `object-cover`** on
  mobile/tablet (`w-[90px] h-[122px]` etc.) but switches to `dxl:w-full
  dxl:h-[117px]` with `object-contain` at the largest breakpoint — mirroring
  the same `dxl` layout switch documented in
  [`../README.md`](../README.md#apptsx--the-page-layout), where the review
  panel becomes its own sidebar instead of a narrow column.

```tsx
  {product.image ? (
  <img src={product.image} alt="" className="..." loading="lazy" />
) : (
          <span className="text-[10px] text-gray-c500 font-body px-2 text-center">
            {product.name}
          </span>
        )}
```

- `alt=""` (empty, not missing) — deliberate: the image is purely
  decorative here because the product name is *also* rendered as visible
  text right below it (`<h3>{product.name}</h3>`), so a screen reader
  announcing the image again would be redundant. The `aria-hidden="true"`
  on the parent `<div>` reinforces this.
- The **text-label fallback** (`{product.name}` in a small gray span) is
  what every product currently shows until real photography is dropped
  into `public/images/` — see that folder's README for the exact
  file-naming contract that makes a fallback disappear automatically once
  a matching image file exists, with zero code changes.
- `loading="lazy"` — defers offscreen product images until they're about
  to scroll into view, which matters here since a shopper may have four
  collapsed accordion steps' worth of images in the DOM at once (only the
  open step's images are visible, but all of them exist in the tree).

```tsx
          {product.variants && product.variants.length > 0 && activeVariantId ? (
            <VariantSelector ... />
          ) : null}
```

- The three-part guard (`variants exists AND has length AND
  activeVariantId is set`) is what prevents `VariantSelector` from ever
  rendering with an `undefined` `activeVariantId` — `BuilderStep` only
  passes a real `activeVariantId` for products that have variants in the
  first place, but this local check makes `ProductCard` safe to reuse even
  if a future caller forgets that invariant.

```tsx
          <QuantityStepper label={product.name} quantity={quantity} onIncrease={onIncrease} onDecrease={onDecrease} />
          <div className="flex flex-col dxl:flex-row items-end dxl:items-center justify-center dxl:justify-end gap-[3px] flex-1">
            {product.originalPrice ? (
              <div className="... line-through ...">{formatUsd(product.originalPrice)}</div>
            ) : null}
            <div className="...">{product.priceLabel ?? formatUsd(product.price)}</div>
          </div>
```

- Price display order is deliberately: strikethrough original (if any) →
  current price, top-to-bottom on mobile, side-by-side at the `dxl`
  breakpoint — matching the same left-to-right "compare-at then actual"
  convention repeated in `PlanOption.tsx` and `ReviewPanel.tsx`, so the
  reading order for "is this a deal" is consistent everywhere a price
  appears.
- `product.priceLabel ?? formatUsd(product.price)` — the `??` (not `||`)
  matters because `priceLabel` is a string when present; using `??` means
  an *empty string* `priceLabel` (unlikely, but technically valid) would
  still be treated as "present" and shown as-is rather than falling
  through, whereas `||` would incorrectly fall back to the formatted price
  for a falsy-but-intentional empty string.

---

## `PlanOption.tsx` — radio-style plan card

```tsx
    <button type="button" role="radio" aria-checked={isSelected} onClick={onSelect} ...>
```

- A native `<button>` wearing `role="radio"` — this is the standard ARIA
  pattern for a custom-styled radio button that isn't a real `<input
  type="radio">` element. Its parent, in `BuilderStep.tsx`, wraps every
  `PlanOption` in a `role="radiogroup"` container, completing the pattern.
- Note there's **no native keyboard arrow-key navigation** between the two
  plan options (real radio-input groups get that for free from the
  browser; a hand-rolled `role="radio"` button group does not). With only
  two mutually-exclusive plans and each one independently Tab-focusable
  and Enter/Space-activatable, this is an accepted simplification — a
  larger radio group would likely warrant wiring up arrow-key handling to
  fully match native behavior.

```tsx
      {product.id === "cam-unlimited" ? (
        <CamUnlimitedBadge className="w-5 h-6 shrink-0" />
      ) : (
        <span aria-hidden="true" className={`... rounded-full border-2 ...`}>
          {isSelected ? <span className="w-2 h-2 rounded-full bg-corewyze-purple" /> : null}
        </span>
      )}
```

- The **only** hard-coded product-id check (`product.id === "cam-
  unlimited"`) anywhere in the component tree. Every other product-specific
  behavior in the app is driven by generic fields (`locked`, `singleSelect`,
  `variants`) — this one exception exists purely for the branded shield
  badge that replaces the plain radio dot specifically for the flagship
  plan. If a second "badged" plan were ever added, this would be worth
  promoting to a generic `Product.badgeIcon` field instead of a second
  `=== "..."` check.

---

## `VariantSelector.tsx` — the color chip row

```tsx
    <div role="radiogroup" aria-label="Color" className="flex items-end gap-1.5 flex-wrap">
      {variants.map((variant) => {
        const isActive = variant.id === activeVariantId;
        return (
          <button key={`${productId}-${variant.id}`} type="button" role="radio" aria-checked={isActive} ...>
```

- Same `role="radiogroup"`/`role="radio"` pattern as `PlanOption`, scoped
  per-product (`aria-label="Color"` — generic on purpose, since the
  surrounding `<h3>{product.name}</h3>` already gives assistive tech the
  product context; a screen reader announces something like "White, Color,
  radio button, checked" in context).
- `key={`${productId}-${variant.id}`}` — prefixed with `productId` even
  though `.map()` is already scoped to one product's `variants` array
  (where `variant.id` alone would be locally unique). This is defensive:
  if `VariantSelector` were ever rendered for two different products on
  the same page at once (which doesn't currently happen, but nothing
  prevents a future layout from doing so), the composite key guarantees no
  cross-product key collisions.

```tsx
            <span
              aria-hidden="true"
              className="block w-3.5 h-3.5 rounded-full border border-black/10"
              style={{
                backgroundColor: variant.swatchColor ?? "#e5e5e5",
                backgroundImage: variant.image ? `url(${variant.image})` : undefined,
                backgroundSize: "cover",
              }}
            />
```

- The little color circle prefers a **real photo thumbnail**
  (`backgroundImage`) over a flat `swatchColor`, but sets both — if
  `variant.image` resolves to a real file, the background-image paints
  over the swatch color entirely (browsers render `background-image` on
  top of `background-color` when both are set); if the image path 404s,
  the flat `swatchColor` still shows through as a sane fallback, and if
  neither is provided at all, it falls back to a neutral `#e5e5e5` gray
  circle. Three layers of graceful degradation for one small dot.

---

## `QuantityStepper.tsx` — the shared +/- counter

```tsx
  const decreaseDisabled = locked || quantity <= minQuantity;
  const increaseDisabled = locked;
```

- This is the **only** component reused verbatim between the builder cards
  and the review panel (`ProductCard` and `ReviewPanel` both render it),
  which is exactly why the "you can never go below `minQuantity`" and "a
  locked product can't be changed at all" rules live here once instead of
  being reimplemented per call site.
- `minQuantity` defaults to `0` (a shopper can always fully remove a normal
  product), but `ReviewPanel.tsx` explicitly passes `minQuantity={1}` for
  locked products — combined with `locked` disabling the minus button
  outright, this means a locked product's floor of `1` is enforced twice,
  redundantly, which is intentional belt-and-suspenders (see the note on
  `product.locked` in [`../hooks/README.md`](../hooks/README.md)).

```tsx
      <output aria-label={`${label} quantity`} className="...">{quantity}</output>
```

- `<output>` rather than a plain `<span>` or `<div>` — it's the semantically
  correct native HTML element for "the result of a calculation/user
  action," which is exactly what this number is. Screen readers can
  associate it with the label via `aria-label`, distinguishing it clearly
  from the two neighboring `<button>` elements.

```tsx
  size = "md",
}: QuantityStepperProps) {
  ...
  const dim = size === "sm" ? "w-5 h-5" : "w-5 h-5";
```

- Worth flagging as-is: `dim` currently evaluates to the **same class
  string either way** (`"w-5 h-5"` for both `"sm"` and `"md"`) — the visual
  difference between the two call sites (builder card vs. review panel) is
  actually driven entirely by the *outer wrapper's* width
  (`size === "sm" ? "w-[72px] px-0 py-1" : "w-20 py-1"`), not by the
  buttons themselves. If a future design pass wants the +/- buttons
  themselves to shrink in the review panel too, this is the line to change.

---

## `ReviewPanel.tsx` — the live order summary

This is the largest component in the folder, but structurally it's just
three things stacked together: a **grouped line-item list**, a **totals
block**, and a **save-for-later button**. It receives the exact same
`catalog`/`quantities`/`onQuantityChange` the builder side uses, and
computes its own view of them via `lib/pricing.ts` — it never receives
pre-computed totals as props.

```tsx
  const grouped = useMemo(() => selectedLineItems(catalog, quantities), [catalog, quantities]);
  const totals = useMemo(() => computeTotals(catalog, quantities), [catalog, quantities]);
  const [justSaved, setJustSaved] = useState(false);
```

- The **only** local component state in the whole `components/` folder is
  `justSaved` here — a short-lived UI flourish (swap the save link's text
  to "Saved!" for 2.5 seconds), not application state. Everything that
  needs to persist or be shared with the builder side still comes from
  `useBundleStore` via props.
- `useMemo` on both derived values, keyed on `[catalog, quantities]` —
  `catalog` never actually changes (it's a module-level constant), so in
  practice this only recomputes when `quantities` changes, but including it
  in the dependency array is honest about what the functions actually
  read.

```tsx
  const planItems = grouped.plan ?? [];
  const lineCategories = ["cameras", "sensors", "accessories"] as const;
```

- The plan category is **deliberately rendered by a separate code path**
  (`planItems.map(...)` further down) from the other three
  (`lineCategories.map(...)`), because its display is different: no
  per-item thumbnail/stepper row, just a name and a `/mo` price, styled
  with the `CamUnlimitedBadge` when applicable. `lineCategories` is typed
  `as const` so TypeScript narrows it to the literal tuple type, letting
  `CATEGORY_LABELS[categoryId]` resolve without a wider, less precise
  `string` index type.

```tsx
                        <QuantityStepper
                          size="sm"
                          ...
                          minQuantity={item.product.locked ? 1 : 0}
                          onIncrease={() => onQuantityChange(item.product.id, item.variantId, item.quantity + 1)}
                          onDecrease={() => onQuantityChange(item.product.id, item.variantId, item.quantity - 1)}
                        />
```

- `item.variantId` here is whatever `selectedLineItems()` attached to this
  specific `LineItem` — **not** necessarily the product's currently
  "active" variant on the builder side. This is what lets the review panel
  show and independently adjust a Black Wyze Cam v4 line even while the
  builder card is currently displaying the White chip; each variant a
  shopper has actually selected gets its own row here, driven straight off
  the flat quantities map rather than the `activeVariant` UI-only state.

```tsx
            <img src="/images/satisfaction-badge.png" alt="30-day satisfaction guarantee" ... />
```

- Points at a `.png` that doesn't exist in `public/images/` yet — only a
  `.svg` placeholder (`satisfaction-badge.svg`) currently lives there. This
  is a **known gap**, not a bug in this component: see
  [`public/images/README.md`](../../public/images/README.md) for the
  process of dropping in real exported assets. Until a matching PNG exists,
  the browser simply shows a broken-image icon here.

```tsx
                <div className="... bg-[#4e2fd2] rounded-[3px]">
                  <div className="...">
                    as low as {formatUsd(totals.current / 10 || 0)}/mo
                  </div>
                </div>
```

- `totals.current / 10 || 0` is a **cosmetic financing-style estimate**
  (dividing the one-time total into 10 hypothetical installments), not a
  real payment plan integration — worth knowing if this ever needs to
  connect to an actual financing provider's real math instead of this
  placeholder division.
- The trailing `|| 0` guards specifically against `NaN`/`0`-producing edge
  cases in `formatUsd` (e.g. if `totals.current` were ever `0`, `0 / 10` is
  already `0`, so this is mostly defensive belt-and-suspenders rather than
  something that fires in normal use today).

```tsx
  onClick={() => window.alert("This is a prototype — checkout isn't wired up yet.")}
```

- The Checkout button is intentionally a **dead end** in this prototype —
  a plain `window.alert` instead of a real navigation/API call. This is the
  one place in the entire app where clicking something doesn't route back
  through `useBundleStore`, precisely because there's no backend for it to
  talk to yet (see the "No backend" design decision in the root
  [`README.md`](../../README.md)).