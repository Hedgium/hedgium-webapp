import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-neutral text-neutral-content pt-12 pb-6 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 ">

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
            <a href={`tel:+91${process.env.NEXT_PUBLIC_PHONE_NUMBER}`} className="text-sm text-neutral-content/70 hover:text-neutral-content transition-colors">
              +91 {process.env.NEXT_PUBLIC_PHONE_NUMBER}
            </a>
          </div>

        </div>

  

        {/* SEBI / RA / IA registration and disclaimers */}
        <div className="pt-10 mt-10 border-t border-neutral-content/20 text-xs text-neutral-content/60 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-content/90">Research Analyst (RA)</h3>
            <ul className="space-y-1">
              <li>SEBI Registration No.: INH000009825</li>
              <li>BSE Enlistment No.: 5586</li>
              <li>Type of Registration: Non-Individual</li>
              <li>Validity: June 13, 2022 - Perpetual</li>
            </ul>
            <div className="space-y-1 pt-2">
              <p><strong className="text-neutral-content/80">Principal Officer:</strong> Mr. Rahul Kumar Ghose</p>
              <p>Email: contactus@octanom.com | Contact: +91 7669668668</p>
            </div>
            <div className="space-y-1">
              <p><strong className="text-neutral-content/80">Compliance Officer:</strong> Mr. Pratik Rathod</p>
              <p>Email: compliance@octanom.com | Contact: +91 9076160917</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-content/90">Investment Advisor (IA)</h3>
            <ul className="space-y-1">
              <li>SEBI Registration No.: INA000021207</li>
              <li>BSE Enlistment No.: 2368</li>
              <li>Type of Registration: Non-Individual</li>
              <li>Validity: October 30, 2025 - Perpetual</li>
            </ul>
            <div className="space-y-1 pt-2">
              <p><strong className="text-neutral-content/80">Principal Officer:</strong> Mr. Archit Mahajan</p>
              <p>Email: archit@octanom.com | Contact: +91 9930180035</p>
            </div>
            <div className="space-y-1">
              <p><strong className="text-neutral-content/80">Compliance Officer:</strong> Mr. Pratik Rathod</p>
              <p>Email: compliance@octanom.com | Contact: +91 9076160917</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-neutral-content/90">SEBI Correspondence Office Details</h3>
            <p>Securities and Exchange Board of India, SEBI Bhavan II, Plot No: C7, &quot;G&quot; Block, Bandra Kurla Complex, Bandra (East), Mumbai-400051</p>
            <p>
              <a href="https://scores.sebi.gov.in/scores-home" target="_blank" rel="noopener noreferrer" className="text-neutral-content/70 hover:text-neutral-content underline">SEBI SCORES</a>
              {' · '}
              <a href="https://smartodr.in/login" target="_blank" rel="noopener noreferrer" className="text-neutral-content/70 hover:text-neutral-content underline">SMARTODR</a>
            </p>
          </div>



            
          </div>


  

   
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-neutral-content/90">Disclaimers</h3>
            <ul className="space-y-2 list-disc list-inside text-neutral-content/70">
              <li>Registration granted by SEBI, enlistment as Research Analyst and Investment Adviser with Exchange, and certification from NISM in no way guarantee the performance of the intermediary or provide any assurance of returns to investors.</li>
              <li>The company does not guarantee or provide any assurance of return, fixed returns, or risk-free return. Investments in the securities are subject to market risks. Read all the related documents carefully before investing.</li>
              <li>Past performance may or may not be sustained in the future, and there is no guarantee of future results.</li>
              <li>All fees and payments must be made solely to the Company&apos;s designated bank account. The Company shall not be liable for any payments made to any specific individuals.</li>
            </ul>
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
