import type { Product } from "../types";
import { formatUsd } from "../lib/pricing";
import { CamUnlimitedBadge } from "./icons/Icons";

interface PlanOptionProps {
  product: Product;
  isSelected: boolean;
  onSelect: () => void;
}

export function PlanOption({ product, isSelected, onSelect }: PlanOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={onSelect}
      className={`focus-ring flex items-center gap-3 p-[15px] flex-1 min-w-[220px] text-left bg-white rounded-[10px] border-2 transition-colors duration-300 ${
        isSelected ? "border-[#4e2fd2b2]" : "border-gray-c300 hover:border-gray-c500"
      }`}
    >
      {product.id === "cam-unlimited" ? (
        <CamUnlimitedBadge className="w-5 h-6 shrink-0" />
      ) : (
        <span
          aria-hidden="true"
          className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            isSelected ? "border-corewyze-purple" : "border-gray-c300"
          }`}
        >
          {isSelected ? <span className="w-2 h-2 rounded-full bg-corewyze-purple" /> : null}
        </span>
      )}
      <span className="flex-1">
        <span className="block font-heading text-[#1f1f1f] text-base leading-4">
          {product.name}
        </span>
        {product.description ? (
          <span className="block font-body text-[#1f1f1fbf] text-xs leading-[15.6px] mt-1">
            {product.description}
          </span>
        ) : null}
      </span>
      <span className="flex flex-col items-end gap-[3px] shrink-0">
        {product.originalPrice ? (
          <span className="font-body text-gray-c600 text-sm line-through">
            {formatUsd(product.originalPrice)}
            {product.billingSuffix}
          </span>
        ) : null}
        <span className="font-heading text-corewyze-purple text-sm">
          {formatUsd(product.price)}
          {product.billingSuffix}
        </span>
      </span>
    </button>
  );
}
