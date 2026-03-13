'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronDown, Calendar, Sigma, Network, Brain, Lock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import AOS from 'aos';
import 'aos/dist/aos.css';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";


function TwinEngineFrameworkSection() {
  return (
    <section className="relative py-20 px-4 lg:px-8 bg-base-200">
      <div className="max-w-6xl mx-auto text-center">

        {/* Heading */}
        <h2 className="text-4xl font-bold text-base-content">
          The Twin Engine Investing Framework
        </h2>

        <p className="mt-2 text-base-content/70">
          Our quant based dual approach to generating superior risk-adjusted returns
        </p>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8 mt-12">

          {/* Step 1 */}
          <div className="card bg-base-100 border-2 border-primary/50 rounded-3xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between">

              <div className="text-left">
                <h3 className="text-xl font-semibold text-primary mb-3">
                  Step 1: Build Model Portfolio
                </h3>

                <p className="text-sm text-base-content/70 leading-relaxed">
                  Construct or restructure a base portfolio with securities
                  using Hedgium’s model portfolio to achieve optimal
                  diversification and long term potential
                </p>
              </div>

              <div className="text-primary text-5xl">
                📈
              </div>

            </div>
          </div>

          {/* Step 2 */}
          <div className="card bg-base-100 border-2 border-primary/50 rounded-3xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between">

              <div className="text-left">
                <h3 className="text-xl font-semibold text-primary mb-3">
                  Step 2: Deploy Statistical Arbitrage
                </h3>

                <p className="text-sm text-base-content/70 leading-relaxed">
                  Leverage margin from the portfolio to execute
                  non-directional, algorithm-driven options strategies
                  to generate consistent income
                </p>
              </div>

              <div className="text-primary text-5xl">
                ⚙️
              </div>

            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 max-w-2xl mx-auto text-left">

          <p className="text-center font-semibold mb-6">
            Combined, our approach aims to:
          </p>

          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Check
                className="text-primary size-5 shrink-0 mt-0.5"
                strokeWidth={2.5}
                aria-hidden
              />
              <span>Generate consistent market-neutral alpha</span>
            </li>

            <li className="flex items-start gap-3">
              <Check
                className="text-primary size-5 shrink-0 mt-0.5"
                strokeWidth={2.5}
                aria-hidden
              />
              <span>Achieve superior risk-adjusted returns</span>
            </li>

            <li className="flex items-start gap-3">
              <Check
                className="text-primary size-5 shrink-0 mt-0.5"
                strokeWidth={2.5}
                aria-hidden
              />
              <span>Outperform traditional benchmark strategies</span>
            </li>

            <li className="flex items-start gap-3">
              <Check
                className="text-primary size-5 shrink-0 mt-0.5"
                strokeWidth={2.5}
                aria-hidden
              />
              <span>
                Boost overall return on capital compounding over a multi-period
                horizon
              </span>
            </li>
          </ul>

        </div>

      </div>
    </section>
  );
}


const WHAT_WE_DO_IMAGES = [
  "/images/home/what we do _ slide 1.png",
  "/images/home/what we do _ slide 2.png",
  "/images/home/what we do _ slide 3.jpg",
].map((path) => path.replace(/ /g, "%20"));

const WHAT_WE_DO_SLIDES = [
  {
    id: "slide-1",
    image: WHAT_WE_DO_IMAGES[0],
    bottomText: (
      <>
        <span className="font-light text-2xl">{`{ `}</span>
        Outperform benchmark returns
        <span className="font-light text-2xl">{` }`}</span>
      </>
    ),
  },
  {
    id: "slide-2",
    image: WHAT_WE_DO_IMAGES[1],
    bottomText: (
      <>
        <span className="font-light text-2xl">{`{ `}</span>
        Sophisticated institutional grade set-ups
        <span className="font-light text-2xl">{` }`}</span>
      </>
    ),
  },
  {
    id: "slide-3",
    image: WHAT_WE_DO_IMAGES[2],
    bottomText: (
      <>
        <span className="font-light text-2xl">{`{ `}</span>
        2 decades of investing & trading experience
        <span className="font-light text-2xl">{` }`}</span>
      </>
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
    <>
    <section id="what-we-do" className="py-16 md:py-24 px-4 lg:px-8 bg-base-100" data-aos="fade-up">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-stretch">
          {/* Left: Static content */}
          <div className="lg:w-1/2 flex flex-col justify-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-base-content leading-snug mb-5">
              Outperform Benchmark Returns with Our{' '}

              <span className="text-primary">Twin Engine Investing</span> framework
            </h2>
            
            <p className="text-sm lg:text-base text-base-content/80 mb-6">
              Hedgium is a quant-driven research house focused on generating <span className="text-primary font-bold">market-neutral alpha</span> for clients.

            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/get-started?ref=schedule_call"
                className="btn btn-primary gap-2 w-fit"
              >
                <Calendar className="w-4 h-4" aria-hidden />
                Set up a Free Call
              </Link>
              {/* <Link href="/#features" className="text-sm text-primary hover:underline">
                Learn More
              </Link> */}
            </div>
          </div>
          {/* Right: Slider — fixed height so all slides match */}
          <div className="lg:w-1/2 flex flex-col order-1 lg:order-2">
              <div className="h-[320px] md:h-[480px] min-h-0 flex flex-col gap-4 border border-dashed border-2 border-primary/50 rounded-xl p-4">
                <div className="flex-1 min-h-0 relative rounded-xl overflow-hidden">
                  <Image
                    src={WHAT_WE_DO_SLIDES[current].image}
                    alt=""
                    fill
                    className="object-contain w-full h-full"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                <div className="flex items-center justify-center gap-2 mt-auto shrink-0">
                  <span className='text-xs lg:text-base'>{WHAT_WE_DO_SLIDES[current].bottomText}</span>
                </div>
              </div>
              <div className="flex justify-center gap-2 py-4 shrink-0">
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

    </section>
    <TwinEngineFrameworkSection />
    </>
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
    <section id="unlock-potential" data-aos="fade-up">
      {/* Banner */}
      <div className="bg-primary text-primary-content py-8 px-4 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-snug">
            Unlock incremental Alpha,{' '}
            <span className="font-normal">by exploiting market inefficiencies, using Hedgium&apos;s platform</span>
          </h2>
        </div>
      </div>

      {/* Body — light gray background matching mockup */}
      <div className="bg-base-200 py-12 md:py-24 px-4 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-center">

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
                          : 'bg-neutral/50 hover:bg-neutral/70 hover:text-primary text-base-content'
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
              <div className="border border-dashed border-2 border-primary/50 rounded-lg p-4 lg:p-6 bg-base-200 min-h-[200px]">
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
    <section id="playbooks" className="py-14 md:py-24 px-6 bg-base-100" data-aos="fade-up">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-center">

          {/* Left: heading + two approach cards + Hedgium icon connector */}
          <div className="lg:w-1/2 flex flex-col gap-6">
            <h2 className="text-2xl py-2 md:text-3xl lg:text-4xl font-bold text-base-content">
              Playbooks adapted to{' '}
              <span className="text-primary">your goals</span>
            </h2>

            {/* Relative container for the two cards + icon */}
            <div className="relative flex flex-col gap-6">

              {/* Portfolio income approach */}
              <div className="flex flex-col gap-1">
                <div className="bg-primary text-primary-content px-3 py-1.5 font-bold text-sm lg:text-base rounded-sm">
                  Portfolio income approach
                </div>
                <p className="text-sm lg:text-base font-bold text-base-content mt-1">Build top-up income</p>
                <p className="text-sm lg:text-base text-primary">
                  Investors with an existing portfolio, who desire incremental returns by leveraging portfolio value using statistical-arbitrage low-risk strategies
                </p>
              </div>


              {/* Spacer */}
              {/* <div className="h-8" /> */}

              {/* Total income approach — offset right to match layout */}
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

          {/* Right: Photo placeholder */}
          <div className="lg:w-1/2">
              <Image src="/images/home2.jpg" className="rounded-lg" alt="Playbooks" width={500} height={500} />
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
          <div className="flex flex-col gap-3">
          <p className="text-sm lg:text-base text-base-content/80">
              Tested in live, diverse market conditions including periods of high volatility, with built-in downside protections
          </p>
          <p className="text-sm lg:text-base text-base-content/80">Adaptable to different risk-appetites. Focused on better risk-adjusted returns
          </p>
          <p className="text-sm lg:text-base text-base-content/80">Suited for various capital sizes — From 25 Lakh to 20 Crore
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
      <div className="relative rounded-xl border border-primary/20 bg-base-100/50 p-6 lg:p-8 min-h-[280px] flex items-center justify-center overflow-hidden">
        {/* Four arrows: from center padlock outward to each text block */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden>
          <defs>
            <marker id="sec-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <path d="M0 0 L8 3 L0 6 Z" fill="currentColor" />
            </marker>
          </defs>
          <g className="text-primary/40 stroke-current" strokeWidth="2" fill="none">
            {/* Center circle edge → top-left (trade logs) */}
            <line x1="42" y1="42" x2="20" y2="20" markerEnd="url(#sec-arrow)" strokeLinecap="round" />
            {/* Center → top-right (funds) */}
            <line x1="58" y1="42" x2="80" y2="20" markerEnd="url(#sec-arrow)" strokeLinecap="round" />
            {/* Center → bottom-right (system access) */}
            <line x1="58" y1="58" x2="80" y2="80" markerEnd="url(#sec-arrow)" strokeLinecap="round" />
            {/* Center → bottom-left (strategies) */}
            <line x1="42" y1="58" x2="20" y2="80" markerEnd="url(#sec-arrow)" strokeLinecap="round" />
          </g>
        </svg>
        {/* Central padlock */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-base-100 border border-primary/20 flex items-center justify-center text-primary shadow-sm z-10">
            <Lock className="w-8 h-8 lg:w-10 lg:h-10" strokeWidth={2} />
          </div>
        </div>
        {/* Four text blocks */}
        <div className="relative grid grid-cols-2 gap-x-6 gap-y-6 max-w-2xl mx-auto z-10">
          <div className="col-start-2 text-right">
            <p className="text-xs lg:text-sm text-base-content/90 leading-snug">
              Funds &amp; securities always stay in client&apos;s account under their exclusive access and control at all times
            </p>
          </div>
          <div className="col-start-2 row-start-2 text-right">
            <p className="text-xs lg:text-sm text-base-content/90 leading-snug">
              System access is encrypted, client-controlled, and revocable any time
            </p>
          </div>
          <div className="col-start-1 row-start-2 text-left">
            <p className="text-xs lg:text-sm text-base-content/90 leading-snug">
              All strategies are approved / pre-approved by the client, and trade execution control is always with the client
            </p>
          </div>
          <div className="col-start-1 row-start-1 text-left">
            <p className="text-xs lg:text-sm text-base-content/90 leading-snug">
              All trade logs, reports, dashboards are available to the client on real-time basis
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

const FAQ_ITEMS = [
  {
    question: "What kind of returns can I expect?",
    answer: [
      "Hedgium operates a twin-engine investment framework designed to enhance portfolio productivity while maintaining disciplined risk control.",
      "Engine 1 - Core Portfolio: The client's existing securities in the demat account form the foundation of the strategy and continue to participate in long-term market appreciation. Hedgium also assists clients in constructing or restructuring this base portfolio to achieve optimal diversification and capital allocation.",
      "Engine 2 - Systematic Income Layer: Built on top of the core portfolio, Hedgium utilizes the margin available against these holdings to deploy algorithm-driven statistical arbitrage strategies in options. This systematic layer is designed to generate consistent income independent of directional market moves.",
      "Outcome: A capital-efficient portfolio architecture that combines long-term equity participation with systematic options income, targeting benchmark-beating, risk-adjusted returns across market cycles.",
    ],
  },
  {
    question: "How much is the minimum capital needed for these set-ups",
    answer: [
      "To ensure effective risk management and dynamic position adjustments, a minimum capital of Rs. 25 lakhs is required to execute these strategies.",
      "This capital can be held in the form of securities in your demat account and pledged as collateral; it does not need to be entirely in cash.",
      "However, maintaining approximately 15-20% of the capital in cash is required to facilitate margin management and hedging requirements.",
    ],
  },
  {
    question: "What is the maximum capital I can deploy",
    answer: [
      "Our strategies are highly scalable, capable of supporting large portfolios (Rs. 25 crore+), with customized implementations for larger mandates.",
    ],
  },
  {
    question: "Can I use my current mutual fund holdings",
    answer: [
      "Yes, your existing holdings can be used to generate the required margin. In fact, the objective is to unlock the value of idle holdings and generate additional returns from them.",
      "However, you would still need to maintain 15-20% free cash to facilitate hedging and margin management.",
    ],
  },
  {
    question: "How will I track my investment",
    answer: [
      "You can track your investments and deployed capital in real time through Hedgium's app/website, which provides a detailed and intuitive interface.",
    ],
  },
  {
    question: "What do risk-adjusted returns mean, and how does Hedgium approach this",
    answer: [
      "Risk-adjusted returns focus on achieving higher returns without increasing risk, or reducing risk without sacrificing returns.",
      "Hedgium's proprietary algorithmic systems run continuous risk controls in real time to deliver consistently superior risk-adjusted outcomes.",
    ],
  },
  {
    question: "What is Hedgium's competitive advantage",
    answer: [
      "Hedgium is founded by a team of highly successful investors and consistently profitable traders with over two decades of experience navigating multiple market cycles. We combine this deep market expertise with cutting-edge technology to deliver sophisticated, institutional-grade playbooks to our clients.",
      "As a technology-first organization, we continuously evolve our strategies to adapt to rapidly changing market dynamics, ensuring our clients remain ahead in increasingly complex markets.",
      "Our strong focus on disciplined risk management enables us to deliver returns with superior risk-adjusted performance in an environment of rising volatility.",
    ],
  },
] as const;

function WhyHedgiumSection() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section id="why-hedgium" className="py-20 px-6 bg-base-200" data-aos="fade-up">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-base-content mb-10">
          What makes <span className="text-primary">Hedgium</span> different?
        </h2>

        <div className="flex flex-col py-10 lg:flex-row gap-8 lg:gap-12 items-start">
          {/* Left: Tab list with hex icons + dashed connector */}
          <div className="lg:w-[38%] flex flex-col gap-4">
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

        {/* Think beyond Mutual Funds, PMS, AIF – comparison table */}
        <div className="mt-16 lg:mt-20">
          <h3 className="text-xl md:text-2xl font-bold text-primary mb-2">
            Think beyond Mutual Funds, PMS, AIF –
          </h3>
          <p className="text-sm lg:text-base text-primary/80 mb-6">
            Take back control, gain liquidity, reduce costs &amp; improve tax efficiency
          </p>
          <div className="overflow-x-auto rounded-xl border border-base-300 bg-base-100">
            <table className="w-full min-w-[640px] text-left border-collapse">
              <thead>
                <tr className="border-b border-base-300">
                  <th className="w-0 p-0" aria-label="Category" />
                  <th className="p-3 lg:p-4 font-bold text-base-content bg-primary/10 border-2 border-dashed border-primary/50 rounded-tl-lg">
                    Hedgium
                  </th>
                  <th className="p-3 lg:p-4 font-bold text-base-content border-b border-base-300">
                    Mutual Funds
                  </th>
                  <th className="p-3 lg:p-4 font-bold text-base-content border-b border-base-300">
                    PMS
                  </th>
                  <th className="p-3 lg:p-4 font-bold text-base-content border-b border-base-300 rounded-tr-lg">
                    AIF
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    category: "Control Risk",
                    hedgium: "Securities/capital under direct client control/access",
                    mutualFunds: "Securities/capital in Fund Manager's control",
                    pms: "PMS Fund Managers have discretion",
                    aif: "Securities/capital in Fund Manager's control",
                  },
                  {
                    category: "Liquidity",
                    hedgium: "Highly liquid as funds in own brokerage account",
                    mutualFunds: "Redemption Process & Exit Load Costs",
                    pms: "—",
                    aif: "Most AIFs have multi-year lock-ins",
                  },
                  {
                    category: "Tax efficiency",
                    hedgium: "Taxed at own marginal bracket. Can claim expenses to reduce tax",
                    mutualFunds: "Can't claim expenses to reduce liability",
                    pms: "—",
                    aif: "AIFs taxed at fund's level, usually 42.7% irrespective of client's tax bracket",
                  },
                  {
                    category: "Directional Risk",
                    hedgium: "Engine 2 provides non-correlated returns",
                    mutualFunds: "Correlated to market, and depends on strategy",
                    pms: "—",
                    aif: "AIFs can go short but leverage is restricted to a level",
                  },
                  {
                    category: "ROI driver",
                    hedgium: "Quant based statistical arbitrage",
                    mutualFunds: "—",
                    pms: "Heavily relies on stock picking. Poor performance of a few stocks can significantly hurt overall returns",
                    aif: "—",
                  },
                ].map((row, i) => (
                  <tr key={row.category} className="border-b border-base-300 last:border-b-0">
                    <td className="py-2 pr-2 align-top">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-content text-xs lg:text-sm font-semibold">
                        <span aria-hidden>→</span>
                        {row.category}
                      </span>
                    </td>
                    <td className={`p-3 lg:p-4 text-xs lg:text-sm text-base-content/90 align-top border-l border-r-2 border-dashed border-primary/50 bg-primary/5 ${i === 4 ? "rounded-bl-lg" : ""}`}>
                      {row.hedgium}
                    </td>
                    <td className="p-3 lg:p-4 text-xs lg:text-sm text-base-content/80 align-top">
                      {row.mutualFunds}
                    </td>
                    <td className="p-3 lg:p-4 text-xs lg:text-sm text-base-content/80 align-top">
                      {row.pms}
                    </td>
                    <td className="p-3 lg:p-4 text-xs lg:text-sm text-base-content/80 align-top">
                      {row.aif}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section id="faq" className="py-20 px-6 bg-base-200" data-aos="fade-up">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-base-content mb-3">
          Frequently Asked Questions
        </h2>
        <p className="text-sm lg:text-base text-base-content/70 mb-8">
          Everything you need to know about Hedgium&apos;s framework, capital requirements, and portfolio setup.
        </p>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <details key={item.question} className="group rounded-xl border border-base-300 bg-base-100">
              <summary className="list-none cursor-pointer px-5 py-4 flex items-start gap-3 justify-between">
                <span className="font-semibold text-base lg:text-lg text-base-content">
                  Q{i + 1}. {item.question}
                </span>
                <ChevronDown className="w-5 h-5 shrink-0 text-primary transition-transform duration-200 group-open:rotate-180" />
              </summary>

              <div className="px-5 pb-5 pt-1 space-y-3">
                {item.answer.map((paragraph, index) => (
                  <p key={`${item.question}-${index}`} className="text-sm lg:text-base text-base-content/80 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  useEffect(() => {
    AOS.init({ duration: 600, once: true, offset: 80 });
  }, []);

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
        <Navbar />

          {/* Hero Section */}
          <section className="relative h-[96vh] w-full overflow-hidden flex items-center justify-center text-white">
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
            <div className="absolute left-0 top-64 md:top-32 md:mx-4 md:mx-8 z-10 p-4 w-10/12 md:w-5/12 bg-primary/20">
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

=          {/* What We Do Section */}
          <WhatWeDoSection />

          {/* Unlock Potential Section */}
          <UnlockPotentialSection />

          {/* Playbooks Section */}
          <PlaybooksSection />

          {/* Why Hedgium Section */}
          <WhyHedgiumSection />
    

          {/* Sandbox Section */}
          <section id="sandbox" className="py-16 px-6 bg-base-100" data-aos="fade-up">
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
                  <Link href="/get-started" className="btn btn-primary whitespace-nowrap">
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

          {/* Fees Section */}
          <section id="pricing" className="py-20 px-4 lg:px-8 bg-base-100" data-aos="fade-up">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-2">Fees</h2>
              <p className="text-base text-base-content/70 mb-10">
                Simple structure and charged only if there are profits to cover the fees
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start mb-10">
                {/* Left: Client-specific fee structure */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-base-content mb-3">Retail clients</h3>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-bold text-primary text-lg">25L to 75L</span>
                      <span className="text-base-content/80 text-sm lg:text-base">
                        Starts at 0.5% of AUM
                        <br />
                        per quarter<sup className="text-primary">^</sup>
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-dashed border-base-300 pt-6">
                    <h3 className="text-lg font-bold text-base-content mb-3">Accredited or Institutional Clients</h3>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-bold text-primary text-lg">75L+</span>
                      <span className="text-base-content/80 text-sm lg:text-base">
                        Customized pricing
                        <br />
                        depending on mandate
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Pyramid – fees from profits */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-full max-w-[280px] flex flex-col">
                    <div className="bg-primary text-primary-content text-center py-3 px-4 rounded-t-lg text-sm font-semibold">
                      Fees
                    </div>
                    <div className="bg-primary/80 text-primary-content text-center py-4 px-4 text-sm font-semibold">
                      Trading Profit (Engine-2)
                    </div>
                    <div className="bg-primary/60 text-primary-content text-center py-5 px-4 rounded-b-lg text-sm font-semibold">
                      Base Portfolio Profit (Engine-1)
                    </div>
                  </div>
                </div>
              </div>

              {/* New Fiscal Year Offer */}
              <div className="rounded-xl bg-primary text-primary-content p-5 lg:p-6 mb-6">
                <p className="font-bold text-base lg:text-lg mb-2">
                  New Fiscal Year Offer (Valid only till 30th Apr 2026):
                </p>
                <p className="text-sm lg:text-base opacity-95">
                  Free first month - potentially earn back a significant portion of the fees at no cost before you even pay
                </p>
              </div>

              <p className="text-xs text-base-content/50">
                <sup>^</sup> Subject to Regulatory framework prescribed by SEBI
              </p>
            </div>
          </section>

          {/* FAQ Section */}
          <FAQSection />

          {/* Contact Section */}
          <section id="contact" className="py-20 px-4 lg:px-8 bg-base-200" data-aos="fade-up">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">

                {/* Left: tagline + CTA */}
                <div className="lg:w-1/2 flex flex-col justify-center">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-base-content leading-snug mb-4">
                    In a market dominated by directional risk, we focus on{' '}
                    <span className="text-primary">systematic probability-driven alpha.</span>
                  </h2>
                  <p className="text-lg lg:text-xl text-base-content/70 mb-8">Let&apos;s get started!</p>
                  <Link href="/get-started?ref=schedule_call" className="btn btn-primary btn-lg w-fit gap-2">
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
          <Footer />
    </>
  );
}