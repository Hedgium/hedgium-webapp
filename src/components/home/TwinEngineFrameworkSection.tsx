import { Check, TrendingUp, Settings } from 'lucide-react';

export default function TwinEngineFrameworkSection() {
  return (
    <section className="relative py-20 px-4 lg:px-8 bg-base-200">
      <div className="max-w-6xl mx-auto text-center">
        <div data-aos="fade-up" data-aos-duration="650" data-aos-once="true">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-base-content">
            The Twin Engine Investing Framework
          </h2>
          <p className="mt-2 text-base md:text-lg font-medium text-base-content/80">
            Our quant based dual approach to generating superior risk-adjusted returns
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div
            className="border-2 border-primary/50 rounded-3xl p-4 md:p-6"
            data-aos="zoom-in"
            data-aos-duration="650"
            data-aos-once="true"
          >
            <div className="flex items-end justify-between gap-2">
              <div className="text-left">
                <span className='badge badge-outline'>Engine 1</span>
                <h3 className="text-xl md:text-2xl font-semibold text-primary my-3">
                  Build Model Portfolio
                </h3>
                <p className="text-base md:text-lg text-base-content/70 leading-relaxed">
                  Construct or restructure a base portfolio with securities using Hedgium&apos;s model portfolio to achieve optimal diversification</p>
              </div>
              <div className="text-primary shrink-0" aria-hidden>
                <img src="/images/home/17.png" alt="Portfolio" className="size-0 md:size-24" />

              </div>
            </div>
          </div>

          <div
            className="border-2 border-primary/50 rounded-3xl p-4 md:p-6"
            data-aos="zoom-in"
            data-aos-duration="650"
            data-aos-delay="120"
            data-aos-once="true"
          >
            <div className="flex items-end justify-between gap-2">
              <div className="text-left">
                <span className='badge badge-outline'>Engine 2</span>
                <h3 className="text-xl md:text-2xl font-semibold text-primary my-3">
                  Deploy Statistical Arbitrage
                </h3>
                <p className="text-base md:text-lg text-base-content/70 leading-relaxed">
                  Leverage margin from the portfolio to execute non-directional, algorithm-driven options strategies to generate consistent income
                </p>
              </div>
              <div className="text-primary shrink-0" aria-hidden>
                <img src="/images/home/18.png" alt="Settings" className="size-0 md:size-24" />
              </div>
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
          <p className="text-center text-base md:text-lg font-semibold mb-6">Combined, our approach aims to:</p>
          <ul className="space-y-2">
            {[
              'Generate consistent market-neutral alpha',
              'Achieve superior risk-adjusted returns',
              'Outperform traditional benchmark strategies',
              'Boost overall return on capital compounding over a multi-period horizon',
            ].map((text) => (
              <li key={text} className="flex items-center gap-2">
                <Check className="text-primary size-5 shrink-0 mt-0.5" strokeWidth={2.5} aria-hidden />
                <span className="text-base md:text-lg font-semibold">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
