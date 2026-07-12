import { useCallback, useEffect, useMemo, useState } from "react";
import catalogJson from "../data/catalog.json";
import type { BundleState, Catalog, CategoryId } from "../types";
import { lineKey, seedActiveVariant, seedQuantities } from "../lib/pricing";

const catalog = catalogJson as Catalog;
const STORAGE_KEY = "corewyze:bundle-builder:v1";

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

export function useBundleStore() {
  const [state, setState] = useState<BundleState>(loadInitialState);
  const [savedAt, setSavedAt] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw).savedAt ?? null : null;
  });

  const setQuantity = useCallback(
    (productId: string, variantId: string | undefined, nextQuantity: number) => {
      setState((prev) => {
        const category = catalog.categories.find((c) =>
          c.products.some((p) => p.id === productId),
        );
        const product = category?.products.find((p) => p.id === productId);
        if (product?.locked) return prev;

        const clamped = Math.max(0, nextQuantity);
        const key = lineKey(productId, variantId);
        const quantities = { ...prev.quantities, [key]: clamped };

        // plan is single-select: choosing one zeroes every sibling in the category
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

  const setActiveVariant = useCallback((productId: string, variantId: string) => {
    setState((prev) => ({
      ...prev,
      activeVariant: { ...prev.activeVariant, [productId]: variantId },
    }));
  }, []);

  const setOpenStep = useCallback((stepId: CategoryId) => {
    setState((prev) => ({
      ...prev,
      openStep: prev.openStep === stepId ? null : stepId,
    }));
  }, []);

  const goToNextStep = useCallback((fromStepId: CategoryId) => {
    setState((prev) => {
      const index = catalog.categories.findIndex((c) => c.id === fromStepId);
      const next = catalog.categories[index + 1];
      return { ...prev, openStep: next ? next.id : null };
    });
  }, []);

  const saveForLater = useCallback(() => {
    const payload = { ...state, savedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setSavedAt(payload.savedAt);
  }, [state]);

  const clearSaved = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setSavedAt(null);
  }, []);

  // Keep the current session mirrored too, so an accidental reload doesn't lose
  // in-progress work even before the shopper explicitly hits "save for later".
  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const savedAtValue = raw ? JSON.parse(raw).savedAt : undefined;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, savedAtValue }));
  }, [state]);

  const selectedCounts = useMemo(() => {
    const counts: Record<CategoryId, number> = {
      cameras: 0,
      plan: 0,
      sensors: 0,
      accessories: 0,
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
