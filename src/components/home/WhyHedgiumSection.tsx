'use client';

import { useState } from 'react';
import { Lock, AlertTriangle, Shield, Check } from 'lucide-react';

import PerformanceSection from './PerformanceSection';
import ComparisonTable from './ComparisonTable';

const WHY_HEDGIUM_TABS = [
  {
    id: 'market',
    label: 'Market Tested Strategies',
    content: (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 p-0 lg:p-4">

          <ul className="list-disc list-inside flex flex-col gap-4">
            <li className="text-base lg:text-lg xl:text-xl text-base-content/80">
              Developed, optimized &amp; operational since last 5 years
            </li>
            <li className="text-base lg:text-lg xl:text-xl text-base-content/80">
              Tested in live, diverse market conditions including periods of high
              volatility, with built-in downside protections
            </li>
            <li className="text-base lg:text-lg xl:text-xl text-base-content/80">
              Adaptable to different risk-appetites. Focused on better risk-adjusted
              returns
            </li>
            <li className="text-base lg:text-lg xl:text-xl text-base-content/80">
              Suited for various capital sizes — From 25 Lakh to 25 Crore+
            </li>
          </ul>
        </div>
      </div>
    ),
  },

  {
    id: 'risk',
    label: 'Real-time Risk Management',
    content: (
      <div className="flex flex-col gap-3">
        {/* Headers – hidden on mobile, shown on lg+ */}
        <div className="hidden lg:grid grid-cols-[35fr_65fr] gap-4">
          <div className="flex items-center gap-2 font-bold text-base lg:text-lg xl:text-xl text-base-content border-b border-base-300 pb-2">
            <AlertTriangle className="size-5 xl:size-6 shrink-0 text-warning" /> RISKS
          </div>
          <div className="flex items-center gap-2 font-bold text-base lg:text-lg xl:text-xl text-base-content border-b border-base-300 pb-2">
            <Shield className="size-5 xl:size-6 shrink-0 text-primary" /> MITIGATION
          </div>
        </div>
  
        {[
          {
            risk: 'LIQUIDITY RISK',
            mitigation: 'Trade Entry checks for liquidity conditions. Real-time monitoring of liquidity and proactive adjustment',
          },
          {
            risk: 'EXECUTION RISK',
            mitigation: 'Timely triggered adjustments basis pre-defined parameters. Dedicated Trade execution logic & margin management Engine',
          },
          { risk: 'TAIL EVENT RISK', mitigation: 'Built-in protection hedges for all strategies' },
          {
            risk: 'ACCESS RISK',
            mitigation: 'Cloud based deployment. System monitored access and alerts',
          },
          { risk: 'Unidentified Risk', mitigation: 'Manual real-time monitoring personnel. Live Support' },
        ].map(({ risk, mitigation }) => (
          <div
            key={risk}
            className="grid grid-cols-1 lg:grid-cols-[35fr_65fr] gap-2 lg:gap-4 items-start border-b border-base-300/50 py-2 last:border-0"
          >
            {/* Risk row – now with responsive layout */}
            <p className="text-base lg:text-lg xl:text-xl font-bold text-base-content flex items-center gap-1 px-0 lg:px-2 py-1">
              <span className="hidden lg:inline text-primary mr-1">→</span> 
              <span>{risk}</span>
            </p>
            <p className="text-base lg:text-lg xl:text-xl text-primary lg:pl-0 pl-2">
              {mitigation}
            </p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'security',
    label: 'Secure by Design',
    content: (
      <div className="relative bg-base-100/50 min-h-[300px] md:min-h-[320px] flex items-center justify-center overflow-hidden pt-6">
        {/* Arrow SVG – responsive, points from cards to lock */}

        {/* Central Lock */}
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-base-100 border-2 border-accent/30 flex items-center justify-center text-primary shadow-md z-10">
            <Lock className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10" strokeWidth={2} />
          </div>
        </div>

        {/* Four cards positioned around the lock */}
        <div className="relative grid grid-cols-2 gap-3 md:gap-4 lg:gap-6 mx-auto z-10">
          {/* Top‑left card */}
          <div className="bg-base-100 p-3 md:p-4 rounded-xl border border-accent/60 border-dashed shadow-sm text-left relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-accent hidden lg:flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-primary-content" strokeWidth={2.5} />
            </div>
            <p className="text-sm font-semibold md:text-lg xl:text-xl text-base-content/90 leading-snug pt-1">
              All trade logs, reports, dashboards are available to the client on real-time basis
            </p>
          </div>
          {/* Top‑right card */}
          <div className="bg-base-100 p-3 md:p-4 rounded-xl border border-accent/60 border-dashed shadow-sm text-right relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-accent hidden lg:flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-primary-content" strokeWidth={2.5} />
            </div>
            <p className="text-sm font-semibold md:text-lg xl:text-xl text-base-content/90 leading-snug pt-1">
              Funds &amp; securities always stay in client&apos;s account under their exclusive access and control.
            </p>
          </div>
          {/* Bottom‑left card */}
          <div className="bg-base-100 p-3 md:p-4 rounded-xl border border-accent/60 border-dashed shadow-sm text-left relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-accent hidden lg:flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-primary-content" strokeWidth={2.5} />
            </div>
            <p className="text-sm font-semibold md:text-lg xl:text-xl text-base-content/90 leading-snug pt-1">
              All strategies are approve / pre-approved by the client
              and trade execution control is always with the client
            </p>
          </div>
          {/* Bottom‑right card */}
          <div className="bg-base-100 p-3 md:p-4 rounded-xl border border-accent/60 border-dashed shadow-sm text-right relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-accent hidden lg:flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-primary-content" strokeWidth={2.5} />
            </div>
            <p className="text-sm font-semibold md:text-lg xl:text-xl text-base-content/90 leading-snug pt-1">
              System access is encrypted, client-controlled, and revocable any time
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
      <div className="flex max-w-xl mx-auto flex-col items-center gap-6 py-4">
        <p className="text-base lg:text-lg xl:text-xl font-semibold text-base-content text-center">
          Hedgium Support is always available &amp; reachable during market &amp; off-market hours
        </p>
        <div className="flex items-center justify-center gap-4 md:gap-8">
          <div className="flex flex-col items-center text-center gap-2">
            <img src="/images/home/message.png" alt="Live Chat" className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 object-contain" />
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <img src="/images/home/call.png" alt="Dedicated Support" className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 object-contain" />
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <img src="/images/home/mail.png" alt="Email" className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 object-contain" />
          </div>
        </div>
      </div>
    ),
  },
] as const;

export default function WhyHedgiumSection() {
  const [activeTab, setActiveTab] = useState(0);

  return (

    <>
    <section id="why-hedgium" className="py-16 md:py-24 bg-base-200">
      <div className="max-w-8xl mx-auto px-4 lg:px-8">
        <h2
          className="text-2xl md:text-3xl lg:text-4xl xl:text-4xl 2xl:text-5xl font-bold text-base-content mb-8 md:mb-10 lg:mb-12 xl:mb-14 2xl:mb-16"
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
              className="border-2 border-base-300 rounded-3xl p-4 p-6 md:p-6 bg-base-100 overflow-hidden"
            >
              <h3 className="font-bold text-lg xl:text-xl text-primary mb-4 pb-2 border-b border-base-300">
                {tab.label}
              </h3>
              {tab.content}
            </div>
          ))}
        </div>

        
        {/* Desktop: tabs + content */}
<div className="hidden lg:flex flex-row items-center min-h-[520px]">
  
  {/* Left column – centered like Unlock section */}
  <div className="lg:w-[40%] w-full flex flex-col gap-10 justify-center">
    {WHY_HEDGIUM_TABS.map((tab, i) => {
      const isActive = activeTab === i;
      return (
        <div key={tab.id} className="flex items-center">
          <img
            src="/images/logos/Hedgium icon cropped.png"
            alt=""
            aria-hidden
            className="shrink-0 w-10 h-10 md:w-12 md:h-12 object-contain"
          />

          <div className="flex-1 flex items-center">
            <div className="border-t border-dashed border-primary/50 w-4 shrink-0" />


        <button
  type="button"
  onClick={() => setActiveTab(i)}
  className={`flex-1 cursor-pointer rounded-xl text-left px-4 py-3 font-bold text-lg xl:text-2xl transition-all duration-200 active:scale-[0.97]
    ${
      isActive
        ? `
          bg-primary 
          text-primary-content 
          shadow-md
          ring-1 ring-primary/40
        `
        : `
          bg-primary/10 
          text-base-content/70
          hover:bg-primary/30 
          hover:text-primary-content
          hover:shadow-sm
        `
    }
  `}
>
  {tab.label}
</button>

            <div
              className={`border-t-2 border-dashed border-primary/50 w-12 shrink-0 transition-opacity ${
                isActive ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
        </div>
      );
    })}
  </div>

  {/* Right column – SAME height + centered content */}
  <div className="lg:w-[60%] w-full">
    <div
      className="border-2 border-base-300 rounded-3xl bg-base-100
                 h-[520px] flex items-center justify-center"
    >
      <div className="w-full p-4">
        {WHY_HEDGIUM_TABS[activeTab].content}
      </div>
    </div>
  </div>
</div>


        {/* Comparison Table */}

       

      </div>
    </section>


    <PerformanceSection />

    <ComparisonTable />



    </>
  );
}