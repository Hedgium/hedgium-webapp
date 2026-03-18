/** Aligned to deck: Hedgium | Mutual Funds & PMS | AIF */
const COMPARISON_ROWS = [
  {
    category: 'Control Risk',
    hedgium: 'Securities under direct client control & access',
    mutualFundsPms: 'Fund Managers have discretion/ control',
    aif: "Securities in Fund Manager's control",
  },
  {
    category: 'Liquidity',
    hedgium: 'Highly liquid as funds in own brokerage account',
    mutualFundsPms: 'Redemption Process & Exit Load Costs in case of MFs',
    aif: 'Most AIFs have multi-year lock-ins',
  },
  {
    category: 'Tax efficiency',
    hedgium: 'Taxed at own marginal bracket. Can claim expenses to reduce tax',
    mutualFundsPms: "Can't claim expenses to reduce liability",
    aif: "AIFs taxed at fund's level, usually 42.7% irrespective of client's tax bracket",
  },
  {
    category: 'Directional Risk',
    hedgium: 'Engine 2 provides non-correlated returns',
    mutualFundsPms: 'Correlated to market, and depends on strategy',
    aif: 'AIFs can go short but leverage is restricted to a level',
  },
  {
    category: 'ROI driver',
    hedgium: 'Quant based statistical arbitrage',
    mutualFundsPms:
      'Poor performance of a few stocks can significantly hurt overall returns',
    aif: 'Same as Mutual Funds & PMS',
  },
] as const;

export default function ComparisonTable() {
  return (
    <section className="py-16 lg:py-24">
    <div className="max-w-8xl mx-auto px-4 lg:px-8 xl:px-16">
     
    <div
      data-aos="fade-up"
      data-aos-duration="650"
      data-aos-once="true"
    >
      <h3 className="text-2xl md:text-3xl lg:text-4xl xl:text-4xl 2xl:text-5xl font-bold text-base-content mb-2">
        Think beyond Mutual Funds, PMS, AIF –
      </h3>

      <p className="text-base lg:text-lg xl:text-xl text-secondary mb-6">
        Take back control, gain liquidity, reduce costs & improve tax efficiency
      </p>

      <div className="overflow-x-auto bg-base-100 mt-8 lg:mt-12 xl:mt-16 rounded-xl">
        <table className="w-full min-w-[800px] text-left border-separate border-spacing-0">

          {/* HEADER */}
          <thead>
            <tr>
              <th className=""></th>

              <th className="p-4 text-secondary font-bold text-center text-base lg:text-lg xl:text-2xl border-t-2 border-l-2 border-r-2 border-dashed border-primary/60 rounded-t-2xl">
                Hedgium
              </th>

              <th className="p-4 font-bold text-base-content text-base lg:text-lg xl:text-2xl">
                Mutual Funds & PMS
              </th>

              <th className="p-4 font-bold text-base-content text-base lg:text-lg xl:text-2xl">
                AIF
              </th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {COMPARISON_ROWS.map((row, i) => {

              const isLast = i === COMPARISON_ROWS.length - 1;

              return (
                <tr key={row.category} className="border-b border-base-300">

                  {/* LEFT CATEGORY BUTTON */}
                  <td className="py-3 px-2 md:px-4">
                    <div className="inline-flex items-center">
                      <span
                        className="inline-flex items-center justify-center w-[160px] min-w-[160px] lg:w-[240px] lg:min-w-[240px] xl:w-[240px] xl:min-w-[240px] text-white text-sm lg:text-base xl:text-lg 2xl:text-xl font-semibold px-0 py-2 rounded-l-lg bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: 'url(/images/home/button_bg.png)' }}
                      >
                        {row.category}
                      </span>

                    </div>
                  </td>

                  {/* HEDGIUM COLUMN */}
                  <td
                    className={`p-4 text-sm lg:text-base xl:text-lg text-base-content/90 min-w-[180px]
                    border-l-2 border-r-2 border-dashed border-primary/60
                    ${isLast ? "border-b-2 rounded-b-2xl" : ""}`}
                  >
                    {row.hedgium}
                  </td>

                  {/* MUTUAL FUNDS */}
                  <td className="p-4 text-sm lg:text-base xl:text-lg text-base-content/80 min-w-[180px]">
                    {row.mutualFundsPms}
                  </td>

                  {/* AIF */}
                  <td className="p-4 text-sm lg:text-base xl:text-lg text-base-content/80 min-w-[180px]">
                    {row.aif}
                  </td>

                </tr>
              );
            })}
          </tbody>

        </table>
      </div>
    </div>
    </div>
    </section>
  );
}
