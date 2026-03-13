import Image from 'next/image';

export default function PlaybooksSection() {
  return (
    <section id="playbooks" className="py-14 md:py-24 px-6 bg-base-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-center">
          <div
            className="lg:w-1/2 flex flex-col gap-6"
            data-aos="fade-up"
            data-aos-duration="650"
            data-aos-once="true"
          >
            <h2 className="text-2xl py-2 md:text-3xl lg:text-4xl font-bold text-base-content">
              Playbooks adapted to <span className="text-primary">your goals</span>
            </h2>
            <div className="relative flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <div className="bg-primary text-primary-content px-3 py-1.5 font-bold text-sm lg:text-base rounded-sm">
                  Portfolio income approach
                </div>
                <p className="text-sm lg:text-base font-bold text-base-content mt-1">Build top-up income</p>
                <p className="text-sm lg:text-base text-primary">
                  Investors with an existing portfolio, who desire incremental returns by leveraging portfolio value using statistical-arbitrage low-risk strategies
                </p>
              </div>
              <div className="flex flex-col gap-1 self-center">
                <div className="bg-primary text-primary-content px-3 py-1.5 font-bold text-sm lg:text-base rounded-sm">
                  Total income approach
                </div>
                <p className="text-sm lg:text-base font-bold text-base-content mt-1">Build base portfolio + Top-up income</p>
                <p className="text-sm lg:text-base text-primary">
                  Investors who want to build ground-up portfolios and leverage them for additional income, targeting superior risk-adjusted returns
                </p>
              </div>
            </div>
          </div>
          <div
            className="lg:w-1/2"
            data-aos="fade-up"
            data-aos-duration="700"
            data-aos-delay="120"
            data-aos-once="true"
          >
            <Image src="/images/home2.jpg" className="rounded-lg" alt="Playbooks" width={500} height={500} />
          </div>
        </div>
      </div>
    </section>
  );
}
