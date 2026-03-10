import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-neutral text-neutral-content pt-12 pb-6 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-neutral-content/20">

          {/* Brand */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <img
              src="/images/logos_darkmode/Hedgium stacked darkmode.png"
              alt="Hedgium"
              className="w-20 h-auto"
            />
            <p className="text-sm text-neutral-content/70 leading-relaxed">
              Quant-driven research house focused on generating market-neutral alpha using the Twin Engine Investing framework.
            </p>
          </div>

          {/* Navigate */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-content/50 mb-1">Navigate</span>
            {[
              { label: 'What We Do', href: '/#what-we-do' },
              { label: 'Unlock Potential', href: '/#unlock-potential' },
              { label: 'Why Hedgium', href: '/#why-hedgium' },
              { label: 'Fees', href: '/#pricing' },
            ].map(({ label, href }) => (
              <Link key={label} href={href} className="text-sm text-neutral-content/70 hover:text-neutral-content transition-colors">
                {label}
              </Link>
            ))}
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-content/50 mb-1">Legal</span>
            <Link href="/terms-of-use" className="text-sm text-neutral-content/70 hover:text-neutral-content transition-colors">Terms of Use</Link>
            <Link href="/privacy-policy" className="text-sm text-neutral-content/70 hover:text-neutral-content transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-sm text-neutral-content/70 hover:text-neutral-content transition-colors">Disclaimer</Link>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-content/50 mb-1">Contact</span>
            <a href="mailto:contact@hedgium.in" className="text-sm text-neutral-content/70 hover:text-neutral-content transition-colors">
              contact@hedgium.in
            </a>
            <a href="https://www.hedgium.ai" className="text-sm text-neutral-content/70 hover:text-neutral-content transition-colors">
              www.hedgium.ai
            </a>
            <a href="tel:+918454838304" className="text-sm text-neutral-content/70 hover:text-neutral-content transition-colors">
              +91 8454838304
            </a>
            <div className="mt-2 text-xs text-neutral-content/50 space-y-0.5">
              <p>Haware City, Thane</p>
              <p>Hiranandani Gardens, Powai</p>
              <p>Seawoods, Navi Mumbai</p>
            </div>
          </div>

        </div>

        {/* Bottom row */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-neutral-content/40">
          <p>© {new Date().getFullYear()} Hedgium. All rights reserved.</p>
          <p>In a market dominated by directional risk, we focus on systematic probability-driven alpha.</p>
        </div>

      </div>
    </footer>
  );
}
