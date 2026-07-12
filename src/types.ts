export type CategoryId = "cameras" | "plan" | "sensors" | "accessories";

export interface Variant {
  id: string;
  name: string;
  /** path under /public, e.g. "/images/wyze-cam-v4-white.png" */
  image?: string;
  /** fallback flat color swatch if no image is available yet */
  swatchColor?: string;
}

export interface Product {
  id: string;
  category: CategoryId;
  name: string;
  description?: string;
  learnMoreHref?: string;
  badge?: string;
  image?: string;
  /** per-unit compare-at price; omit if there's no discount */
  originalPrice?: number;
  /** per-unit active price */
  price: number;
  /** overrides the price display, e.g. "FREE" for the required hub */
  priceLabel?: string;
  /** monthly cadence, used for the plan product only */
  billingSuffix?: "/mo";
  variants?: Variant[];
  /** can't be edited by the shopper (e.g. the required sensor hub) */
  locked?: boolean;
  /** seed quantity, or seed quantity per variant id if variants exist */
  initialQuantity?: number | Record<string, number>;
}

export interface CatalogCategory {
  id: CategoryId;
  step?: number;
  title: string;
  /** the plan category behaves like radio buttons: picking one zeroes the rest */
  singleSelect?: boolean;
  products: Product[];
}

export interface Catalog {
  categories: CatalogCategory[];
  shipping: {
    name: string;
    originalPrice: number;
    priceLabel: string;
  };
}

/** key used in the quantities map: `${productId}::${variantId ?? "_default"}` */
export type LineKey = string;

export interface BundleState {
  quantities: Record<LineKey, number>;
  /** which variant is "active" on each product's card / stepper */
  activeVariant: Record<string, string>;
  openStep: CategoryId | null;
}
