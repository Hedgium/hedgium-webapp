import Link from 'next/link';
import { Calendar } from 'lucide-react';

export default function ContactSection() {
  return (
    <section id="contact" className="py-12 md:py-24 px-4 lg:px-8 bg-base-200">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
          <div
            className="w-full md:w-1/2 flex flex-col justify-center"
            data-aos="fade-up"
            data-aos-duration="650"
            data-aos-once="true"
          >
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

          <div
            className="w-full md:w-1/2 flex flex-col gap-6"
            data-aos="fade-up"
            data-aos-duration="650"
            data-aos-delay="100"
            data-aos-once="true"
          >
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
                {['Haware City, Thane', 'Hiranandani Gardens, Powai, Mumbai', 'Seawoods, Navi Mumbai'].map((loc) => (
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
  );
}
