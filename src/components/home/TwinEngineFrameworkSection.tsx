import { Check } from 'lucide-react';

export default function TwinEngineFrameworkSection() {
  return (
    <section className="relative py-20 bg-base-200">
      <div className="max-w-8xl mx-auto px-4 lg:px-8 text-center">
        <div data-aos="fade-up" data-aos-duration="650" data-aos-once="true">
          <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-4xl 2xl:text-5xl font-bold text-base-content">
            The Twin Engine Investing Framework
          </h2>
          <p className="mt-2 md:mt-4 lg:mt-4 text-base md:text-lg lg:text-xl xl:text-xl 2xl:text-2xl font-medium text-base-content/80">
            Our quant based dual approach to generating superior risk-adjusted returns
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-16">
          
        <div
  className="relative border-2 border-primary/50 rounded-3xl p-6 pt-10"
  data-aos="zoom-in"
  data-aos-duration="650"
  data-aos-once="true"
>

  {/* Engine Badge */}
  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
    <span className="badge badge-primary badge-sm md:badge-md lg:badge-lg xl:badge-xl 2xl:badge-2xl px-4 py-3 text-white font-semibold shadow-md">
      Engine - 1
    </span>
  </div>

  <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
    <div className="text-left">
      {/* Mobile: heading + image on same row */}
      <div className="flex items-center justify-between gap-2 mb-3 md:hidden">
        <h3 className="text-xl md:text-2xl font-semibold text-primary">
          Build Model Portfolio
        </h3>
        <img
          src="/images/home/17.png"
          alt="Portfolio"
          className="w-12 md:w-16 shrink-0"
        />
      </div>
      {/* Large: heading only */}
      <h3 className="hidden md:block text-xl md:text-2xl font-semibold text-primary mb-3">
        Build Model Portfolio
      </h3>
      <p className="text-base md:text-lg text-base-content/70 leading-relaxed">
        Construct or restructure a base portfolio with securities using Hedgium&apos;s model portfolio to achieve optimal diversification
      </p>
    </div>
    {/* Large: image on right */}
    <img
      src="/images/home/17.png"
      alt="Portfolio"
      className="hidden md:block w-12 md:w-24 lg:w-24 xl:w-24 2xl:w-36 shrink-0"
    />
  </div>
</div>


          <div
            className="relative border-2 border-primary/50 rounded-3xl p-6 pt-10"
            data-aos="zoom-in"
            data-aos-duration="650"
            data-aos-delay="120"
            data-aos-once="true"
          >
            {/* Engine Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="badge badge-primary badge-sm md:badge-md lg:badge-lg xl:badge-xl 2xl:badge-2xl px-4 py-3 text-white font-semibold shadow-md">
                Engine - 2
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
              <div className="text-left">
                {/* Mobile: heading + image on same row */}
                <div className="flex items-center justify-between gap-2 mb-3 md:hidden">
                  <h3 className="text-xl md:text-2xl font-semibold text-primary">
                    Deploy Statistical Arbitrage
                  </h3>
                  <img
                    src="/images/home/18.png"
                    alt="Statistical Arbitrage"
                    className="w-12 md:w-24 lg:w-24 xl:w-24 2xl:w-36 shrink-0"
                  />
                </div>
                {/* Large: heading only */}
                <h3 className="hidden md:block text-xl md:text-2xl font-semibold text-primary mb-3">
                  Deploy Statistical Arbitrage
                </h3>
                <p className="text-base md:text-lg text-base-content/70 leading-relaxed">
                  Leverage margin from the portfolio to execute non-directional, algorithm-driven options strategies to generate consistent income
                </p>
              </div>
              {/* Large: image on right (same as Engine 1) */}
              <img
                src="/images/home/18.png"
                alt="Statistical Arbitrage"
                className="hidden md:block w-12 md:w-24 lg:w-24 xl:w-24 2xl:w-36 shrink-0"
              />
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
