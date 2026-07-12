import { useId } from "react";
import type { CatalogCategory } from "../types";
import { lineKey } from "../lib/pricing";
import { StepHeader } from "./StepHeader";
import { ProductCard } from "./ProductCard";
import { PlanOption } from "./PlanOption";
import {
  CameraStepIcon,
  ExtraProtectionStepIcon,
  PlanStepIcon,
  SensorStepIcon,
} from "./icons/Icons";

const STEP_ICONS = {
  cameras: CameraStepIcon,
  plan: PlanStepIcon,
  sensors: SensorStepIcon,
  accessories: ExtraProtectionStepIcon,
};

interface BuilderStepProps {
  category: CatalogCategory;
  totalSteps: number;
  isOpen: boolean;
  isLast: boolean;
  selectedCount: number;
  quantities: Record<string, number>;
  activeVariant: Record<string, string>;
  onToggle: () => void;
  onQuantityChange: (productId: string, variantId: string | undefined, next: number) => void;
  onVariantChange: (productId: string, variantId: string) => void;
  onNext: () => void;
}

export function BuilderStep({
  category,
  totalSteps,
  isOpen,
  isLast,
  selectedCount,
  quantities,
  activeVariant,
  onToggle,
  onQuantityChange,
  onVariantChange,
  onNext,
}: BuilderStepProps) {
  const headingId = useId();
  const panelId = `${headingId}-panel`;
  const Icon = STEP_ICONS[category.id];

  return (
    <section
      className={`flex flex-col items-start gap-[5px] self-stretch rounded-[10px] overflow-hidden transition-colors duration-300 ${
        isOpen ? "bg-review-bg" : "bg-white"
      }`}
    >
      <StepHeader
        step={category.step ?? 1}
        totalSteps={totalSteps}
        title={category.title}
        icon={<Icon className="w-full h-full" />}
        selectedCount={selectedCount}
        isOpen={isOpen}
        onToggle={onToggle}
        panelId={panelId}
        headingId={headingId}
      />

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
          <div className="flex flex-col items-stretch gap-[15px] px-[15px] py-5 self-stretch w-full">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[15px] [&>*:only-child]:sm:col-span-2 [&>*:only-child]:sm:justify-self-center [&>*:not(:only-child):nth-last-child(1):nth-child(odd)]:sm:col-span-2 [&>*:not(:only-child):nth-last-child(1):nth-child(odd)]:sm:justify-self-center [&>*:not(:only-child):nth-last-child(1):nth-child(odd)]:sm:max-w-[calc(50%-7.5px)] dxl:flex dxl:flex-row dxl:flex-nowrap dxl:justify-center dxl:gap-[15px] dxl:[&>*]:max-w-none dxl:[&>*]:justify-self-auto">
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

                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      quantity={quantity}
                      isSelected={isSelected}
                      activeVariantId={activeId}
                      onVariantChange={(variantId) => onVariantChange(product.id, variantId)}
                      onIncrease={() => onQuantityChange(product.id, activeId, quantity + 1)}
                      onDecrease={() => onQuantityChange(product.id, activeId, quantity - 1)}
                    />
                  );
                })}
              </div>
            )}

            {!isLast ? (
              <div className="flex justify-center self-stretch">
                <button
                  type="button"
                  onClick={onNext}
                  className="focus-ring text-center inline-flex h-[39px] items-center justify-center gap-2.5 px-6 py-[5px] rounded-[7px] border border-solid border-[#4e2fd2] text-[#4e2fd2] font-heading text-lg leading-6 hover:bg-[#4e2fd2] hover:text-white transition-colors duration-300"
                >
                  Next: {NEXT_LABELS[category.id]}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

const NEXT_LABELS: Record<string, string> = {
  cameras: "Choose your plan",
  plan: "Choose your sensors",
  sensors: "Add extra protection",
};