import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "./icons/Icons";

interface StepHeaderProps {
  step: number;
  totalSteps: number;
  title: string;
  icon: ReactNode;
  selectedCount: number;
  isOpen: boolean;
  onToggle: () => void;
  panelId: string;
  headingId: string;
}

export function StepHeader({
  step,
  totalSteps,
  title,
  icon,
  selectedCount,
  isOpen,
  onToggle,
  panelId,
  headingId,
}: StepHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-center px-[15px]">
        <p className="flex-1 font-body text-[#484848] text-[10px] pt-4 md:text-[12px] tracking-[1.6px] leading-[10px] md:leading-[12px]">
          STEP {step} OF {totalSteps}
        </p>
      </div>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        id={`${headingId}-trigger`}
        onClick={onToggle}
        className={`focus-ring flex items-center gap-[3px] px-[15px] py-5 self-stretch w-full border-t-[0.5px] border-[#1f1f1f] text-left hover:bg-black/[0.02] transition-colors duration-300 ${
          isOpen ? "" : "border-b-[0.5px]"
        }`}
      >
        <span className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-gray-c600 shrink-0 w-5 h-5 md:w-[26px] md:h-[26px] dxl:w-[30px] dxl:h-[30px]" aria-hidden="true">
            {icon}
          </span>
          <span
            id={headingId}
            className="flex-1 font-heading text-gray-cobsidian text-lg md:text-[22px] dxl:text-[28px] leading-[18px] md:leading-[22px] dxl:leading-[28px] tracking-[0]"
          >
            {title}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 shrink-0">
          <span className="font-body text-corewyze-purple text-sm leading-4 whitespace-nowrap">
            {selectedCount} selected
          </span>
          {isOpen ? (
            <ChevronUp className="w-3 h-3 text-corewyze-purple" />
          ) : (
            <ChevronDown className="w-3 h-3 text-gray-cobsidian" />
          )}
        </span>
      </button>
    </>
  );
}