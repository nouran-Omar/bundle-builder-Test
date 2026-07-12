# Corewyze Bundle Builder

A two-column, data-driven product bundle builder for a home security brand.
Shoppers move through a 4-step accordion on the left (**Cameras → Plan →
Sensors → Extra Protection**) while a live order-review panel on the right
mirrors every change instantly — quantities, colors, totals, and savings all
stay in sync without a page refresh.

**Live demo:** https://bundle-builder-test.vercel.app/
**Stack:** React 18 + TypeScript + Vite + Tailwind CSS (no backend — the
catalog is a local, strongly-typed JSON file).

---

## Why this README exists

This isn't just a "how to run it" file. Every folder in `src/` has its own
`README.md` sitting right next to the code, and each one walks through the
files inside it almost line by line — what each piece of state does, why a
component is shaped the way it is, and what would break if you removed it.
The idea is that anyone (including future-you, six months from now) can open
any folder and understand it without having to reverse-engineer the whole
app first.

| Folder | What's documented there |
|---|---|
| [`src/README.md`](./src/README.md) | App shell (`App.tsx`), entry point (`main.tsx`), global styles, and how the whole tree fits together |
| [`src/components/README.md`](./src/components/README.md) | Every UI component: the accordion step, product cards, plan radio cards, variant chips, quantity stepper, review panel |
| [`src/components/icons/README.md`](./src/components/icons/README.md) | The hand-exported SVG icon set and why they're inline React components instead of image files |
| [`src/hooks/README.md`](./src/hooks/README.md) | `useBundleStore` — the single hook that owns all application state |
| [`src/lib/README.md`](./src/lib/README.md) | `pricing.ts` — every pure function that turns raw quantities into money |
| [`src/data/README.md`](./src/data/README.md) | `catalog.json` — the single source of truth for every product |
| [`public/images/README.md`](./public/images/README.md) | Where real product photography goes, and how the naming convention wires itself up automatically |

---

## Quick start

Requires Node 18+.

```bash
npm install
npm run dev       # http://localhost:5173
```

Other scripts:

```bash
npm run build      # tsc -b (type-check) then vite build -> /dist
npm run preview    # serves the production build locally
```

---

## Project structure at a glance

```
.
├── index.html                 # single HTML shell; loads /src/main.tsx as a module
├── vite.config.ts             # Vite + @vitejs/plugin-react, otherwise defaults
├── tailwind.config.js         # design-token color/font/breakpoint mapping
├── postcss.config.js          # tailwindcss + autoprefixer pipeline
├── tsconfig.json              # strict TS config, bundler resolution, no emit
├── public/
│   ├── favicon.svg
│   └── images/                # real product photography lives here (see its README)
└── src/
    ├── main.tsx                # React root, mounts <App /> in StrictMode
    ├── App.tsx                 # page layout: builder column + review sidebar
    ├── index.css               # Tailwind layers + CSS custom properties (design tokens)
    ├── types.ts                 # every shared TypeScript interface/type
    ├── data/
    │   └── catalog.json         # every product, price, variant and seed quantity
    ├── lib/
    │   └── pricing.ts            # pure pricing/grouping/formatting functions
    ├── hooks/
    │   └── useBundleStore.ts     # all React state + localStorage/sessionStorage sync
    └── components/
        ├── BuilderStep.tsx       # one accordion step (header + its grid of products)
        ├── StepHeader.tsx        # "STEP X OF 4" clickable disclosure header
        ├── ProductCard.tsx       # camera / sensor / accessory card
        ├── PlanOption.tsx        # radio-style plan card (single-select step)
        ├── VariantSelector.tsx   # color chip row on a product card
        ├── QuantityStepper.tsx   # shared +/- counter (used in cards AND review panel)
        ├── ReviewPanel.tsx       # "Your security system" live summary + checkout
        └── icons/
            └── Icons.tsx          # every inline SVG icon used across the app
```

---

## How the pieces talk to each other

```
catalog.json
      │  (typed as Catalog)
      ▼
useBundleStore()  ──────────────► holds: quantities, activeVariant, openStep
      │                                    │
      │ passes data + setters down         │ persisted to localStorage
      ▼                                    ▼
   App.tsx  ──renders──►  BuilderStep (×4)         ReviewPanel
                              │                          │
                     ProductCard / PlanOption      selectedLineItems()
                     VariantSelector                computeTotals()
                     QuantityStepper  ◄───────────────────┘
                                        (same component, same math,
                                         used on both sides of the screen)
```

The whole app is built around **one rule**: nothing except
`useBundleStore.ts` is allowed to hold state, and nothing except
`lib/pricing.ts` is allowed to do math. Components only receive props and
call callbacks. That's what keeps the builder cards and the review panel
from ever showing two different numbers for the same product.

## Deployment

The app is deployed on **Vercel** as a static Vite build
(`npm run build` → `/dist`, served as a static site — there is no server
runtime because there's no backend). The live instance is at
https://bundle-builder-test.vercel.app/. Any push that changes the
`main`/production branch triggers a new Vercel build automatically; no
environment variables are required since `catalog.json` is bundled directly
into the client build.

## Design decisions worth knowing about

- **No backend.** The brief allowed a "bonus" JSON API step; it was
  intentionally skipped in favor of a bundled, strongly-typed
  `src/data/catalog.json`. Swapping it for a real fetch later only touches
  `useBundleStore`'s initial-load logic — nothing else needs to change.
- **Per-unit pricing everywhere.** Every price in the catalog is a per-unit
  price multiplied by quantity, so totals always recalculate correctly when
  a shopper changes a quantity, instead of ever showing a stale, hard-coded
  line total.
- **One quantity map, not scattered `useState` calls.** Every selectable
  thing on the page — a camera in white, the same camera in black, the plan,
  a sensor — is a single flat key in one object. See
  [`src/hooks/README.md`](./src/hooks/README.md) for exactly how that key is
  built and why it matters.
