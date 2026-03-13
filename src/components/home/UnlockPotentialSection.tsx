'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

const UNLOCK_STEPS = [
  { label: 'The Gap', id: 'gap' },
  { label: 'The Opportunity', id: 'opportunity' },
  { label: 'The How', id: 'how' },
] as const;

export default function UnlockPotentialSection() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="unlock-potential">
      <div className="bg-primary text-primary-content py-8 px-4 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-2xl md:text-3xl lg:text-4xl font-bold leading-snug"
            data-aos="fade-up"
            data-aos-duration="650"
            data-aos-once="true"
          >
            Unlock incremental Alpha,{' '}
            <span className="font-normal">
              by exploiting market inefficiencies, using Hedgium&apos;s platform
            </span>
          </h2>
        </div>
      </div>

      <div className="bg-base-200 py-12 md:py-24 px-4 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-center">
            {/* Left column – step buttons */}
            <div
              className="lg:w-[38%] flex flex-col w-full"
              data-aos="fade-up"
              data-aos-duration="650"
              data-aos-once="true"
            >
              {UNLOCK_STEPS.map((step, i) => {
                const isActive = activeStep === i;
                return (
                  <div key={step.id} className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => setActiveStep(i)}
                      className={`w-full cursor-pointer text-left px-4 py-4 md:py-3 font-bold text-base lg:text-lg flex items-center justify-between transition-all shadow-sm active:scale-[0.98] ${
                        isActive
                          ? 'bg-primary text-primary-content'
                          : 'bg-neutral/50 hover:bg-neutral/70 hover:text-primary text-base-content'
                      }`}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      <span>{step.label}</span>
                      <span aria-hidden className="font-bold text-xl md:text-base">
                        &gt;
                      </span>
                    </button>
                    {i < UNLOCK_STEPS.length - 1 && (
                      <div
                        className="w-full h-6 md:h-8"
                        style={{
                          clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                          backgroundColor: isActive
                            ? 'oklch(0.72 0.15 264 / 0.55)'
                            : 'oklch(0.72 0.05 264 / 0.40)',
                        }}
                        aria-hidden
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right column – dynamic content */}
            <div
              className="lg:w-[62%] w-full"
              data-aos="fade-up"
              data-aos-duration="650"
              data-aos-delay="100"
              data-aos-once="true"
            >
              <div className="border border-dashed border-2 border-primary/50 rounded-lg p-5 lg:p-6 bg-base-200 min-h-[200px]">
                {activeStep === 0 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-base lg:text-lg text-base-content">
                      Most Portfolios are -
                    </h3>
                    <ul className="space-y-2 text-sm lg:text-base">
                      {[
                        'Long Only (buy and hold)',
                        'Directionally exposed',
                        'Correlated with broader markets',
                        'Have nil/ underutilization of hedged derivatives',
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full bg-primary shrink-0"
                            aria-hidden
                          />
                          <span className="text-primary font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm lg:text-base text-base-content">
                      <strong>Forgone opportunity:</strong> Non-directional options
                      led returns which could generate additional income at the
                      portfolio level
                    </p>
                  </div>
                )}
                {activeStep === 1 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-base lg:text-lg text-base-content">
                      Markets sometimes exhibit inefficiencies for a very short
                      period, due to variety of factors -
                    </h3>
                    <ul className="space-y-2 text-sm lg:text-base">
                      {[
                        'Overreaction to news/ Behavioural inefficiencies',
                        'Volatility mispricing/ Volatility clustering',
                        'Forced expiry positioning',
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rotate-45 bg-primary shrink-0"
                            aria-hidden
                          />
                          <span className="text-primary font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm lg:text-base text-base-content">
                      Thus, presenting the opportunity to take advantage of these in
                      real-time to generate non-correlated additional returns
                    </p>
                  </div>
                )}
                {activeStep === 2 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-base lg:text-lg text-base-content">
                      By deploying quantitative, high-frequency, non-directional
                      statistical arbitrage strategies that -
                    </h3>
                    <ul className="space-y-2 text-sm lg:text-base">
                      {[
                        'Capture and adapt to opportunities in real-time using our advanced algorithms',
                        'Are self-adjusting to evolving price levels',
                        'Are hedged to protect downside in case of any unanticipated wild movements',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <Check
                            className="w-4 h-4 shrink-0 text-primary mt-0.5"
                            aria-hidden
                          />
                          <span className="text-base-content">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="border border-base-300 rounded p-3 bg-base-100 mt-2">
                      <p className="text-sm lg:text-base font-semibold text-base-content">
                        With the goal to boost portfolio risk-adjusted returns and
                        outperform market benchmarks in a variety of conditions,
                        irrespective of market direction
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}