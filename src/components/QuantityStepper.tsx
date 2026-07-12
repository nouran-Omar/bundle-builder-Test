import { MinusIcon, PlusIcon } from "./icons/Icons";

interface QuantityStepperProps {
  label: string;
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  locked?: boolean;
  minQuantity?: number;
  size?: "sm" | "md";
}



export function QuantityStepper({
  label,
  quantity,
  onDecrease,
  onIncrease,
  locked = false,
  minQuantity = 0,
  size = "md",
}: QuantityStepperProps) {
  const decreaseDisabled = locked || quantity <= minQuantity;
  const increaseDisabled = locked;
  const dim = size === "sm" ? "w-5 h-5" : "w-5 h-5";

  return (
    <div
      className={`flex items-center justify-center gap-2.5 rounded ${
        size === "sm" ? "w-[72px] px-0 py-1" : "w-20 py-1"
      }`}
    >
      <button
        type="button"
        aria-label={`Decrease quantity of ${label}`}
        disabled={decreaseDisabled}
        onClick={onDecrease}
        className={`focus-ring flex ${dim} items-center justify-center rounded border transition-colors duration-300 ${
          decreaseDisabled
            ? "bg-gray-c200 border-transparent text-gray-c500"
            : "bg-white border-gray-c300 text-gray-cobsidian hover:border-corewyze-purple hover:text-corewyze-purple"
        }`}
      >
        <MinusIcon className="w-2 h-2" />
      </button>

      <output
        aria-label={`${label} quantity`}
        className="min-w-[16px] text-center font-heading text-sm text-gray-cobsidian"
      >
        {quantity}
      </output>

      <button
        type="button"
        aria-label={`Increase quantity of ${label}`}
        disabled={increaseDisabled}
        onClick={onIncrease}
        className={`focus-ring flex ${dim} items-center justify-center rounded transition-colors duration-300 ${
          increaseDisabled
            ? "bg-gray-c200 text-gray-c500"
            : "bg-gray-c200 text-gray-cobsidian hover:bg-corewyze-purple hover:text-white"
        }`}
      >
        <PlusIcon className="w-2 h-2" />
      </button>
    </div>
  );
}
