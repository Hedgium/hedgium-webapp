import Image from "next/image";

/** Same label column width so description text aligns across Retail + Institutional */
const TIER_COL = "w-[10.5rem] min-w-[10.5rem] shrink-0 font-bold text-lg text-base-content leading-tight";
const DESC_COL = "text-sm text-base-content/80 leading-relaxed pt-0.5";

export default function FeesSection() {
  return (
    <section className="bg-base-200 py-14 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <div
          data-aos="fade-up"
          data-aos-duration="650"
          data-aos-once="true"
        >
          <h2 className="text-3xl font-bold text-primary">Fees</h2>
          <p className="text-primary/80 text-sm sm:text-base mt-1 mb-10 max-w-2xl">
            Simple structure and charged only if there are profits to cover the fees
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
              <h3 className="text-base font-semibold text-base-content border-b border-dashed border-primary/40 pb-2 mb-4">
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
              <h3 className="text-base font-semibold text-base-content border-b border-dashed border-primary/40 pb-2 mb-4">
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
              className="w-full max-w-md h-auto object-contain"
            />
          </div>
        </div>

        {/* Offer Banner — single column, consistent alignment */}
        <div
          className="bg-primary/70 text-primary-content mt-14 rounded-xl px-5 py-6 sm:px-8 sm:py-7"
          data-aos="fade-up"
          data-aos-duration="650"
          data-aos-once="true"
        >
          <div className="max-w-3xl space-y-3 text-left">
            <p className="font-semibold text-base sm:text-lg leading-snug">
              New Fiscal Year Offer (valid only till 30ᵗʰ Apr 2026)
            </p>
            <p className="text-base sm:text-lg font-bold">
              Free first month - <span className="text-sm sm:text-base opacity-95 leading-relaxed pl-0 sm:pl-1">
              Potentially earn back a significant portion of the fees at no cost before you
              even pay.
            </span>
            </p>
            
          </div>
        </div>

        <p className="text-xs text-base-content/60 mt-5">
          * Subject to Regulatory framework prescribed by SEBI
        </p>
      </div>
    </section>
  );
}
