import { useBundleStore } from "./hooks/useBundleStore";
import { BuilderStep } from "./components/BuilderStep";
import { ReviewPanel } from "./components/ReviewPanel";

export default function App() {
  const {
    catalog,
    state,
    selectedCounts,
    savedAt,
    setQuantity,
    setActiveVariant,
    setOpenStep,
    goToNextStep,
    saveForLater,
  } = useBundleStore();

  const totalSteps = catalog.categories.length;

  return (
    <main
      className="min-h-screen bg-white grid grid-cols-1 md:grid-cols-[1fr_399px] gap-6 md:gap-[29px] dxl:grid-cols-1 dxl:gap-6 px-4 sm:px-6 lg:px-[60px] pt-8 pb-16 mx-auto max-w-[1440px] items-start"
      aria-label="Security setup and order review"
    >
      <header className="md:hidden">
        <h1 className="font-display text-[#1f1f1f] text-[31.875px] leading-[110%] tracking-[-0.064px] text-center">
          Let&apos;s get started!
        </h1>
      </header>

      <section aria-label="Security setup flow" className="flex-1 flex flex-col gap-3">
   

        {catalog.categories.map((category, index) => (
          <BuilderStep
            key={category.id}
            category={category}
            totalSteps={totalSteps}
            isOpen={state.openStep === category.id}
            isLast={index === catalog.categories.length - 1}
            selectedCount={selectedCounts[category.id]}
            quantities={state.quantities}
            activeVariant={state.activeVariant}
            onToggle={() => setOpenStep(category.id)}
            onQuantityChange={(productId, variantId, next) =>
              setQuantity(productId, variantId, next)
            }
            onVariantChange={setActiveVariant}
            onNext={() => goToNextStep(category.id)}
          />
        ))}
      </section>

      <ReviewPanel
        catalog={catalog}
        quantities={state.quantities}
        onQuantityChange={setQuantity}
        onSave={saveForLater}
        savedAt={savedAt}
      />
    </main>
  );
}