# `src/components/icons/` — The Inline SVG Icon Set

One file: **`Icons.tsx`**. Every icon used anywhere in the app — the
accordion chevrons, the +/- stepper glyphs, the four step icons, the "Cam
Unlimited" badge, and the shipping truck — is exported from here as a small
React component, not loaded as a separate image file.

---

## Why inline SVG components instead of `.svg` files or an icon library

- **No extra HTTP requests.** Every icon compiles straight into the JS
  bundle alongside the component that uses it, instead of triggering a
  separate network request per icon the way `<img src="icon.svg">` would.
- **`currentColor` and `fill`/`stroke` overrides work naturally.**
  `PlusIcon`/`MinusIcon` use `stroke="currentColor"`, which means their
  color is inherited from the parent element's `text-*` Tailwind class at
  the call site (see `QuantityStepper.tsx`, where the same icon appears in
  a disabled gray state and an enabled dark state without the icon file
  itself changing) — a plain `<img>` tag can't do that.
- **No icon-library dependency.** Every shape here was hand-exported
  directly from the Figma design file (see the `/** Exact export from
  Figma: ... */` comment above each one) rather than substituted with the
  closest match from a generic icon set like Lucide or Heroicons — so what
  you see in the app is pixel-exact to the design, not an approximation.
- **Trivial to theme.** Because these are plain function components, any
  future dark-mode or rebrand work that needs a color swap can do it by
  editing the hard-coded `fill`/`stroke` hex value once, here, rather than
  re-exporting a new asset file from Figma.

---

## The shared component shape

Every export in this file follows the exact same tiny pattern:

```tsx
export const SomeIcon = ({ className = "" }: { className?: string }) => (
  <svg width="..." height="..." viewBox="..." className={className} fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    {/* path data */}
  </svg>
);
```

- **`className` is the only prop**, always optional and defaulting to an
  empty string. Every caller sizes and colors the icon purely through
  Tailwind utility classes passed in at the call site (e.g. `<ChevronUp
  className="w-3 h-3 text-corewyze-purple" />` in `StepHeader.tsx`) rather
  than through any icon-specific size/color prop — this keeps the icon
  components themselves completely free of layout decisions, which belong
  to whoever is placing the icon.
- **`aria-hidden="true"` on every single icon, with no exceptions.** None
  of these icons are ever the *only* content conveying information — every
  call site pairs an icon with adjacent visible text (a step title, a
  button label) or wraps it in a parent that already has its own
  `aria-label` (like the `aria-hidden="true"` wrapper `<span>` around step
  icons in `StepHeader.tsx`). This is a deliberate, consistent choice: if
  you ever add an icon that has to stand alone with no adjacent label, it
  needs its own real `aria-label` and should **not** follow this file's
  default pattern verbatim.
- **`fill="none"` at the root, with color set per-`<path>`.** This is
  standard practice for multi-color icons: rather than one blanket fill on
  the `<svg>` tag, each internal `<path>`/`<rect>`/`<circle>` carries its
  own `fill` or `stroke`, so a two-tone icon like `PlanStepIcon` (light
  gray shield fill + dark gray outline stroke) renders correctly no matter
  what color context it's placed in.

---

## The icons, grouped by where they're used

### Accordion chevrons — `ChevronDown` / `ChevronUp`

Used exclusively in `StepHeader.tsx` to show whether a step is collapsed or
expanded.

```tsx
export const ChevronUp = ({ className = "" }: { className?: string }) => (
  <svg ... style={{ transform: "rotate(180deg)" }}>
    <path d="M6.40682 9.43039..." fill="#4E2FD2" />
  </svg>
);
```

- `ChevronUp` is **not** a separately-drawn shape — it's the exact same
  `<path>` data as `ChevronDown`, rotated 180° via an inline `style`. This
  is a deliberate simplification: rather than exporting two mirror-image
  paths from Figma, one shape does double duty, guaranteeing the "up" and
  "down" states are visually perfect mirrors of each other by construction
  rather than by careful separate authoring.
- Both are hard-coded to Corewyze purple (`fill="#4E2FD2"`, matching the
  `--corewyze-purple` CSS variable in `index.css`) rather than
  `currentColor` — unlike the plus/minus icons below, these are never used
  in more than one color context, so there was no need for the extra
  flexibility.

### Stepper glyphs — `PlusIcon` / `MinusIcon`

Used in `QuantityStepper.tsx`'s two buttons, and nowhere else.

```tsx
export const PlusIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 10 10" ... fill="none" ...>
    <path d="M5 0V10M0 5H10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
```

- `MinusIcon` is literally `PlusIcon` with the vertical stroke
  (`M5 0V10`) removed — a plus sign is a minus sign plus one more line,
  and the file mirrors that visually by keeping the horizontal-stroke path
  data identical between the two (`M0 5H10` in both).
- `stroke="currentColor"` (not a hex value) is what lets the exact same
  glyph render gray-and-disabled or dark-and-active depending purely on
  which Tailwind text-color class the parent `<button>` in
  `QuantityStepper.tsx` currently has — see that component's `dim`/
  disabled-state classes for where the actual color comes from.
- No `width`/`height` attributes on the `<svg>` itself (unlike every other
  icon in this file) — sizing is left entirely to the `className` (`w-2
  h-2` at the call site) plus the `viewBox`, since this icon is always
  rendered small and inline inside a fixed-size button.

### Step icons — `CameraStepIcon` / `PlanStepIcon` / `SensorStepIcon` / `ExtraProtectionStepIcon`

Used exclusively via the `STEP_ICONS` lookup table in `BuilderStep.tsx`,
one per accordion step header.

- All four share `stroke="#6F7882"` (a muted slate gray, matching neither
  pure black nor the brand purple) — this is intentional: these icons sit
  next to bold heading text and a "N selected" purple counter, so keeping
  them a quieter neutral tone stops them from competing visually with
  either.
- `PlanStepIcon` is the one **two-tone exception** in this group: a light
  gray shield `fill="#F0F0F0"` sits underneath a `stroke="#6F7882"` outline
  path — two separate `<path>` elements stacked, rather than one filled
  shape, giving the shield a soft "badge" look the other three (pure
  line-art) icons don't have.
- `ExtraProtectionStepIcon` is built from **nine near-identical
  rounded-square `<path>` blocks** arranged in a 3×3 grid (plus a small
  chevron at the top) — each one has its own coordinates rather than being
  generated/repeated programmatically, because this is a literal Figma
  export, not hand-authored SVG; don't be surprised that it's the longest
  block of markup in the file for what is visually a simple dot-grid icon.
- Both `CameraStepIcon` and `ExtraProtectionStepIcon` wrap their paths in a
  `<g clipPath="url(#...-clip)">` with a matching `<defs><clipPath
  id="...">` block. **Every `clipPath` id in this file is manually
  prefixed to be unique** (`camera-step-icon-clip`,
  `cam-unlimited-badge-clip`) — SVG `id` attributes are global to the
  whole rendered page, so if two icons both used a generic id like `clip0`
  and were ever rendered on screen simultaneously (which happens here,
  since all four step icons render at once), the browser would apply
  whichever `<clipPath>` it saw *first* in the DOM to *both* icons,
  silently corrupting one of them. This is the reason every clip-path id
  in this file is icon-specific rather than shared.

### `CamUnlimitedBadge` — the flagship plan's shield mark

Used in two places: `PlanOption.tsx` (replacing the plain radio dot for the
`cam-unlimited` product specifically) and `ReviewPanel.tsx` (next to the
plan's name in the PLAN section of the summary), at two different sizes.

- The most visually complex icon in the file: a two-layer shield (light
  blue fill + navy outline stroke) plus several small hand-drawn `<path>`
  letterforms spelling out a stylized wordmark inside it. Like the step
  icons, this is a literal Figma export rather than a font-rendered label,
  which is why the "text" inside the badge is a series of `<path>` shapes
  instead of an SVG `<text>` element.
- Rendered at **three different explicit sizes** across its two call sites
  (`w-5 h-6` in `PlanOption.tsx`; `w-[14px] h-[17px] xs:w-5 xs:h-6
  dxl:w-[26px] dxl:h-[31px]` in `ReviewPanel.tsx`) — because the `viewBox`
  is fixed (`0 0 20 24`) and everything inside it is vector paths, it
  scales cleanly to any of these sizes with no quality loss, which is the
  main practical advantage of keeping this as inline SVG rather than a
  raster image.

### `ShippingIcon` — the Fast Shipping line in the review panel

Used exclusively in `ReviewPanel.tsx`'s shipping row, paired with the
`catalog.shipping` object from `catalog.json`.

- The only icon in the file colored `fill="#0AA288"` (the same teal used
  for the "Congrats, you're saving $X" success message text in
  `ReviewPanel.tsx`) — reinforcing, purely through color, that free
  shipping is itself a small win alongside the bundle's overall savings.
- Built from exactly two `<path>` elements (a small "stacked lines" glyph
  plus the truck body/wheels shape) rather than the many small shapes used
  in the step icons — simpler geometry, so it needed less decomposition
  when exported from Figma.

---

## Adding a new icon

1. Export the shape from Figma as SVG and open the raw markup.
2. Wrap it in the same functional-component shape shown above: accept an
   optional `className` prop, default it to `""`, spread it onto the root
   `<svg>`, and add `aria-hidden="true"` (unless this icon will genuinely
   be the *only* content conveying its meaning somewhere — in that rare
   case, give the call site a real `aria-label` instead of relying on
   adjacent text).
3. If the icon needs to inherit its color from context (like the +/-
   glyphs), use `stroke="currentColor"`/`fill="currentColor"` instead of a
   hard-coded hex value, and size/color it entirely via `className` at the
   call site rather than adding new props to the icon component itself.
4. If the icon uses a `clipPath`/`mask`/gradient `<defs>`, give its `id` a
   name prefixed with the icon's own name (following the
   `<icon-name>-clip` convention already used here) so it can never
   collide with another icon's `id` when both are rendered on the page at
   the same time.