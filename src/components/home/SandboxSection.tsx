import Link from 'next/link';

export default function SandboxSection() {
  return (
    <section id="sandbox" className="py-12 md:py-24 px-4 lg:px-8 bg-base-100">
      <div className="max-w-6xl mx-auto">
        {/* Heading row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-3">
          <div
            data-aos="fade-up"
            data-aos-duration="650"
            data-aos-once="true"
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-base-content">
              Try without commitments:{' '}
              <span className="text-primary">Sandbox-mode!</span>
            </h2>
            <p className="text-sm lg:text-base text-primary mt-1">
              Log-in and observe your personalized simulated P&amp;L based on Hedgium&apos;s strategies applied to your notional capital in real-time
            </p>
          </div>
          <div
            className="flex items-center gap-3 shrink-0"
            data-aos="fade-up"
            data-aos-duration="650"
            data-aos-delay="80"
            data-aos-once="true"
          >
            <div className="hidden sm:block border-t border-dashed border-primary/50 w-12" aria-hidden />
            <Link href="/get-started" className="btn btn-primary whitespace-nowrap">
              Take me there
            </Link>
          </div>
        </div>

        {/* Illustration card */}
        <div
          className="relative border border-dashed border-2 border-primary/50 rounded-xl p-4 md:p-6 mt-6"
          data-aos="zoom-in"
          data-aos-duration="700"
          data-aos-delay="100"
          data-aos-once="true"
        >
          <div className="absolute top-2 right-2">
            <span className="bg-primary/70 text-primary-content text-xs font-bold px-2 py-1 rounded">
              * ILLUSTRATION ONLY
            </span>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 pt-4">
            {/* Left: Dashboard */}
            <div className="lg:w-[45%] flex flex-col gap-3">
              <div>
                <p className="text-sm text-primary">Name: Mr. Ashok Dinda</p>
                <p className="text-sm text-primary">Client id: 1002</p>
              </div>
              <p className="text-xs font-bold text-center tracking-widest text-base-content/60 uppercase border-b border-base-300 pb-1">Dashboard</p>
              <p className="text-xs text-base-content/60">Starting Notional Capital: 50,00,000</p>

              <div className="flex items-end gap-6 h-28 pl-4 border-l border-b border-base-300 mt-1">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-primary font-semibold">+45,700</span>
                  <div className="w-16 bg-primary/70 rounded-t-md flex items-end justify-center pb-2" style={{ height: '70px' }}>
                    <span className="text-white text-xs font-bold">0.91%</span>
                  </div>
                  <span className="text-xs text-base-content/60">Q4&apos;26</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-primary font-semibold">+61,500</span>
                  <div className="w-16 bg-primary rounded-t-md flex items-end justify-center pb-2" style={{ height: '90px' }}>
                    <span className="text-white text-xs font-bold">1.22%</span>
                  </div>
                  <span className="text-xs text-base-content/60">Q1&apos; 27</span>
                </div>
              </div>

              <div className="text-xs text-base-content/60 mt-1">
                <p>#Strategies executed: 7</p>
                <p>#Total PnL: 1,25,000/-</p>
              </div>
            </div>

            <div className="hidden lg:block w-px bg-base-300" aria-hidden />

            {/* Right: Current month P&L */}
            <div className="lg:w-[55%] flex flex-col gap-3">
              <p className="text-xs font-bold tracking-widest text-base-content/60 uppercase border-b border-base-300 pb-1">Current Month P&amp;L</p>

              <div className="flex flex-wrap gap-4 text-sm font-bold text-base-content">
                <span>TOTAL P&amp;L: <span className="text-primary">+35,965</span></span>
                <span>M2M: <span className="text-primary">+15,700</span></span>
                <span>Realized: <span className="text-primary">+20,265</span></span>
              </div>

              <div className="rounded-lg bg-primary/10 p-3 text-xs flex flex-col gap-2">
                <p className="text-base-content/80">Strategy Name:- BSE Spread</p>
                <p className="text-base-content/80">Strategy Id: #243</p>
                <p className="text-base-content/80">P&amp;L: +35,965 &nbsp;&nbsp; M2M: +15,700 &nbsp;&nbsp; Realized: +20,265</p>
                <p className="font-semibold text-base-content mt-1">Current Legs (4):-</p>
                <table className="w-full text-xs text-base-content/80">
                  <tbody>
                    {[
                      ['1.', 'BSE 30 MAR 2500 PE', 'SELL', '3750', '30.05', '+35,800'],
                      ['2.', 'BSE 28 APR 2550 PE', 'BUY', '3750', '159.85', '-12,100'],
                      ['3.', 'BSE 30 MAR 2800 CE', 'SELL', '3750', '98.05', '-13,540'],
                      ['4.', 'BSE 28 APR 2900 CE', 'BUY', '3750', '278.30', '+5,540'],
                    ].map(([n, inst, side, qty, px, pnl]) => (
                      <tr key={n}>
                        <td className="pr-1 py-0.5 text-base-content/50">{n}</td>
                        <td className="pr-2 py-0.5">{inst}</td>
                        <td className="pr-2 py-0.5 font-semibold">{side}</td>
                        <td className="pr-2 py-0.5">{qty}</td>
                        <td className="pr-2 py-0.5">{px}</td>
                        <td className={`py-0.5 font-semibold ${pnl.startsWith('+') ? 'text-success' : 'text-error'}`}>{pnl}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-primary/80 text-xs mt-1 cursor-pointer hover:underline">Closed Legs (6) [click to see more]</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
