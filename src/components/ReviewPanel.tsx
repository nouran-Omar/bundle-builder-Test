import { useMemo, useState } from "react";
import type { Catalog, LineKey } from "../types";
import { computeTotals, formatUsd, lineKey, selectedLineItems } from "../lib/pricing";
import { QuantityStepper } from "./QuantityStepper";
import { CamUnlimitedBadge, ShippingIcon } from "./icons/Icons";

interface ReviewPanelProps {
  catalog: Catalog;
  quantities: Record<LineKey, number>;
  onQuantityChange: (productId: string, variantId: string | undefined, next: number) => void;
  onSave: () => void;
  savedAt: number | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  cameras: "CAMERAS",
  sensors: "SENSORS",
  accessories: "ACCESSORIES",
};

export function ReviewPanel({
  catalog,
  quantities,
  onQuantityChange,
  onSave,
  savedAt,
}: ReviewPanelProps) {
  const grouped = useMemo(() => selectedLineItems(catalog, quantities), [catalog, quantities]);
  const totals = useMemo(() => computeTotals(catalog, quantities), [catalog, quantities]);
  const [justSaved, setJustSaved] = useState(false);

  const planItems = grouped.plan ?? [];
  const lineCategories = ["cameras", "sensors", "accessories"] as const;

  const handleSave = () => {
    onSave();
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 2500);
  };

  return (
    <aside
      aria-label="Order review summary"
      className="flex flex-col items-start gap-[5px] pt-[15px] bg-review-bg rounded-[10px] w-full top-6 dxl:static"
    >
      {/* REVIEW eyebrow — only shown on mobile/tablet per design, hidden on desktop */}
      <div className="flex items-center justify-center px-[15px] self-stretch dxl:hidden">
        <p className="flex-1 font-body text-[#484848] text-[10px] xs:text-xs tracking-[1.6px] leading-3">
          REVIEW
        </p>
      </div>

      <div className="flex flex-col items-start gap-2.5 pt-5 pb-[31px] px-5 self-stretch">
        <header className="flex flex-col items-start gap-[5px] self-stretch">
          <h2 className="font-heading text-[#1f1f1f] text-[22px] dxl:text-[28px] tracking-[0.6px] leading-[22px] dxl:leading-[28px]">
            Your security system
          </h2>
          <p className="font-body text-[#1f1f1fbf] text-xs xs:text-sm dxl:text-base tracking-[0.6px] leading-[15.6px] xs:leading-[18.2px] dxl:leading-[20.8px]">
            Review your personalized protection system designed to keep what matters most safe.
          </p>
        </header>

        <div className="flex flex-col gap-2.5 self-stretch dxl:grid dxl:grid-cols-[1.14fr_1fr] dxl:gap-[52px] dxl:items-start">
        <div className="flex flex-col items-start gap-2.5 self-stretch">
          {lineCategories.map((categoryId) => {
            const items = grouped[categoryId];
            if (!items || items.length === 0) return null;
            return (
              <section
                key={categoryId}
                aria-labelledby={`${categoryId}-review-heading`}
                className="flex flex-col items-start gap-2 pt-[15px] self-stretch border-t border-[#ced6de]"
              >
                <h3
                  id={`${categoryId}-review-heading`}
                  className="font-regular text-gray-c500 text-xs tracking-[0.36px] leading-4"
                >
                  {CATEGORY_LABELS[categoryId]}
                </h3>
                <div className="flex flex-col items-start gap-3 self-stretch">
                  {items.map((item) => (
                    <div
                      key={lineKey(item.product.id, item.variantId)}
                      className="flex items-start gap-4 self-stretch"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative w-10 h-10 shrink-0 rounded-[5px] bg-white overflow-hidden">
                          {item.product.image ? (
                            <img
                              src={item.product.image}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover block"
                              loading="lazy"
                            />
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0 font-body text-gray-cobsidian text-xs xs:text-sm dxl:text-lg tracking-[0.07px] leading-4 truncate">
                          {item.product.name}
                          {item.variantName ? ` — ${item.variantName}` : ""}
                        </div>
                        <QuantityStepper
                          size="sm"
                          label={`${item.product.name}${item.variantName ? ` ${item.variantName}` : ""}`}
                          quantity={item.quantity}
                          locked={item.product.locked}
                          minQuantity={item.product.locked ? 1 : 0}
                          onIncrease={() =>
                            onQuantityChange(item.product.id, item.variantId, item.quantity + 1)
                          }
                          onDecrease={() =>
                            onQuantityChange(item.product.id, item.variantId, item.quantity - 1)
                          }
                        />
                      </div>
                      <div className="flex flex-col items-end justify-center shrink-0">
                        {item.originalTotal ? (
                          <div className="font-body text-gray-c600 text-xs xs:text-sm dxl:text-base text-right line-through tracking-[0.07px] leading-4">
                            {formatUsd(item.originalTotal)}
                          </div>
                        ) : null}
                        <div className="font-heading text-corewyze-purple text-xs xs:text-sm dxl:text-base text-right tracking-[0.07px] leading-4">
                          {item.product.priceLabel ?? formatUsd(item.currentTotal)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {planItems.length > 0 ? (
            <section
              aria-labelledby="plan-review-heading"
              className="flex flex-col items-start gap-2 pt-[15px] self-stretch border-t border-[#ced6de]"
            >
              <h3
                id="plan-review-heading"
                className="font-regular text-gray-c500 text-xs tracking-[0.36px] leading-4"
              >
                PLAN
              </h3>
              {planItems.map((item) => (
                <div key={item.product.id} className="flex items-start justify-between self-stretch">
                  <p className="flex items-center gap-[3px] font-heading text-sm xs:text-base dxl:text-xl tracking-[-0.03px] leading-4">
                    {item.product.id === "cam-unlimited" ? (
                      <CamUnlimitedBadge className="w-[14px] h-[17px] xs:w-5 xs:h-6 dxl:w-[26px] dxl:h-[31px] shrink-0" />
                    ) : null}
                    <span className="text-black">{item.product.name.split(" ")[0]} </span>
                    <span className="text-[#4e2fd2]">
                      {item.product.name.split(" ").slice(1).join(" ")}
                    </span>
                  </p>
                  <div className="flex flex-col items-end justify-center">
                    {item.originalTotal ? (
                      <div className="font-body text-gray-c600 text-xs xs:text-sm dxl:text-base text-right line-through tracking-[0.07px] leading-4">
                        {formatUsd(item.originalTotal)}
                        {item.product.billingSuffix}
                      </div>
                    ) : null}
                    <div className="font-heading text-corewyze-purple text-xs xs:text-sm dxl:text-base text-right tracking-[0.07px] leading-4">
                      {formatUsd(item.currentTotal)}
                      {item.product.billingSuffix}
                    </div>
                  </div>
                </div>
              ))}
            </section>
          ) : null}

          <section className="flex flex-col items-start gap-2 pt-[15px] self-stretch border-t border-[#ced6de]">
            <div className="flex items-center gap-4 self-stretch">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-[5px] bg-white flex items-center justify-center text-corewyze-purple">
                  <ShippingIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 font-body text-gray-cobsidian text-xs xs:text-sm dxl:text-lg tracking-[0.07px] leading-4">
                  {catalog.shipping.name}
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <div className="font-body text-gray-c600 text-xs xs:text-sm dxl:text-base text-right line-through tracking-[0.07px] leading-4">
                  {formatUsd(catalog.shipping.originalPrice)}
                </div>
                <div className="font-heading text-corewyze-purple text-xs xs:text-sm dxl:text-base text-center tracking-[0.07px] leading-4">
                  {catalog.shipping.priceLabel}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col items-start gap-2 self-stretch">
          <div className="flex items-center justify-between self-stretch">
            <img
              src="/images/satisfaction-badge.png"
              alt="30-day satisfaction guarantee"
              className="w-[78px] h-[78px] dxl:w-[131px] dxl:h-[131px] object-contain"
            />
            <div className="flex flex-col items-end justify-center gap-2">
              {totals.planMonthly ? (
                <div className="inline-flex items-center justify-center gap-2.5 px-2 py-[5px] dxl:py-2 bg-[#4e2fd2] rounded-[3px]">
                  <div className="font-body text-white text-xs dxl:text-base tracking-[-0.6px]">
                    as low as {formatUsd(totals.current / 10 || 0)}/mo
                  </div>
                </div>
              ) : null}
              <div className="inline-flex items-baseline gap-2">
                {totals.original > totals.current ? (
                  <div className="font-body text-gray-c600 text-lg dxl:text-[22px] text-center line-through tracking-[0.04px] leading-5">
                    {formatUsd(totals.original)}
                  </div>
                ) : null}
                <div className="font-display text-corewyze-purple text-2xl dxl:text-[28px] text-right tracking-[-0.03px] leading-8">
                  {formatUsd(totals.current)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-1 pt-2.5 self-stretch">
            {totals.savings > 0 ? (
              <p className="self-stretch font-heading text-[#0aa288] text-xs dxl:text-sm text-center tracking-[-0.06px] leading-3">
                Congrats! You&apos;re saving {formatUsd(totals.savings)} on your security bundle!
              </p>
            ) : null}
         <button
  type="button"
  className="focus-ring box-border flex items-center justify-center gap-2 px-4 py-[13px] self-stretch bg-[#4E2FD2] rounded hover:bg-[#3f24ab] transition-colors duration-300"
  aria-label="Checkout"
  onClick={() => window.alert("This is a prototype — checkout isn't wired up yet.")}
>
  <span className="font-heading text-white text-[17px] text-center leading-normal">
    Checkout
  </span>
</button>
          </div>
        </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="focus-ring relative flex items-center justify-center self-stretch font-body italic text-[#484848] text-xs xs:text-sm text-center tracking-[-0.02px] leading-[16.8px] underline hover:text-corewyze-purple transition-colors duration-300"
        >
          {justSaved
            ? "Saved!"
            : savedAt
              ? `Save my system for later (saved ${new Date(savedAt).toLocaleDateString()})`
              : "Save my system for later"}
        </button>
      </div>
    </aside>
  );
}