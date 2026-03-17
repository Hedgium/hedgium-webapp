import Image from 'next/image';

export default function PlaybooksSection() {
  return (
    <section id="playbooks" className="py-14 md:py-24 bg-base-100">
      <div className="max-w-8xl mx-auto px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-center">
          <div
            className="lg:w-1/2 flex flex-col gap-6"
            data-aos="fade-up"
            data-aos-duration="650"
            data-aos-once="true"
          >
            <h2 className="text-3xl py-2 lg:py-4 md:text-4xl lg:text-5xl xl:text-4xl 2xl:text-5xl font-bold text-base-content">
              Playbooks adapted to <span className="text-primary">your goals</span>
            </h2>
            <div className="relative flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <div className="bg-primary text-primary-content px-2 lg:px-4 py-2 lg:py-3 font-bold text-base lg:text-lg rounded-sm">
                  Portfolio income approach
                </div>

                <div className='mt-1 ml-2 lg:ml-4'>
                <p className="text-base lg:text-lg font-bold text-base-content">Build top-up income</p>
                <p className="text-base lg:text-lg text-primary">
                  Investors with an existing portfolio, who desire incremental returns by leveraging portfolio value using statistical-arbitrage low-risk strategies
                </p>
                </div>
              </div>
              <div className="flex flex-col gap-1 self-center">
                <div className="bg-primary text-primary-content px-2 lg:px-4 py-2 lg:py-3 font-bold text-base lg:text-lg rounded-sm">
                  Total income approach
                </div>
                <div className='mt-1 ml-2 lg:ml-4'>
                <p className="text-base lg:text-lg font-bold text-base-content">Build base portfolio + Top-up income</p>
                <p className="text-base lg:text-lg text-primary">
                  Investors who want to build ground-up portfolios and leverage them for additional income, targeting superior risk-adjusted returns
                </p>
                </div>
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
