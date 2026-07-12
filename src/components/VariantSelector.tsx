import type { Variant } from "../types";

interface VariantSelectorProps {
  productId: string;
  variants: Variant[];
  activeVariantId: string;
  onChange: (variantId: string) => void;
}

export function VariantSelector({
  productId,
  variants,
  activeVariantId,
  onChange,
}: VariantSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Color" className="flex items-end gap-1.5 flex-wrap">
      {variants.map((variant) => {
        const isActive = variant.id === activeVariantId;
        return (
          <button
            key={`${productId}-${variant.id}`}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${variant.name} color`}
            onClick={() => onChange(variant.id)}
            className={`focus-ring flex h-[26px] items-center justify-center gap-1.5 rounded-sm border px-[6px] transition-colors duration-300 ${
              isActive
                ? "bg-[#1df0bb0a] border-[#0aa288]"
                : "bg-white border-[#cccccc] hover:border-gray-c600"
            }`}
          >
            <span
              aria-hidden="true"
              className="block w-3.5 h-3.5 rounded-full border border-black/10"
              style={{
                backgroundColor: variant.swatchColor ?? "#e5e5e5",
                backgroundImage: variant.image ? `url(${variant.image})` : undefined,
                backgroundSize: "cover",
              }}
            />
            <span className="font-body text-[10px] tracking-[0.6px] text-[#1f1f1f]">
              {variant.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
