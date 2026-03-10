'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Bot, TrendingUp, Code, Smartphone, Shield, Users, CheckCircle, Check, X, ChevronDown, Calendar, Sigma, Network, Brain } from 'lucide-react';
import Link from 'next/link';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const WHAT_WE_DO_SLIDES = [
  {
    id: "twin-engine",
    content: (
      <div className="flex flex-col h-full gap-4">
        <div className="flex-1 min-h-0 rounded-xl border border-base-300 bg-base-100 p-4 flex flex-col justify-end">
          <div className="flex gap-2 items-end h-24">
            <div className="flex-1 rounded-t bg-primary/80 h-12" title="Engine-1: Model Portfolio" />
            <div className="flex-1 rounded-t bg-primary/60 h-16" />
            <div className="flex-1 rounded-t bg-primary/80 h-14" />
            <div className="flex-1 rounded-t bg-primary/60 h-20" />
            <div className="flex-1 rounded-t bg-primary/80 h-16" />
          </div>
          <div className="flex justify-between mt-2 text-xs text-base-content/70">
            <span>Engine-1: Hedgium Model Portfolio</span>
            <span>Engine-2: Options income</span>
          </div>
        </div>
        <p className="font-semibold text-base-content text-sm shrink-0">Outperform benchmark returns</p>
      </div>
    ),
  },
  {
    id: "features",
    content: (
      <div className="flex flex-col gap-4 h-full justify-center p-2">
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Sigma className="w-5 h-5" />
          </div>
          <p className="text-sm text-base-content">Superior risk-adjusted returns using statistical arbitrage.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Network className="w-5 h-5" />
          </div>
          <p className="text-sm text-base-content">Algo-Driven: Real-time opportunity scanning & risk management.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Brain className="w-5 h-5" />
          </div>
          <p className="text-sm text-base-content">AI powered intelligence to keep tabs on market events.</p>
        </div>
      </div>
    ),
  },
  {
    id: "experience",
    content: (
      <div className="flex flex-col h-full gap-4">
        <div className="flex-1 min-h-0 bg-base-200 rounded-xl flex items-center justify-center text-base-content/50 text-sm">
          Photo placeholder
        </div>
        <div className="shrink-0 border border-base-300 rounded-lg px-4 py-3 bg-base-100">
          <p className="font-semibold text-base-content text-sm">2 decades of investing & trading experience</p>
        </div>
      </div>
    ),
  },
];

function WhatWeDoSection() {
  const [current, setCurrent] = useState(0);
  const total = WHAT_WE_DO_SLIDES.length;

  useEffect(() => {
    const t = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, 5000);
    return () => clearInterval(t);
  }, [total]);

  return (
    <section id="what-we-do" className="py-20 px-6 bg-base-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-stretch">
          {/* Left: Static content */}
          <div className="lg:w-1/2 flex flex-col justify-center order-2 lg:order-1">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-base-content leading-snug mb-5">
              Hedgium is a quant-driven research house focused on generating market-neutral alpha for clients using the powerful{' '}
              <span className="text-primary">Twin Engine Investing</span> framework.
            </h2>
            <ul className="text-sm lg:text-base text-base-content space-y-2 mb-4">
              <li><strong>Step-1:</strong> Build Model Portfolio</li>
              <li><strong>Step-2:</strong> Deploy quant-based statistical arbitrage strategies to generate additional portfolio income through options</li>
            </ul>
            <p className="text-sm lg:text-base text-base-content/80 mb-6">
              Combined, this approach generates superior risk-adjusted returns unrivalled by traditional strategies, boosting overall return on capital and potentially compounding over a multi-period horizon.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/onboarding"
                className="btn btn-primary gap-2 w-fit"
              >
                <Calendar className="w-4 h-4" aria-hidden />
                Set up a Free Call
              </Link>
              <Link href="/#features" className="text-sm text-primary hover:underline">
                Learn More
              </Link>
            </div>
          </div>
          {/* Right: Slider — matches height of left content on desktop */}
          <div className="lg:w-1/2 flex flex-col order-1 lg:order-2 min-h-[280px] lg:min-h-0">
            <div className="rounded-xl border border-base-300 bg-base-200/50 overflow-hidden flex flex-col flex-1 min-h-0">
              <div className="flex-1 min-h-0 p-4 md:p-6">
                {WHAT_WE_DO_SLIDES[current].content}
              </div>
              <div className="flex justify-center gap-2 pb-4 shrink-0">
                {WHAT_WE_DO_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Slide ${i + 1}`}
                    onClick={() => setCurrent(i)}
                    className={`h-2 rounded-sm transition-all ${
                      i === current ? "w-6 bg-primary" : "w-2 bg-base-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const UNLOCK_STEPS = [
  { label: 'The Gap', id: 'gap' },
  { label: 'The Opportunity', id: 'opportunity' },
  { label: 'The How', id: 'how' },
] as const;

function UnlockPotentialSection() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="unlock-potential">
      {/* Banner */}
      <div className="bg-primary text-primary-content py-7 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-snug">
            Unlock incremental Alpha,{' '}
            <span className="font-normal">by exploiting market inefficiencies, using Hedgium&apos;s platform</span>
          </h2>
        </div>
      </div>

      {/* Body — light gray background matching mockup */}
      <div className="bg-base-200 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-start">

            {/* Left: Step flow with full-width buttons and large triangle connectors */}
            <div className="lg:w-[38%] flex flex-col">
              {UNLOCK_STEPS.map((step, i) => {
                const isActive = activeStep === i;
                return (
                  <div key={step.id} className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => setActiveStep(i)}
                      className={`w-full cursor-pointer text-left px-4 py-3 font-bold text-base lg:text-lg flex items-center justify-between transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-content'
                          : 'bg-neutral/60 text-base-content'
                      }`}
                    >
                      <span>{step.label}</span>
                      <span aria-hidden className="font-bold">&gt;</span>
                    </button>
                    {i < UNLOCK_STEPS.length - 1 && (
                      /* Full-width downward triangle matching the mockup arrows */
                      <div
                        className="w-full h-8"
                        style={{
                          clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                          backgroundColor: isActive
                            ? 'oklch(0.72 0.15 264 / 0.55)'
                            : 'oklch(0.72 0.05 264 / 0.40)',
                        }}
                        aria-hidden
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right: Content inside a dashed border box */}
            <div className="lg:w-[62%] flex flex-col">
              <div className="border border-dashed border-primary/50 rounded-lg p-5 bg-base-200 min-h-[200px]">
                {activeStep === 0 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-base lg:text-lg text-base-content">Most Portfolios are -</h3>
                    <ul className="space-y-2 text-sm lg:text-base">
                      {[
                        'Long Only (buy and hold)',
                        'Directionally exposed',
                        'Correlated with broader markets',
                        'Have nil/ underutilization of hedged derivatives',
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-primary shrink-0" aria-hidden />
                          <span className="text-primary font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm lg:text-base text-base-content">
                      <strong>Forgone opportunity:</strong> Non-directional options led returns which could generate additional income at the portfolio level
                    </p>
                  </div>
                )}
                {activeStep === 1 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-base lg:text-lg text-base-content">
                      Markets sometimes exhibit inefficiencies for a very short period, due to variety of factors -
                    </h3>
                    <ul className="space-y-2 text-sm lg:text-base">
                      {[
                        'Overreaction to news/ Behavioural inefficiencies',
                        'Volatility mispricing/ Volatility clustering',
                        'Forced expiry positioning',
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="w-3 h-3 rotate-45 bg-primary shrink-0" aria-hidden />
                          <span className="text-primary font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm lg:text-base text-base-content">
                      Thus, presenting the opportunity to take advantage of these in real-time to generate non-correlated additional returns
                    </p>
                  </div>
                )}
                {activeStep === 2 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-base lg:text-lg text-base-content">
                      By deploying quantitative, high-frequency, non-directional statistical arbitrage strategies that -
                    </h3>
                    <ul className="space-y-2 text-sm lg:text-base">
                      {[
                        'Capture and adapt to opportunities in real-time using our advanced algorithms',
                        'Are self-adjusting to evolving price levels',
                        'Are hedged to protect downside in case of any unanticipated wild movements',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <Check className="w-4 h-4 shrink-0 text-primary mt-0.5" aria-hidden />
                          <span className="text-base-content">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="border border-base-300 rounded p-3 bg-base-100 mt-2">
                      <p className="text-sm lg:text-base font-semibold text-base-content">
                        With the goal to boost portfolio risk-adjusted returns and outperform market benchmarks in a variety of conditions, irrespective of market direction
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

function PlaybooksSection() {
  return (
    <section id="playbooks" className="py-14 px-6 bg-base-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start">

          {/* Left: heading + two approach cards + Hedgium icon connector */}
          <div className="lg:w-1/2 flex flex-col gap-6">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-base-content">
              Playbooks adapted to{' '}
              <span className="text-primary">your goals</span>
            </h2>

            {/* Relative container for the two cards + icon */}
            <div className="relative flex flex-col gap-0">

              {/* Portfolio income approach */}
              <div className="flex flex-col gap-1 max-w-xs">
                <div className="bg-primary text-primary-content px-3 py-1.5 font-bold text-sm lg:text-base rounded-sm">
                  Portfolio income approach
                </div>
                <p className="text-sm lg:text-base font-bold text-base-content mt-1">Build top-up income</p>
                <p className="text-sm lg:text-base text-primary">
                  Investors with an existing portfolio, who desire incremental returns by leveraging portfolio value using statistical-arbitrage low-risk strategies
                </p>
              </div>

              {/* Hedgium icon connector — positioned to the right, vertically centered between cards */}
              <div
                className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-0"
                aria-hidden
              >
                {/* Dashed horizontal line from card to icon */}
                <div className="flex-1 border-t border-dashed border-primary/60 w-16" />
                {/* Hexagonal-style icon */}
                <div className="w-12 h-12 bg-primary rounded-[30%] flex items-center justify-center text-primary-content shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
              </div>

              {/* Spacer */}
              <div className="h-8" />

              {/* Total income approach — offset right to match layout */}
              <div className="flex flex-col gap-1 max-w-xs self-center">
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

          {/* Right: Photo placeholder */}
          <div className="lg:w-1/2 flex items-start justify-center">
            <div className="w-full aspect-[4/3] max-h-64 bg-primary/30 rounded-lg flex items-center justify-center text-base-content/50 text-sm">
              Photo placeholder
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

const WHY_HEDGIUM_TABS = [
  {
    id: 'market',
    label: 'Market Tested Strategies',
    content: (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <p className="text-sm lg:text-base font-semibold text-base-content">
            Developed, optimized &amp; operational since last 5 years
          </p>
          <div className="ml-4 flex flex-col gap-3">
            <p className="text-sm lg:text-base text-base-content/80">
              Tested in live, diverse market conditions including periods of high volatility, with built-in downside protections
            </p>
            <div className="ml-4 flex flex-col gap-3">
              <p className="text-sm lg:text-base text-base-content/80">Adaptable to different risk-appetites. Focused on better risk-adjusted returns
              </p>
              <div className="ml-4">
                <p className="text-sm lg:text-base text-base-content/80">Suited for various capital sizes — From 25 Lakh to 20 Crore
                </p>
              </div>
            </div>
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
          <div className="flex items-center gap-2 font-bold text-sm lg:text-base text-base-content border-b border-base-300 pb-2">
            <span className="text-warning text-lg">⚠</span> RISKS
          </div>
          <div className="flex items-center gap-2 font-bold text-sm lg:text-base text-base-content border-b border-base-300 pb-2">
            <span className="text-primary text-lg">🛡</span> MITIGATION
          </div>
        </div>
        {[
          {
            risk: 'LIQUIDITY / SLIPPAGE RISK',
            mitigation: 'Trade Entry checks for liquidity conditions. Real-time monitoring of liquidity and proactive adjustment',
          },
          {
            risk: 'EXECUTION RISK',
            mitigation: 'Timely triggered adjustments basis pre-defined parameters. Dedicated Trade execution logic & margin management Engine',
          },
          {
            risk: 'TAIL EVENT RISK',
            mitigation: 'Built-in protection hedges for all strategies',
          },
          {
            risk: 'ACCESS RISK',
            mitigation: 'Cloud based deployment. System monitored access and alerts',
          },
          {
            risk: 'UNKNOWN RISK',
            mitigation: 'Manual real-time monitoring personnel. Live Support',
          },
        ].map(({ risk, mitigation }) => (
          <div key={risk} className="grid grid-cols-2 gap-4 items-start border-b border-base-300/50 py-2 last:border-0">
            <p className="text-xs lg:text-sm font-bold text-base-content flex items-center gap-1 px-2 py-1">
              <span className="text-primary mr-1">→</span> {risk}
            </p>
            <p className="text-xs lg:text-sm text-primary">{mitigation}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'security',
    label: 'Security in Design',
    content: (
      <div className="grid grid-cols-3 gap-4 items-center text-base-content/90">
        {/* Top */}
        <div className="col-span-3 text-center text-xs lg:text-sm">
          Funds &amp; securities always stay in client&apos;s account under their exclusive access and control at all times
        </div>
        {/* Middle row */}
        <div className="text-xs lg:text-sm text-center">
          All trade logs, reports, dashboards are available to the client on real-time basis
        </div>
        <div className="flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl">
            🔒
          </div>
        </div>
        <div className="text-xs lg:text-sm text-center">
          System access is encrypted, client-controlled, and revocable any time
        </div>
        {/* Bottom */}
        <div className="col-span-3 text-center text-xs lg:text-sm">
          All strategies are approved / pre-approved by the client, and trade execution control is always with the client
        </div>
      </div>
    ),
  },
  {
    id: 'support',
    label: 'Live Support & Access',
    content: (
      <div className="flex flex-col items-center gap-6 py-4">
        <p className="text-sm lg:text-base font-semibold text-base-content text-center">
          Hedgium Support is always available &amp; reachable during market &amp; off-market hours
        </p>
        <div className="flex items-center justify-center gap-10">
          <div className="flex flex-col items-center gap-2 text-primary">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 lg:w-14 lg:h-14"><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>
            <span className="text-xs lg:text-sm text-base-content/70">Live Chat</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-primary">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 lg:w-14 lg:h-14"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
            <span className="text-xs lg:text-sm text-base-content/70">Dedicated Support</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-primary">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 lg:w-14 lg:h-14"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
            <span className="text-xs lg:text-sm text-base-content/70">Email</span>
          </div>
        </div>
      </div>
    ),
  },
] as const;

function WhyHedgiumSection() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section id="why-hedgium" className="py-20 px-6 bg-base-200">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-base-content mb-10">
          What makes <span className="text-primary">Hedgium</span> different?
        </h2>

        <div className="flex flex-col py-10 lg:flex-row gap-8 lg:gap-12 items-start">
          {/* Left: Tab list with hex icons + dashed connector */}
          <div className="lg:w-[38%] flex flex-col gap-2">
            {WHY_HEDGIUM_TABS.map((tab, i) => {
              const isActive = activeTab === i;
              return (
                <div key={tab.id} className="flex items-center gap-3 mb-3">
                  {/* Hedgium icon */}
                  <img
                    src="/images/logos/Hedgium icon cropped.png"
                    alt=""
                    aria-hidden
                    className="shrink-0 w-9 h-9 object-contain"
                  />
                  {/* Dashed line + button */}
                  <div className="flex-1 flex items-center gap-1.5">
                    {/* Short dashed line */}
                    <div className="border-t border-dashed border-primary/50 w-4 shrink-0" />
                    <button
                      type="button"
                      onClick={() => setActiveTab(i)}
                      className={`flex-1 cursor-pointer text-left px-4 py-2.5 font-bold text-sm lg:text-base rounded transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-content'
                          : 'bg-primary/25 text-base-content hover:bg-primary/35'
                      }`}
                    >
                      {tab.label}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Content card */}
          <div className="lg:w-[62%]">
            <div className="border-2 border-base-300 rounded-3xl p-6 lg:p-8 bg-base-100 min-h-[220px]">
              {WHY_HEDGIUM_TABS[activeTab].content}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  useEffect(() => {
    // Simple smooth scroll implementation
    const handleAnchorClick = (e: Event) => {
      const target = e.target as Element;
      const href = target.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', handleAnchorClick);
    });

    return () => {
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.removeEventListener('click', handleAnchorClick);
      });
    };
  }, []);

  return (
    <>
      <div>
        <Navbar />

          {/* Hero Section */}
          <section className="relative h-[94vh] w-full overflow-hidden flex items-center justify-center text-white">
            {/* Background video */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute top-0 left-0 w-full h-full object-cover"
            >
              <source src="/videos/hero_video.mp4" type="video/mp4" />
            </video>

            {/* Headline — top-left */}
            <div className="absolute left-0 top-64 md:top-32 md:mx-4 md:mx-8 z-10 p-4 w-10/12 md:w-5/12 bg-[#003f4b]/20">
              <h1 className="text-3xl md:text-5xl font-medium leading-tight">
                Ambition Guided By Intelligence. Defined by Performance
              </h1>
            </div>

            {/* Trapezium bar — bottom */}
            <div className="trapezium-wrap absolute bottom-0 px-4 md:px-8 w-full z-30">
              <div className="trapezium-reverse mx-auto">
                <div className="trapezium-inner">
                  <p className="text-sm md:text-lg opacity-90 leading-relaxed">
                    <span className="md:hidden text-center">Two decades of expertise. Cutting-edge technology.</span>
                    <span className="hidden md:inline">
                      We capture opportunities in real-time and deliver sophisticated playbooks to maximize
                      risk-adjusted returns, by combining two decades of market expertise with cutting-edge technology.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </section>

        <div>
          {/* What We Do Section */}
          <WhatWeDoSection />

          {/* Unlock Potential Section */}
          <UnlockPotentialSection />

          {/* Playbooks Section */}
          <PlaybooksSection />

          {/* Why Hedgium Section */}
          <WhyHedgiumSection />
    

          {/* Sandbox Section */}
          <section id="sandbox" className="py-16 px-6 bg-base-100">
            <div className="max-w-6xl mx-auto">

              {/* Heading row */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-base-content">
                    Try without commitments:{' '}
                    <span className="text-primary">Sandbox-mode!</span>
                  </h2>
                  <p className="text-sm lg:text-base text-primary mt-1">
                    Log-in and observe your personalized simulated P&amp;L based on Hedgium&apos;s strategies applied to your notional capital in real-time
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:block border-t border-dashed border-primary/50 w-12" aria-hidden />
                  <Link href="/onboarding" className="btn btn-primary whitespace-nowrap">
                    Take me there
                  </Link>
                </div>
              </div>

              {/* Illustration card */}
              <div className="relative border border-dashed border-primary/50 rounded-xl p-5 mt-6">
                {/* Badge */}
                <div className="absolute top-3 right-4">
                  <span className="bg-primary text-primary-content text-xs font-bold px-3 py-1 rounded">
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

                    {/* Bar chart */}
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

                  {/* Divider */}
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
                            ['2.', 'BSE 28 APR 2550 PE', 'BUY',  '3750', '159.85', '-12,100'],
                            ['3.', 'BSE 30 MAR 2800 CE', 'SELL', '3750', '98.05', '-13,540'],
                            ['4.', 'BSE 28 APR 2900 CE', 'BUY',  '3750', '278.30', '+5,540'],
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

          {/* Fees / Plans Section */}
          <section id="pricing" className="py-20 px-6 bg-base-100">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-base-content mb-3">Fees</h2>
              <p className="text-base lg:text-lg text-base-content/70 mb-12">
                Transparent, performance-aligned pricing — no hidden charges.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Portfolio Income */}
                <div className="flex flex-col rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden card-hover">
                  <div className="bg-primary px-5 py-4">
                    <h3 className="text-lg font-bold text-primary-content">Portfolio Income</h3>
                    <p className="text-sm text-primary-content/80 mt-0.5">Top-up income on existing portfolio</p>
                  </div>
                  <div className="flex-1 p-5 flex flex-col gap-4">
                    <div>
                      <p className="text-xs text-base-content/60 uppercase tracking-wide font-semibold mb-1">Management Fee</p>
                      <p className="text-2xl font-bold text-base-content">1% <span className="text-sm font-normal text-base-content/60">per annum</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-base-content/60 uppercase tracking-wide font-semibold mb-1">Performance Fee</p>
                      <p className="text-2xl font-bold text-base-content">20% <span className="text-sm font-normal text-base-content/60">of profits</span></p>
                    </div>
                    <ul className="space-y-2 text-sm text-base-content/80 mt-auto">
                      {['Incremental options income', 'Statistical arbitrage strategies', 'Real-time risk management', 'Web & mobile app access'].map(f => (
                        <li key={f} className="flex items-center gap-2"><Check className="w-4 h-4 shrink-0 text-primary" />{f}</li>
                      ))}
                    </ul>
                    <Link href="/onboarding" className="btn btn-outline btn-primary w-full mt-4">Get Started</Link>
                  </div>
                </div>

                {/* Total Income — highlighted */}
                <div className="flex flex-col rounded-xl border-2 border-primary bg-base-100 shadow-md overflow-hidden card-hover relative">
                  <div className="absolute top-3 right-3 z-10">
                    <span className="badge badge-primary badge-sm font-semibold">Most Popular</span>
                  </div>
                  <div className="bg-primary px-5 py-4">
                    <h3 className="text-lg font-bold text-primary-content">Total Income</h3>
                    <p className="text-sm text-primary-content/80 mt-0.5">Build portfolio + top-up income</p>
                  </div>
                  <div className="flex-1 p-5 flex flex-col gap-4">
                    <div>
                      <p className="text-xs text-base-content/60 uppercase tracking-wide font-semibold mb-1">Management Fee</p>
                      <p className="text-2xl font-bold text-base-content">1.5% <span className="text-sm font-normal text-base-content/60">per annum</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-base-content/60 uppercase tracking-wide font-semibold mb-1">Performance Fee</p>
                      <p className="text-2xl font-bold text-base-content">20% <span className="text-sm font-normal text-base-content/60">of profits</span></p>
                    </div>
                    <ul className="space-y-2 text-sm text-base-content/80 mt-auto">
                      {['Hedgium model portfolio', 'Options income on top', 'Superior risk-adjusted returns', 'Dedicated relationship manager', 'Web & mobile app access'].map(f => (
                        <li key={f} className="flex items-center gap-2"><Check className="w-4 h-4 shrink-0 text-primary" />{f}</li>
                      ))}
                    </ul>
                    <Link href="/onboarding" className="btn btn-primary w-full mt-4">Get Started</Link>
                  </div>
                </div>

                {/* Bespoke */}
                <div className="flex flex-col rounded-xl border border-base-300 bg-base-100 shadow-sm overflow-hidden card-hover">
                  <div className="bg-primary px-5 py-4">
                    <h3 className="text-lg font-bold text-primary-content">Bespoke</h3>
                    <p className="text-sm text-primary-content/80 mt-0.5">Custom institutional mandates</p>
                  </div>
                  <div className="flex-1 p-5 flex flex-col gap-4">
                    <div>
                      <p className="text-xs text-base-content/60 uppercase tracking-wide font-semibold mb-1">Fees</p>
                      <p className="text-2xl font-bold text-base-content">Custom</p>
                    </div>
                    <ul className="space-y-2 text-sm text-base-content/80 mt-auto">
                      {['Fully custom strategy design', 'Institutional capital sizes', 'Dedicated quant team', '24/7 live support', 'API & system integration'].map(f => (
                        <li key={f} className="flex items-center gap-2"><Check className="w-4 h-4 shrink-0 text-primary" />{f}</li>
                      ))}
                    </ul>
                    <Link href="mailto:contact@hedgium.in" className="btn btn-outline btn-primary w-full mt-4">Contact Us</Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section id="contact" className="py-20 px-6 bg-base-200">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">

                {/* Left: tagline + CTA */}
                <div className="lg:w-1/2 flex flex-col justify-center">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-base-content leading-snug mb-4">
                    In a market dominated by directional risk, we focus on{' '}
                    <span className="text-primary">systematic probability-driven alpha.</span>
                  </h2>
                  <p className="text-lg lg:text-xl text-base-content/70 mb-8">Let&apos;s get started!</p>
                  <Link href="/onboarding" className="btn btn-primary btn-lg w-fit gap-2">
                    <Calendar className="w-5 h-5" aria-hidden />
                    Set up a Free Call
                  </Link>
                </div>

                {/* Right: contact details */}
                <div className="lg:w-1/2 flex flex-col gap-6">
                  <div className="flex flex-col gap-4">
                    {[
                      { icon: '✉', label: 'Email', value: 'contact@hedgium.in', href: 'mailto:contact@hedgium.in' },
                      { icon: '🌐', label: 'Website', value: 'www.hedgium.ai', href: 'https://www.hedgium.ai' },
                      { icon: '📱', label: 'Phone / WhatsApp', value: '+91 8454838304', href: 'tel:+918454838304' },
                    ].map(({ icon, label, value, href }) => (
                      <a
                        key={label}
                        href={href}
                        className="flex items-center gap-4 p-4 rounded-xl bg-base-100 border border-base-300 hover:border-primary transition-colors group"
                      >
                        <span className="text-2xl shrink-0">{icon}</span>
                        <div>
                          <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">{label}</p>
                          <p className="text-base font-semibold text-primary group-hover:underline">{value}</p>
                        </div>
                      </a>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl bg-base-100 border border-base-300">
                    <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-3">📍 Locations</p>
                    <ul className="space-y-1.5 text-sm text-base-content">
                      {['Haware City, Thane', 'Hiranandani Gardens, Powai, Mumbai', 'Seawoods, Navi Mumbai'].map(loc => (
                        <li key={loc} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden />
                          {loc}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>
            </div>
          </section>
        </div>
        <Footer />
      </div>
    </>
  );
}