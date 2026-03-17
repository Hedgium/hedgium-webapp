import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = [
  {
    question: 'What kind of returns can I expect?',
    answer: [
      <>Hedgium operates a <span className="font-semibold">twin-engine investment framework</span> designed to enhance portfolio productivity while maintaining disciplined risk control.</>,
      <><span className="font-semibold">Engine 1 – Core Portfolio:</span> The client&apos;s existing securities in the demat account form the foundation of the strategy and continue to participate in long-term market appreciation. Hedgium also assists clients in constructing or restructuring this base portfolio to achieve optimal diversification and capital allocation.</>,
      <><span className="font-semibold">Engine 2 – Systematic Income Layer:</span> Built on top of the core portfolio, Hedgium utilizes the margin available against these holdings to deploy <span className="font-semibold">algorithm-driven statistical arbitrage strategies in options</span>. This systematic layer is designed to generate consistent income independent of directional market moves.</>,
      <><span className="font-semibold">Outcome:</span> A capital-efficient portfolio architecture that combines <span className="font-semibold">long-term equity participation with systematic options income</span>, targeting <span className="font-semibold">benchmark-beating, risk-adjusted returns</span> across market cycles.</>,
    ],
  },
  {
    question: 'How much is the minimum capital needed for these set-ups',
    answer: [
      'To ensure effective risk management and dynamic position adjustments, a minimum capital of Rs. 25 lakhs is required to execute these strategies.',
      'This capital can be held in the form of securities in your demat account and pledged as collateral; it does not need to be entirely in cash.',
      <>However, maintaining approximately <span className="font-semibold">15–20% of the capital in cash</span> is required to facilitate margin management and hedging requirements.</>,
    ],
  },
  {
    question: 'What is the maximum capital I can deploy',
    answer: [<>Our strategies are <span className="font-semibold">highly scalable</span>, capable of supporting <span className="font-semibold">large portfolios (Rs. 25 crore+)</span>, with customized implementations for larger mandates.</>],
  },
  {
    question: 'Can I use my current mutual fund holdings',
    answer: [
      <>Yes, your existing holdings can be used to generate the required margin. In fact, the objective is to <span className="font-semibold">unlock the value of idle holdings and generate additional returns from them</span>.</>,
      <>However, you would still need to maintain <span className="font-semibold">15–20% free cash</span> to facilitate hedging and margin management.</>,
    ],
  },
  {
    question: 'How will I track my investment',
    answer: [<>You can track your investments and deployed capital in real time through <span className="font-semibold">Hedgium&apos;s app/website</span>, which provides a detailed and intuitive interface.</>],
  },
  {
    question: 'What do risk-adjusted returns mean, and how does Hedgium approach this',
    answer: [
      <>Risk-adjusted returns focus on <span className="font-semibold">achieving higher returns without increasing risk, or reducing risk without sacrificing returns</span>.</>,
      <>Hedgium&apos;s proprietary algorithmic systems run continuous risk controls in real time to deliver <span className="font-semibold">consistently superior risk-adjusted outcomes</span>.</>,
    ],
  },
  {
    question: "What is Hedgium's competitive advantage",
    answer: [
      <>Hedgium is founded by a team of <span className="font-semibold">highly successful investors</span> and <span className="font-semibold">consistently profitable traders with over two decades of experience navigating multiple market cycles</span>. We combine this deep market expertise with cutting-edge technology to deliver sophisticated, institutional-grade playbooks to our clients.</>,
      <>As a <span className="font-semibold">technology-first organization</span>, we continuously evolve our strategies to adapt to rapidly changing market dynamics, ensuring our clients remain ahead in increasingly complex markets.</>,
      'Our strong focus on disciplined risk management enables us to deliver returns with superior risk-adjusted performance in an environment of rising volatility.',
    ],
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="py-12 md:py-24 bg-base-200">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <div
          data-aos="fade-up"
          data-aos-duration="650"
          data-aos-once="true"
        >
        <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-base-content mb-3">Frequently Asked Questions</h2>
        <p className="text-sm lg:text-base xl:text-lg 2xl:text-xl text-base-content/70 mb-8">
          Everything you need to know about Hedgium&apos;s framework, capital requirements, and portfolio setup.
        </p>
        </div>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <details
              key={item.question}
              className="group rounded-xl border border-base-300 bg-base-100"
              data-aos="fade-up"
              data-aos-duration="550"
              data-aos-delay={String(Math.min(i * 50, 200))}
              data-aos-once="true"
            >
              <summary className="list-none cursor-pointer px-4 py-3 md:px-5 md:py-4 flex items-center gap-3 justify-between">
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
