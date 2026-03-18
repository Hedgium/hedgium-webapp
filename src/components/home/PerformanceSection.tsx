export default function PerformanceSection() {
  return (
    <section className="bg-primary text-primary-content">
      <div className="max-w-8xl mx-auto px-4 lg:px-8 xl:px-16 py-16 lg:py-24">

        {/* Heading */}
        <div className="mb-12 lg:mb-16 xl:mb-20">
          <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold leading-snug">
            Make volatility work for you,{" "}
            <span className="text-secondary">
              rather against you
            </span>
          </h2>

          <p className="text-sm md:text-base lg:text-lg xl:text-xl text-primary-content/80 mt-2">
              Hedgium’s prop account performance using the two-engine framework
              post market top in December 2025
          </p>
        </div>

        {/* Table Wrapper */}
        <div className="relative border border-primary-content/20 rounded-xl">

          {/* ✅ Centered Badge on Border */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="bg-primary px-4 py-1 text-sm border border-primary-content/30 rounded-md">
              Dec’25 to Mar’26#
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-4  p-4 lg:p-8 xl:p-10 lg:mt-4 xl:mt-6">
            <table className="table w-full text-sm md:text-base border-separate border-spacing-0">

              <thead>
                <tr>
                  <th className="min-w-[200px] lg:min-w-[260px] xl:min-w-[280px]"></th>
                  <th className="text-primary-content text-center border-l-2 border-t-2 border-dashed rounded-tl-xl">Hedgium</th>
                  <th className="text-primary-content text-center border-r-2 border-t-2 border-dashed rounded-tr-xl">Alpha/ Outperformance</th>
                  <th className="text-center text-primary-content">Benchmark Return (NIFTY)</th>
                  <th className="text-center text-primary-content">Equity Mutual Funds (Avg.)*</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td className="text-primary-content/80 min-w-[200px] lg:min-w-[260px] xl:min-w-[280px]">
                    Portfolio Layer (Engine 1):-
                  </td>
                  <td className="text-center border-l-2 border-dashed">-2.8%</td>
                  <td className="font-medium text-center border-r-2 border-dashed">+6.0% / +2.4%</td>
                  <td className="text-center text-primary-content/70">-8.8%</td>
                  <td className="text-center text-primary-content/70">-5.2%</td>
                </tr>

                <tr>
                  <td className="text-primary-content/80 min-w-[200px] lg:min-w-[260px] xl:min-w-[280px]">
                    Trading Layer (Engine 2):-
                  </td>
                  <td className="text-center border-l-2 border-dashed">+3.3%</td>
                  <td className="font-medium text-center border-r-2 border-dashed">+3.3%</td>
                  <td className="text-center text-error">NA</td>
                  <td className="text-center text-error">NA</td>
                </tr>

                {/* Divider
                <tr>
                  <td colSpan={5} className="p-0">
                    <div className="border-t border border-primary-content/20 my-2"></div>
                  </td>
                </tr> */}

                <tr className="font-semibold">
                  <td className="text-primary-content/80 min-w-[200px] lg:min-w-[260px] xl:min-w-[280px]">TOTAL Return (1+2):-</td>
                  <td className="text-center border-l-2 border-b-2 border-dashed rounded-bl-xl">+0.5%</td>
                  <td className="font-medium text-center border-r-2 border-b-2 border-dashed rounded-br-xl">+9.3% / +5.7%</td>
                  <td className="text-center text-primary-content/70">-8.8%</td>
                  <td className="text-center text-primary-content/70">-5.2%</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        {/* Footnotes */}
        <div className="mt-6 text-xs text-primary-content/60 space-y-1">
          <p>* Average of Equity Mutual funds performance (3M). Source: moneycontrol.com</p>
          <p>* Calculated till 12th Mar’26</p>
          <p>Disclaimer: Past performance is not indicative of future returns</p>
        </div>

      </div>
    </section>
  );
}