import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = [
  {
    question: 'What kind of returns can I expect?',
    answer: [
      'Hedgium operates a twin-engine investment framework designed to enhance portfolio productivity while maintaining disciplined risk control.',
      "Engine 1 - Core Portfolio: The client's existing securities in the demat account form the foundation of the strategy and continue to participate in long-term market appreciation. Hedgium also assists clients in constructing or restructuring this base portfolio to achieve optimal diversification and capital allocation.",
      'Engine 2 - Systematic Income Layer: Built on top of the core portfolio, Hedgium utilizes the margin available against these holdings to deploy algorithm-driven statistical arbitrage strategies in options. This systematic layer is designed to generate consistent income independent of directional market moves.',
      'Outcome: A capital-efficient portfolio architecture that combines long-term equity participation with systematic options income, targeting benchmark-beating, risk-adjusted returns across market cycles.',
    ],
  },
  {
    question: 'How much is the minimum capital needed for these set-ups',
    answer: [
      'To ensure effective risk management and dynamic position adjustments, a minimum capital of Rs. 25 lakhs is required to execute these strategies.',
      'This capital can be held in the form of securities in your demat account and pledged as collateral; it does not need to be entirely in cash.',
      'However, maintaining approximately 15-20% of the capital in cash is required to facilitate margin management and hedging requirements.',
    ],
  },
  {
    question: 'What is the maximum capital I can deploy',
    answer: ['Our strategies are highly scalable, capable of supporting large portfolios (Rs. 25 crore+), with customized implementations for larger mandates.'],
  },
  {
    question: 'Can I use my current mutual fund holdings',
    answer: [
      'Yes, your existing holdings can be used to generate the required margin. In fact, the objective is to unlock the value of idle holdings and generate additional returns from them.',
      'However, you would still need to maintain 15-20% free cash to facilitate hedging and margin management.',
    ],
  },
  {
    question: 'How will I track my investment',
    answer: ["You can track your investments and deployed capital in real time through Hedgium's app/website, which provides a detailed and intuitive interface."],
  },
  {
    question: 'What do risk-adjusted returns mean, and how does Hedgium approach this',
    answer: [
      'Risk-adjusted returns focus on achieving higher returns without increasing risk, or reducing risk without sacrificing returns.',
      "Hedgium's proprietary algorithmic systems run continuous risk controls in real time to deliver consistently superior risk-adjusted outcomes.",
    ],
  },
  {
    question: "What is Hedgium's competitive advantage",
    answer: [
      'Hedgium is founded by a team of highly successful investors and consistently profitable traders with over two decades of experience navigating multiple market cycles. We combine this deep market expertise with cutting-edge technology to deliver sophisticated, institutional-grade playbooks to our clients.',
      'As a technology-first organization, we continuously evolve our strategies to adapt to rapidly changing market dynamics, ensuring our clients remain ahead in increasingly complex markets.',
      'Our strong focus on disciplined risk management enables us to deliver returns with superior risk-adjusted performance in an environment of rising volatility.',
    ],
  },
] as const;

export default function FAQSection() {
  return (
    <section id="faq" className="py-12 md:py-24 px-4 lg:px-8 bg-base-200">
      <div className="max-w-6xl mx-auto">
        <div
          data-aos="fade-up"
          data-aos-duration="650"
          data-aos-once="true"
        >
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-base-content mb-3">Frequently Asked Questions</h2>
        <p className="text-sm lg:text-base text-base-content/70 mb-8">
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
              <summary className="list-none cursor-pointer px-4 py-3 md:px-5 md:py-4 flex items-start gap-3 justify-between">
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
