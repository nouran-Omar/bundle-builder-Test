import type { Product } from "../types";
import { formatUsd } from "../lib/pricing";
import { QuantityStepper } from "./QuantityStepper";
import { VariantSelector } from "./VariantSelector";

interface ProductCardProps {
  product: Product;
  quantity: number;
  isSelected: boolean;
  activeVariantId?: string;
  onVariantChange?: (variantId: string) => void;
  onIncrease: () => void;
  onDecrease: () => void;
  compact?: boolean;
}

export function ProductCard({
  product,
  quantity,
  isSelected,
  activeVariantId,
  onVariantChange,
  onIncrease,
  onDecrease,
  compact = false,
}: ProductCardProps) {
  return (
    <article
      className={`flex flex-row dxl:flex-col items-center gap-3 sm:gap-[19px] dxl:gap-[19px] p-[11px] dxl:px-[11px] dxl:py-[15px] flex-1 min-w-0 bg-white rounded-[10px] border-2 transition-colors duration-300 ${
        isSelected ? "border-[#4e2fd2b2]" : "border-transparent"
      }`}
    >
      <div
        className={`relative shrink-0 rounded-[5px] overflow-hidden bg-gray-c200 flex items-center justify-center ${
          compact
            ? "w-[72px] h-[72px]"
            : "w-[90px] h-[122px] sm:w-[101px] sm:h-[137px] dxl:w-full dxl:h-[117px]"
        }`}
        aria-hidden="true"
      >
  {product.image ? (
  <img
    src={product.image}
    alt=""
    className="absolute inset-0 w-full h-full object-cover dxl:object-contain block"
    loading="lazy"
  />
) : (
          <span className="text-[10px] text-gray-c500 font-body px-2 text-center">
            {product.name}
          </span>
        )}
        {product.badge ? (
          <span className="absolute top-1.5 left-1.5 inline-flex items-center justify-center gap-1 px-1.5 py-0.5 bg-corewyze-purple rounded-[10px] text-white text-[12px] leading-[15px] font-heading">
            {product.badge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col items-start gap-2.5 flex-1 min-w-0 dxl:w-full dxl:self-stretch">
        <div className="flex flex-col items-start gap-2 self-stretch">
          <h3 className="font-heading text-[#1f1f1f] text-base dxl:text-lg leading-4 dxl:leading-[18px] tracking-[0.6px]">
            {product.name}
          </h3>
          {product.description ? (
            <p className="font-body text-[#1f1f1fbf] text-xs dxl:text-sm leading-[15.6px] dxl:leading-[18.2px] tracking-[0.6px]">
              {product.description}{" "}
              {product.learnMoreHref ? (
                <a href={product.learnMoreHref} className="text-[#0000ee] underline">
                  Learn More
                </a>
              ) : null}
            </p>
          ) : null}

          {product.variants && product.variants.length > 0 && activeVariantId ? (
            <VariantSelector
              productId={product.id}
              variants={product.variants}
              activeVariantId={activeVariantId}
              onChange={(id) => onVariantChange?.(id)}
            />
          ) : null}
        </div>

        <div className="flex items-end gap-2.5 self-stretch flex-wrap">
          <QuantityStepper
            label={product.name}
            quantity={quantity}
            onIncrease={onIncrease}
            onDecrease={onDecrease}
          />
          <div className="flex flex-col dxl:flex-row items-end dxl:items-center justify-center dxl:justify-end gap-[3px] flex-1">
            {product.originalPrice ? (
              <div className="font-regular text-[#d8392b] text-sm sm:text-base text-right line-through tracking-[0.6px] leading-4">
                {formatUsd(product.originalPrice)}
              </div>
            ) : null}
            <div className="font-regular text-[#575757] text-sm sm:text-base text-right tracking-[0.6px] leading-4">
              {product.priceLabel ?? formatUsd(product.price)}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}