import { legalCharterUrl } from "@/lib/marketingSite";

const FOOTER_LINKS = [
  { href: legalCharterUrl("terms-of-use"), label: "Terms of Use" },
  { href: legalCharterUrl("privacy-policy"), label: "Privacy Policy" },
  { href: legalCharterUrl("grievance-redressal"), label: "Grievance Redressal" },
  { href: legalCharterUrl("complaint-status"), label: "Complaint Status" },
] as const;

/**
 * Compact broker-style footer for login, signup, onboarding, forgot-password.
 * Similar pattern to institutional login pages (e.g. Kotak Neo).
 */
export default function AuthFlowFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="shrink-0 border-t border-base-300/80 bg-base-100/90 backdrop-blur-sm print:hidden">
      <div className="mx-auto max-w-4xl px-4 py-5 sm:py-6">
        <nav
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-center text-[11px] sm:text-xs text-base-content/70"
          aria-label="Legal and support"
        >
          {FOOTER_LINKS.map((item, i) => (
            <span key={item.href} className="inline-flex items-center gap-2">
              {i > 0 ? (
                <span className="select-none text-base-content/35" aria-hidden>
                  |
                </span>
              ) : null}
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="whitespace-nowrap rounded-sm transition-colors hover:text-primary hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
              >
                {item.label}
                <span className="sr-only"> (opens in new tab)</span>
              </a>
            </span>
          ))}
          <span className="select-none text-base-content/35" aria-hidden>
            |
          </span>
          <a
            href="mailto:support@hedgium.in"
            className="whitespace-nowrap rounded-sm transition-colors hover:text-primary hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
          >
            Support
          </a>
        </nav>

        <p className="mx-auto mt-3 max-w-2xl text-center text-[10px] leading-relaxed text-base-content/65 sm:text-[11px]">
          Investments are subject to market risks. Read all related documents carefully before
          investing. Hedgium does not guarantee returns.
        </p>

        <p className="mt-3 text-center text-[10px] text-base-content/60 sm:text-xs">
          © {year} Hedgium Services LLP. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
