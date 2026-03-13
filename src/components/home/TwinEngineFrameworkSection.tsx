import { Check } from 'lucide-react';

export default function TwinEngineFrameworkSection() {
  return (
    <section className="relative py-20 px-4 lg:px-8 bg-base-200">
      <div className="max-w-6xl mx-auto text-center">
        <div data-aos="fade-up" data-aos-duration="650" data-aos-once="true">
          <h2 className="text-4xl font-bold text-base-content">
            The Twin Engine Investing Framework
          </h2>
          <p className="mt-2 text-base-content/70">
            Our quant based dual approach to generating superior risk-adjusted returns
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div
            className="card bg-base-100 border-2 border-primary/50 rounded-3xl p-4 md:p-6 shadow-sm"
            data-aos="zoom-in"
            data-aos-duration="650"
            data-aos-once="true"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-xl font-semibold text-primary mb-3">
                  Step 1: Build Model Portfolio
                </h3>
                <p className="text-sm text-base-content/70 leading-relaxed">
                  Construct or restructure a base portfolio with securities using Hedgium&apos;s model portfolio to achieve optimal diversification and long term potential
                </p>
              </div>
              <div className="text-primary text-5xl">📈</div>
            </div>
          </div>

          <div
            className="card bg-base-100 border-2 border-primary/50 rounded-3xl p-4 md:p-6 shadow-sm"
            data-aos="zoom-in"
            data-aos-duration="650"
            data-aos-delay="120"
            data-aos-once="true"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-xl font-semibold text-primary mb-3">
                  Step 2: Deploy Statistical Arbitrage
                </h3>
                <p className="text-sm text-base-content/70 leading-relaxed">
                  Leverage margin from the portfolio to execute non-directional, algorithm-driven options strategies to generate consistent income
                </p>
              </div>
              <div className="text-primary text-5xl">⚙️</div>
            </div>
          </div>
        </div>

        <div
          className="mt-12 max-w-2xl mx-auto text-left"
          data-aos="fade-up"
          data-aos-duration="650"
          data-aos-delay="80"
          data-aos-once="true"
        >
          <p className="text-center font-semibold mb-6">Combined, our approach aims to:</p>
          <ul className="space-y-3">
            {[
              'Generate consistent market-neutral alpha',
              'Achieve superior risk-adjusted returns',
              'Outperform traditional benchmark strategies',
              'Boost overall return on capital compounding over a multi-period horizon',
            ].map((text) => (
              <li key={text} className="flex items-start gap-3">
                <Check className="text-primary size-5 shrink-0 mt-0.5" strokeWidth={2.5} aria-hidden />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
