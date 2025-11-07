import { homeContent } from "@/content/home";

export function HowItWorks() {
  const { title, steps } = homeContent.howItWorks;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-12 lg:px-24">
      {/* Section Title - Roboto Bold (H2) */}
      <h2 className="font-roboto mb-12 text-center text-3xl font-bold text-brand-navy sm:text-4xl md:text-5xl">
        {title}
      </h2>

      {/* Steps Container */}
      <div className="relative">
        {/* Connecting Line (hidden on mobile) */}
        <div
          className="absolute left-8 top-0 hidden h-full w-0.5 bg-brand-neutral lg:block"
          aria-hidden="true"
        />

        {/* Steps */}
        <div className="space-y-12 lg:space-y-16">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative flex flex-col gap-6 lg:flex-row lg:gap-12"
            >
              {/* Step Number Circle */}
              <div className="flex-shrink-0">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary shadow-lg lg:relative lg:z-10">
                  <span className="font-roboto text-2xl font-black text-brand-ink">
                    {step.number}
                  </span>
                </div>
              </div>

              {/* Step Content */}
              <div className="flex-1 space-y-3 pb-8 lg:pb-0 lg:pt-2">
                {/* Step Title - Roboto SemiBold (H3) */}
                <h3 className="font-roboto text-2xl font-semibold text-brand-navy sm:text-3xl">
                  {step.title}
                </h3>

                {/* Step Description - Inter Regular */}
                <p className="font-inter max-w-2xl text-lg leading-relaxed text-foreground/80">
                  {step.description}
                </p>
              </div>

              {/* Timeline Dot (mobile only) */}
              {index < steps.length - 1 && (
                <div
                  className="absolute left-8 top-20 h-12 w-0.5 bg-brand-neutral lg:hidden"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
