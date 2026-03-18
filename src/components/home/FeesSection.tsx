import Image from "next/image";

/** Same label column width so description text aligns across Retail + Institutional */
const TIER_COL = "w-[8rem] min-w-[8rem] shrink-0 font-bold text-lg md:text-xl text-base-content leading-tight";
const DESC_COL = "text-base font-medium md:text-lg text-base-content/80 leading-relaxed pt-0.5";

export default function FeesSection() {
  return (
    <section id="fees" className="bg-base-200 py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 xl:px-12">
        {/* Title */}
        <div
          data-aos="fade-up"
          data-aos-duration="650"
          data-aos-once="true"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-primary">Fees</h2>
          <p className="text-accent text-base font-semibold md:text-lg mt-1 mb-10 max-w-2xl">
            {`Simple structure and charged only if there are profits to cover the fees`}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start md:items-center">
          {/* LEFT: aligned tier rows */}
          <div
            className="space-y-10 max-w-xl"
            data-aos="fade-up"
            data-aos-duration="650"
            data-aos-once="true"
          >
            {/* Retail */}
            <div>
              <h3 className="text-lg text-primary md:text-xl font-semibold text-base-content border-b-2 border-dashed border-primary/40 pb-2 mb-4">
                Retail clients
              </h3>
              <div className="flex gap-6 items-start">
                <span className={TIER_COL}>25L to 75L</span>
                <div className={DESC_COL}>
                  <p>
                    Starts at <strong className="text-base-content font-semibold">0.5% of AUM</strong> per
                    quarter*
                  </p>
                </div>
              </div>
            </div>

            {/* Institutional — description column lines up with Retail above */}
            <div>
              <h3 className="text-lg text-primary md:text-xl font-semibold text-base-content border-b-2 border-dashed border-primary/40 pb-2 mb-4">
                Accredited or Institutional Clients
              </h3>
              <div className="flex gap-6 items-start">
                <span className={TIER_COL}>75L+</span>
                <div className={DESC_COL}>
                  <p>Customized pricing depending on mandate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing diagram */}
          <div
            className="flex justify-center md:justify-end"
            data-aos="fade-up"
            data-aos-duration="700"
            data-aos-delay="100"
            data-aos-once="true"
          >
            <Image
              src="/images/home/pricing.png"
              alt="Fees structure: base portfolio profit (Engine-1), trading profit (Engine-2), and fees"
              width={982}
              height={605}
              className="w-full max-w-md h-auto rounded-xl"
            />
          </div>
        </div>

        {/* Offer Banner — single column, consistent alignment */}
        <div
          className="bg-primary text-primary-content mt-12 rounded-xl px-4 py-2"
          data-aos="fade-up"
          data-aos-duration="650"
          data-aos-once="true"
        >
          <div className="space-y-1 text-left">
            <p className="font-semibold text-lg md:text-xl leading-snug">
              New Fiscal Year Offer (valid only till 30ᵗʰ Apr 2026):
            </p>
            <p className="text-base md:text-lg">
              <span className="underline">Free first month </span>- <span className="text-sm sm:text-base opacity-95 leading-relaxed pl-0 sm:pl-1">
              Potentially earn back a significant portion of the fees at no cost before you
              even pay.
            </span>
            </p>
            
          </div>
        </div>

        <p className="text-xs text-base-content/60 mt-5">
          * Subject to Regulatory framework prescribed by SEBI. Fees subject to GST as per applicable laws.
        </p>
      </div>
    </section>
  );
}
