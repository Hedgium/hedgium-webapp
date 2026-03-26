import Link from "next/link";

export default function SandboxSection() {
  return (
    <section id="sandbox" className="py-12 md:py-24 bg-base-100">
      <div className="max-w-8xl mx-auto px-4 lg:px-8">
        {/* PPT-style header: title + subtitle left | dashed connector + button right (same row on lg) */}
        <div
          className="flex flex-col justify-between lg:flex-row lg:items-start lg:gap-0 mb-8"
          data-aos="fade-up"
          data-aos-duration="650"
          data-aos-once="true"
        >
          <div className="md:max-w-[70%] shrink-0">
            
            <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-4xl font-bold text-base-content leading-tight">
              Try without commitments:{" "}
              <span className="text-accent">Sandbox-mode!</span>
            </h2>
            <p className="text-secondary text-base md:text-lg text-base-content/75 my-2 mb-4 leading-relaxed">
              Log-in and observe your personalized simulated P&amp;L based on
              Hedgium&apos;s strategies applied to your notional capital in
              real-time
            </p>
          </div>

          <div className="hidden md:block">
          <Link
              href="/get-started"
              className="btn btn-primary btn-md lg:btn-lg whitespace-nowrap shrink-0 w-full sm:w-auto lg:w-auto"
            >
              Take me to Sandbox mode
          </Link> 
          </div>

 
           
        </div>

        {/* Illustration card */}
        <div
          className="relative border-2  border-dashed border-primary/45 rounded-xl p-4 md:p-8 mt-2"
          data-aos="zoom-in"
          data-aos-duration="700"
          data-aos-delay="100"
          data-aos-once="true"
        >
          <div className="absolute -top-4 right-2 md:-top-4 md:right-4">
            <span className="bg-accent text-primary-content text-xs md:text-sm font-bold px-2 py-1 rounded uppercase tracking-wide">
              * ILLUSTRATION ONLY
            </span>
          </div>

          {/* Two columns only on lg — do not insert a third grid child or P&L wraps below */}

          <div className="text-base-content/75 leading-relaxed">
                <p className="text-sm md:text-base text-primary font-semibold">Name: Mr. Ashok Dinda</p>
                <p className="text-sm md:text-base text-primary font-medium">Client id: 1002</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[40%_60%] lg:items-start gap-8 lg:gap-10 pt-6 lg:pt-2">
            {/* Left: Home — graph centered with room */}
            <div className=" flex flex-col gap-4 min-w-0 lg:pr-6 xl:pr-8">
              
              <p className="text-sm md:text-base font-bold text-center tracking-[0.2em] text-base-content/55 uppercase border-b border-base-300 pb-2">
                Home
              </p>
              <p className="text-sm md:text-base text-base-content/65">
                Starting Notional Capital: 50,00,000
              </p>

              {/* Bar chart: full width of column, bars spaced like PPT */}
              <div className="w-full flex justify-center px-2 sm:px-4">
                <div className="flex items-end justify-center gap-10 sm:gap-16 md:gap-20 h-40 sm:h-44 w-full max-w-md border-l border-b border-base-300 pl-4 pb-2">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-sm md:text-base text-primary font-semibold">
                      +45,700
                    </span>
                    <div
                      className="w-14 sm:w-16 md:w-[4.5rem] bg-primary/75 rounded-t-md flex items-end justify-center pb-2 min-h-[4.5rem]"
                      style={{ height: "5.5rem" }}
                    >
                      <span className="text-primary-content text-sm md:text-base font-bold">
                        0.91%
                      </span>
                    </div>
                    <span className="text-sm md:text-base text-base-content/60">
                      Q4&apos;26
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-sm md:text-base text-primary font-semibold">
                      +61,500
                    </span>
                    <div
                      className="w-14 sm:w-16 md:w-[4.5rem] bg-primary rounded-t-md flex items-end justify-center pb-2 min-h-[5.5rem]"
                      style={{ height: "7rem" }}
                    >
                      <span className="text-primary-content text-sm md:text-base font-bold">
                        1.22%
                      </span>
                    </div>
                    <span className="text-sm md:text-base text-base-content/60">
                      Q1&apos; 27
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-sm md:text-base text-base-content/65 space-y-0.5">
                <p>#Strategies executed: 7</p>
                <p>#Total PnL: 1,25,000/-</p>
              </div>
            </div>

            {/* Right: Current month P&L — same row as Home (border replaces extra grid cell) */}
            <div className="flex flex-col gap-3 min-w-0 lg:pl-8 xl:pl-10 lg:pr-6 xl:pr-8">
              <p className="text-sm md:text-base font-bold tracking-[0.2em] text-base-content/55 uppercase text-center border-b border-base-300 pb-2"
              >
                Current Month P&amp;L
              </p>

              <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm md:text-base font-bold text-base-content">
                <span>
                  TOTAL P&amp;L:{" "}
                  <span className="text-primary">+35,965</span>
                </span>
                <span>
                  M2M: <span className="text-primary">+15,700</span>
                </span>
                <span>
                  Realized: <span className="text-primary">+20,265</span>
                </span>
              </div>


              <div className="relative w-full  mx-auto">
  {/* Back card 2 */}
  <div className="absolute top-0 left-0 right-0 h-full bg-base-200/80 rounded-xl translate-y-1.5 translate-x-1.5" />

  {/* Back card 1 */}

  <div className="relative rounded-xl bg-base-200 border border-base-300 p-3 sm:p-4 text-sm md:text-base flex flex-col gap-2">

              
<p className="text-base-content/85">Strategy Name:- BSE Spread</p>
<p className="text-base-content/85">Strategy Id: #243</p>
<p className="text-base-content/85">
  P&amp;L: +35,965 &nbsp;&nbsp; M2M: +15,700 &nbsp;&nbsp;
  Realized: +20,265
</p>
<p className="font-semibold text-base-content mt-1">
  Current Legs (4):-
</p>
<table className="w-full text-sm md:text-base text-base-content/80">
  <tbody>
    {[
      ["1.", "BSE 30 MAR 2500 PE", "SELL", "3750", "30.05", "+35,800"],
      ["2.", "BSE 28 APR 2550 PE", "BUY", "3750", "159.85", "-12,100"],
      ["3.", "BSE 30 MAR 2800 CE", "SELL", "3750", "98.05", "-13,540"],
      ["4.", "BSE 28 APR 2900 CE", "BUY", "3750", "278.30", "+5,540"],
    ].map(([n, inst, side, qty, px, pnl]) => (
      <tr key={n}>
        <td className="pr-1 py-0.5 text-base-content/50">{n}</td>
        <td className="pr-2 py-0.5">{inst}</td>
        <td className="pr-2 py-0.5 font-semibold">{side}</td>
        <td className="pr-2 py-0.5">{qty}</td>
        <td className="pr-2 py-0.5">{px}</td>
        <td
          className={`py-0.5 font-semibold ${
            pnl.startsWith("+") ? "text-success" : "text-error"
          }`}
        >
          {pnl}
        </td>
      </tr>
    ))}
  </tbody>
</table>
<p className="text-primary/80 text-sm md:text-base mt-1 cursor-pointer hover:underline">
  Closed Legs (6) [click to see more]
</p>
</div>


</div>
             
            </div>
          </div>
        </div>


        <Link
              href="/get-started"
              className="btn md:hidden btn-primary btn-md my-4 whitespace-nowrap shrink-0 w-full sm:w-auto lg:w-auto"
            >
              Take me to Sandbox mode
          </Link> 

      </div>
    </section>
  );
}
