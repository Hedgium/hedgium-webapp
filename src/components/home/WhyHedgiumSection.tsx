'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';



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
      'Heavily relies on stock picking. Poor performance of a few stocks can significantly hurt overall returns',
    aif: 'Same as Mutual Funds & PMS',
  },
] as const;

function ComparisonTable() {
  return (
    <div
      className="mt-16 lg:mt-20"
      data-aos="fade-up"
      data-aos-duration="650"
      data-aos-once="true"
    >
      <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-base-content mb-2">
        Think beyond Mutual Funds, PMS, AIF –
      </h3>

      <p className="text-base lg:text-lg text-primary mb-6">
        Take back control, gain liquidity, reduce costs & improve tax efficiency
      </p>

      <div className="overflow-x-auto bg-base-100">
        <table className="w-full min-w-[560px] text-left border-separate border-spacing-0">

          {/* HEADER */}
          <thead>
            <tr>
              <th className="w-[170px]"></th>

              <th className="p-4 font-bold text-center border-t-2 border-l-2 border-r-2 border-dashed border-primary/60 rounded-t-2xl">
                Hedgium
              </th>

              <th className="p-4 font-bold text-base-content">
                Mutual Funds & PMS
              </th>

              <th className="p-4 font-bold text-base-content">
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
                  <td className="py-3 px-2 md:px-3">
                    <div className="inline-flex items-center">
                      <span className="bg-primary text-primary-content text-sm lg:text-base font-semibold px-4 py-2 rounded-l-lg">
                        {row.category}
                      </span>

                      <span className="w-0 h-0 border-t-[16px] border-b-[16px] border-l-[16px] border-t-transparent border-b-transparent border-l-primary"></span>
                    </div>
                  </td>

                  {/* HEDGIUM COLUMN */}
                  <td
                    className={`p-4 text-sm lg:text-base text-base-content/90 
                    border-l-2 border-r-2 border-dashed border-primary/60
                    ${isLast ? "border-b-2 rounded-b-2xl" : ""}`}
                  >
                    {row.hedgium}
                  </td>

                  {/* MUTUAL FUNDS */}
                  <td className="p-4 text-sm lg:text-base text-base-content/80">
                    {row.mutualFundsPms}
                  </td>

                  {/* AIF */}
                  <td className="p-4 text-sm lg:text-base text-base-content/80">
                    {row.aif}
                  </td>

                </tr>
              );
            })}
          </tbody>

        </table>
      </div>
    </div>
  );
}


const WHY_HEDGIUM_TABS = [
  {
    id: 'market',
    label: 'Market Tested Strategies',
    content: (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <p className="text-base lg:text-lg font-semibold text-base-content">
            Developed, optimized &amp; operational since last 5 years
          </p>
          <div className="flex flex-col gap-3">
            <p className="text-base lg:text-lg text-base-content/80">
              Tested in live, diverse market conditions including periods of high
              volatility, with built-in downside protections
            </p>
            <p className="text-base lg:text-lg text-base-content/80">
              Adaptable to different risk-appetites. Focused on better risk-adjusted
              returns
            </p>
            <p className="text-base lg:text-lg text-base-content/80">
              Suited for various capital sizes — From 25 Lakh to 20 Crore
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'risk',
    label: 'Real-time Risk Management',
    content: (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 font-bold text-base lg:text-lg text-base-content border-b border-base-300 pb-2">
            <span className="text-warning text-lg">⚠</span> RISKS
          </div>
          <div className="flex items-center gap-2 font-bold text-base lg:text-lg text-base-content border-b border-base-300 pb-2">
            <span className="text-primary text-lg">🛡</span> MITIGATION
          </div>
        </div>
        {[
          {
            risk: 'LIQUIDITY / SLIPPAGE RISK',
            mitigation:
              'Trade Entry checks for liquidity conditions. Real-time monitoring of liquidity and proactive adjustment',
          },
          {
            risk: 'EXECUTION RISK',
            mitigation:
              'Timely triggered adjustments basis pre-defined parameters. Dedicated Trade execution logic & margin management Engine',
          },
          { risk: 'TAIL EVENT RISK', mitigation: 'Built-in protection hedges for all strategies' },
          {
            risk: 'ACCESS RISK',
            mitigation: 'Cloud based deployment. System monitored access and alerts',
          },
          { risk: 'UNKNOWN RISK', mitigation: 'Manual real-time monitoring personnel. Live Support' },
        ].map(({ risk, mitigation }) => (
          <div
            key={risk}
            className="grid grid-cols-2 gap-4 items-start border-b border-base-300/50 py-2 last:border-0"
          >
            <p className="text-base lg:text-lg font-bold text-base-content flex items-center gap-1 px-2 py-1">
              <span className="text-primary mr-1">→</span> {risk}
            </p>
            <p className="text-base lg:text-lg text-primary">{mitigation}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'security',
    label: 'Security in Design',
    content: (
      <div className="relative bg-base-100/50 min-h-[300px] md:min-h-[320px] flex items-center justify-center overflow-hidden">
        {/* Arrow SVG – responsive, points from cards to lock */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none text-primary/30"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <defs>
            <marker
              id="sec-arrow"
              markerWidth="6"
              markerHeight="4"
              refX="5"
              refY="2"
              orient="auto"
            >
              <path d="M0 0 L6 2 L0 4 Z" fill="currentColor" />
            </marker>
          </defs>
          <g stroke="currentColor" strokeWidth="1.2" fill="none">
            {/* Arrows from card positions (roughly) to center (50,50) */}
            <line x1="22" y1="22" x2="46" y2="46" markerEnd="url(#sec-arrow)" />
            <line x1="78" y1="22" x2="54" y2="46" markerEnd="url(#sec-arrow)" />
            <line x1="78" y1="78" x2="54" y2="54" markerEnd="url(#sec-arrow)" />
            <line x1="22" y1="78" x2="46" y2="54" markerEnd="url(#sec-arrow)" />
          </g>
        </svg>

        {/* Central Lock */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-base-100 border-2 border-primary/30 flex items-center justify-center text-primary shadow-md z-10">
            <Lock className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10" strokeWidth={2} />
          </div>
        </div>

        {/* Four cards positioned around the lock */}
        <div className="relative grid grid-cols-2 gap-3 md:gap-4 lg:gap-6 max-w-2xl mx-auto z-10">
          {/* Top‑left card */}
          <div className="bg-base-100 p-3 md:p-4 rounded-lg border border-primary/20 shadow-sm text-left">
            <p className="text-base md:text-lg text-base-content/90 leading-snug">
              <span className="font-semibold text-primary">All trade logs, reports, dashboards</span>{' '}
              are available to the client on real-time basis
            </p>
          </div>
          {/* Top‑right card */}
          <div className="bg-base-100 p-3 md:p-4 rounded-lg border border-primary/20 shadow-sm text-right">
            <p className="text-base md:text-lg text-base-content/90 leading-snug">
              <span className="font-semibold text-primary">
                Funds &amp; securities always stay in client&apos;s account
              </span>{' '}
              under their exclusive access and control at all times
            </p>
          </div>
          {/* Bottom‑left card */}
          <div className="bg-base-100 p-3 md:p-4 rounded-lg border border-primary/20 shadow-sm text-left">
            <p className="text-base md:text-lg text-base-content/90 leading-snug">
              <span className="font-semibold text-primary">
                All strategies are approved / pre-approved by the client
              </span>
              , and trade execution control is always with the client
            </p>
          </div>
          {/* Bottom‑right card */}
          <div className="bg-base-100 p-3 md:p-4 rounded-lg border border-primary/20 shadow-sm text-right">
            <p className="text-base md:text-lg text-base-content/90 leading-snug">
              <span className="font-semibold text-primary">
                System access is encrypted, client-controlled, and revocable any time
              </span>
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'support',
    label: 'Live Support & Access',
    content: (
      <div className="flex flex-col items-center gap-6 py-4">
        <p className="text-base lg:text-lg font-semibold text-base-content text-center">
          Hedgium Support is always available &amp; reachable during market &amp; off-market hours
        </p>
        <div className="flex items-start justify-center gap-6 md:gap-10">
          <div className="flex flex-col items-center text-center gap-2 text-primary">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 lg:w-14 lg:h-14">
              <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" />
            </svg>
            <span className="text-base lg:text-lg text-base-content/70">Live Chat</span>
          </div>
          <div className="flex flex-col items-center text-center gap-2 text-primary">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 lg:w-14 lg:h-14">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
            </svg>
            <span className="text-base lg:text-lg text-base-content/70">Dedicated Support</span>
          </div>
          <div className="flex flex-col items-center text-center gap-2 text-primary">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 md:w-10 md:h-10 lg:w-14 lg:h-14">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            <span className="text-base lg:text-lg text-base-content/70">Email</span>
          </div>
        </div>
      </div>
    ),
  },
] as const;

export default function WhyHedgiumSection() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section id="why-hedgium" className="py-16 md:py-24 px-4 md:px-8 bg-base-200">
      <div className="max-w-6xl mx-auto">
        <h2
          className="text-2xl md:text-3xl lg:text-4xl font-bold text-base-content mb-8 md:mb-10"
          data-aos="fade-up"
          data-aos-duration="650"
          data-aos-once="true"
        >
          What makes <span className="text-primary">Hedgium</span> different?
        </h2>

        {/* Mobile: stacked layout – each tab as a block */}
        <div
          className="flex flex-col gap-4 lg:hidden"
          data-aos="fade-up"
          data-aos-duration="650"
          data-aos-once="true"
        >
          {WHY_HEDGIUM_TABS.map((tab) => (
            <div
              key={tab.id}
              className="border-2 border-base-300 rounded-3xl p-5 md:p-6 bg-base-100 overflow-hidden"
            >
              <h3 className="font-bold text-lg text-primary mb-4 pb-2 border-b border-base-300">
                {tab.label}
              </h3>
              {tab.content}
            </div>
          ))}
        </div>

        {/* Desktop: tabs + content */}
        <div className="hidden lg:flex flex-row gap-0 items-start">
          {/* Left column – tab buttons */}
          <div
            className="lg:w-[40%] w-full flex flex-col gap-3 md:gap-4"
            data-aos="fade-up"
            data-aos-duration="650"
            data-aos-once="true"
          >
            {WHY_HEDGIUM_TABS.map((tab, i) => {
              const isActive = activeTab === i;
              return (
                <div key={tab.id} className="flex items-center">
                  <img
                    src="/images/logos/Hedgium icon cropped.png"
                    alt=""
                    aria-hidden
                    className="shrink-0 w-7 h-7 md:w-9 md:h-9 object-contain"
                  />
                  <div className="flex-1 flex items-center">
                    <div className="border-t border-dashed border-primary/50 w-3 md:w-4 shrink-0" />
                    <button
                      type="button"
                      onClick={() => setActiveTab(i)}
                      className={`flex-1 cursor-pointer text-left px-3 md:px-4 py-3 md:py-2.5 font-bold text-base md:text-lg rounded transition-all active:scale-[0.98] ${
                        isActive
                          ? 'bg-primary text-primary-content shadow'
                          : 'bg-primary/25 text-base-content hover:bg-primary/35'
                      }`}
                    >
                      {tab.label}
                    </button>
                    <div
                      className={`border-t-2 border-dashed border-primary/50 md:w-12 shrink-0 transition-opacity ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right column – dynamic content */}
          <div
            className="lg:w-[60%] w-full"
            data-aos="fade-up"
            data-aos-duration="650"
            data-aos-delay="100"
            data-aos-once="true"
          >
            <div className="border-2 border-base-300 rounded-3xl p-5 md:p-6 lg:p-8 bg-base-100 min-h-[220px]">
              {WHY_HEDGIUM_TABS[activeTab].content}
            </div>
          </div>
        </div>

        {/* Comparison Table */}

        <ComparisonTable />

      </div>
    </section>
  );
}