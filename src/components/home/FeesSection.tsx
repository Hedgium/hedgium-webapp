import Image from 'next/image';

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
        <p className="text-primary/80 mt-1 mb-10">
          Simple structure and charged only if there are profits to cover the fees
        </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">

          {/* LEFT CONTENT */}
          <div
            className="space-y-10"
            data-aos="fade-up"
            data-aos-duration="650"
            data-aos-once="true"
          >

            {/* Retail */}
            <div>
              <h3 className="font-semibold border-b border-dashed pb-2 mb-4">
                Retail clients
              </h3>

              <div className="flex gap-6 items-start">
                <span className="font-bold text-xl">25L to 75L</span>

                <span className="text-base-content/80">
                  Starts at <b>0.5% of AUM</b> <br />
                  per quarter*
                </span>
              </div>
            </div>

            {/* Institutional */}
            <div>
              <h3 className="font-semibold border-b border-dashed pb-2 mb-4">
                Accredited or Institutional Clients
              </h3>

              <div className="flex gap-6 items-start">
                <span className="font-bold text-xl">75L+</span>

                <span className="text-base-content/80">
                  Customized pricing <br />
                  depending on mandate
                </span>
              </div>
            </div>

          </div>

          {/* Pricing diagram */}
          <div
            className="flex justify-center"
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

        {/* Offer Banner */}
        <div
          className="bg-primary/70 text-primary-content mt-14 rounded-lg p-5"
          data-aos="fade-up"
          data-aos-duration="650"
          data-aos-once="true"
        >
          <p className="font-semibold text-lg">
            New Fiscal Year Offer (Valid only till 30ᵗʰ Apr 2026):
          </p>

          <p className="underline mt-1">
            Free first month
          </p>

          <p className="opacity-90">
            – potentially earn back a significant portion of the fees at no cost
            before you even pay
          </p>
        </div>

        {/* Footer */}
        <p className="text-xs text-base-content/60 mt-5">
          * Subject to Regulatory framework prescribed by SEBI
        </p>

      </div>
    </section>
  );
}