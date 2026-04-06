import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-neutral text-neutral-content pt-16 pb-8 px-6 lg:px-10">
      <div className="max-w-8xl mx-auto">

        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-2 flex flex-col gap-5">
            <img
              src="/images/logos_darkmode/Hedgium stacked darkmode.png"
              alt="Hedgium"
              className="w-24"
            />

            <p className="text-sm text-neutral-content/70 leading-relaxed max-w-md">
              Quant-driven research house focused on generating market-neutral
              alpha using the Twin Engine Investing framework.
            </p>

            <div className="text-xs text-neutral-content/60 space-y-1">
              <p>Registered Entity Name: Hedgium Services LLP</p>
              <p>LLP Identification Number: ACQ-3740 </p>
            </div>
          </div>

          {/* Navigate */}
          {/* <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-content/50">
              Navigate
            </span>

            {[
              { label: "What We Do", href: "/#what-we-do" },
              { label: "Unlock Potential", href: "/#unlock-potential" },
              { label: "Why Hedgium", href: "/#why-hedgium" },
              { label: "Fees", href: "/#pricing" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-sm text-neutral-content/70 hover:text-neutral-content transition"
              >
                {label}
              </Link>
            ))}
          </div> */}

          {/* Legal */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-content/50">
              Legal
            </span>

            <Link
              href="/terms-of-use"
              className="text-sm text-neutral-content/70 hover:text-neutral-content transition"
            >
              Terms of Use
            </Link>

            <Link
              href="/privacy-policy"
              className="text-sm text-neutral-content/70 hover:text-neutral-content transition"
            >
              Privacy Policy
            </Link>

            <Link
              href="/complaint-status"
              className="text-sm text-neutral-content/70 hover:text-neutral-content transition"
            >
              Complaint Status
            </Link>

            <Link
              href="/grievance-redressal"
              className="text-sm text-neutral-content/70 hover:text-neutral-content transition"
            >
              Grievance Redressal
            </Link>

            <Link
              href="/refund-policy"
              className="text-sm text-neutral-content/70 hover:text-neutral-content transition"
            >
              Refund Policy
            </Link>

            <Link
              href="/mitc-ra"
              className="text-sm text-neutral-content/70 hover:text-neutral-content transition"
            >
              MITC-RA
            </Link>

          </div>

          {/* Contact */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-content/50">
              Contact
            </span>

            <a
              href="mailto:clients@hedgium.ai"
              className="text-sm text-neutral-content/70 hover:text-neutral-content transition"
            >
              clients@hedgium.ai
            </a>

            <a
              href={`tel:+91${process.env.NEXT_PUBLIC_PHONE_NUMBER}`}
              className="text-sm text-neutral-content/70 hover:text-neutral-content transition"
            >
              +91 {process.env.NEXT_PUBLIC_PHONE_NUMBER}
            </a>

            <a
              href="https://www.hedgium.ai"
              className="text-sm text-neutral-content/70 hover:text-neutral-content transition"
            >
              www.hedgium.ai
            </a>
          </div>
        </div>


        {/* Divider */}
        <div className="border-t border-neutral-content/20 my-12"></div>


        {/* RA Info */}
        <div className="grid md:grid-cols-2 gap-10 text-sm text-neutral-content/70">

          <div className="space-y-4">
            <h3 className="font-semibold text-neutral-content">
              Research Analyst (RA)
            </h3>

            <p>SEBI Registration No: INH000025258</p>

            <div>
              <p className="font-medium text-neutral-content/90">
                Principal Officer
              </p>
              <p>Kamlesh Ramchandani</p>
              <p>
                <a
                  href="mailto:kamlesh.ramchandani@hedgium.in"
                  className="underline hover:text-neutral-content"
                >
                  kamlesh.ramchandani@hedgium.in
                </a>
              </p>
              <p>8454838304</p>
            </div>

            <div>
              <p className="font-medium text-neutral-content/90">
                Compliance Officer
              </p>
              <p>Aerik Wadhwani</p>
              <p>
                <a
                  href="mailto:compliance@hedgium.in"
                  className="underline hover:text-neutral-content"
                >
                  compliance@hedgium.in
                </a>
              </p>
            </div>
          </div>


          <div className="space-y-4">
            <h3 className="font-semibold text-neutral-content">
              SEBI Correspondence Office
            </h3>

            <p>
              Securities and Exchange Board of India  
              SEBI Bhavan II, Plot No: C7, “G” Block,  
              Bandra Kurla Complex, Bandra (East),  
              Mumbai – 400051
            </p>

            <div className="flex gap-4">
              <a
                href="https://scores.sebi.gov.in/scores-home"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-neutral-content"
              >
                SEBI SCORES
              </a>

              <a
                href="https://smartodr.in/login"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-neutral-content"
              >
                SMARTODR
              </a>
            </div>
          </div>

        </div>


        {/* Disclaimers */}
        <div className="mt-10 text-xs text-neutral-content/60 space-y-3">
          <h3 className="font-semibold text-neutral-content/80">
            Disclaimers
          </h3>

          <ul className="space-y-2 list-disc list-inside">
            <li>
              Registration granted by SEBI and certification from NISM does not
              guarantee performance or assure returns.
            </li>

            <li>
              Investments in securities markets are subject to market risks.
              Read all related documents carefully before investing.
            </li>

            <li>
              Past performance may or may not be sustained in the future.
            </li>

            <li>
              All payments must be made only to the Company’s designated bank
              account. The Company is not responsible for payments made to
              individuals.
            </li>
          </ul>
        </div>


        {/* Bottom */}
        <div className="border-t border-neutral-content/20 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-content/40">

          <p>© {new Date().getFullYear()} Hedgium. All rights reserved.</p>


        </div>
      </div>
    </footer>
  );
}