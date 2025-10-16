// components/TermsOfUse.tsx
"use client";


import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/**
 * Terms of Use component styled with Tailwind + DaisyUI.
 * - Scrollable content
 * - Table of contents with anchor links
 * - Accept / Decline actions
 */
export default function TermsOfUse() {
  

  return (
    <>
    <Navbar />
    <div
      className={`max-w-4xl mx-auto p-4 md:p-6`}
      aria-live="polite"
    >
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body gap-4">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Terms of Use</h1>
              <p className="text-sm text-gray-500 mt-1">
                Last updated: <time dateTime="2025-09-30">September 30, 2025</time>
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href="#printable"
                onClick={(e) => {
                  e.preventDefault();
                  window.print();
                }}
                className="btn btn-ghost btn-sm"
                title="Print terms"
              >
                Print
              </a>
            </div>
          </header>

          <div className="divider my-0" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* TOC */}
            <nav
              aria-label="Table of contents"
              className="md:col-span-1 order-2 md:order-1"
            >
              <div className="bg-base-200 rounded-lg p-3 sticky top-6">
                <h2 className="text-sm font-medium mb-2">Contents</h2>
                <ul className="text-sm space-y-1">
                  <li>
                    <a href="#introduction" className="link link-hover">
                      Introduction
                    </a>
                  </li>
                  <li>
                    <a href="#acceptance" className="link link-hover">
                      Acceptance of Terms
                    </a>
                  </li>
                  <li>
                    <a href="#accounts" className="link link-hover">
                      Accounts & Security
                    </a>
                  </li>
                  <li>
                    <a href="#use" className="link link-hover">
                      Permitted Use
                    </a>
                  </li>
                  <li>
                    <a href="#prohibited" className="link link-hover">
                      Prohibited Conduct
                    </a>
                  </li>
                  <li>
                    <a href="#intellectual" className="link link-hover">
                      Intellectual Property
                    </a>
                  </li>
                  <li>
                    <a href="#disclaimer" className="link link-hover">
                      Disclaimer & Liability
                    </a>
                  </li>
                  <li>
                    <a href="#governing" className="link link-hover">
                      Governing Law
                    </a>
                  </li>
                  <li>
                    <a href="#contact" className="link link-hover">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
            </nav>

            {/* Content */}
            <article
              id="printable"
              className="md:col-span-3 order-1 md:order-2"
              aria-labelledby="terms-heading"
            >
              <div className="prose prose-sm md:prose-md max-w-none">
                <section id="introduction" className="mb-4">
                  <h2 id="terms-heading">1. Introduction</h2>
                  <p>
                    {`Welcome to our service. These Terms of Use ("Terms")
                    govern your access to and use of the services, websites,
                    and applications (collectively, the "Service"). By using
                    the Service you agree to these Terms. If you do not agree,
                    do not use the Service.`}
                  </p>
                </section>

                <section id="acceptance" className="mb-4">
                  <h3>2. Acceptance of Terms</h3>
                  <p>
                    {`You accept these Terms by creating an account, accessing
                    the Service, or clicking "Accept" where provided. These
                    Terms constitute a binding agreement between you and the
                    Service provider.`}
                  </p>
                </section>

                <section id="accounts" className="mb-4">
                  <h3>3. Accounts & Security</h3>
                  <p>
                    Some parts of the Service require an account. You are
                    responsible for maintaining the confidentiality of your
                    credentials and for all activity under your account. Notify
                    us immediately of any unauthorized use.
                  </p>
                </section>

                <section id="use" className="mb-4">
                  <h3>4. Permitted Use</h3>
                  <p>
                    You may use the Service only for lawful purposes and in
                    accordance with these Terms. You agree not to circumvent
                    access controls, scrape data in violation of our rules, or
                    otherwise abuse the Service.
                  </p>
                </section>

                <section id="prohibited" className="mb-4">
                  <h3>5. Prohibited Conduct</h3>
                  <ul>
                    <li>Impersonating others or providing false information.</li>
                    <li>Uploading harmful or illegal content.</li>
                    <li>Attempting to reverse engineer or interfere with the Service.</li>
                  </ul>
                </section>

                <section id="intellectual" className="mb-4">
                  <h3>6. Intellectual Property</h3>
                  <p>
                    All content and software provided by the Service are
                    protected by copyright, trademark, and other laws. You may
                    not copy, modify, distribute, or create derivative works
                    without our written consent.
                  </p>
                </section>

                <section id="disclaimer" className="mb-4">
                  <h3>7. Disclaimer & Limitation of Liability</h3>
                  <p>
                    {`THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
                    WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY
                    LAW, WE DISCLAIM ALL WARRANTIES AND WILL NOT BE LIABLE FOR
                    INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES.`}
                  </p>
                </section>

                <section id="termination" className="mb-4">
                  <h3>8. Termination</h3>
                  <p>
                    We may suspend or terminate your access for violations of
                    these Terms or for any lawful reason. Termination will not
                    relieve you of obligations incurred prior to termination.
                  </p>
                </section>

                <section id="governing" className="mb-4">
                  <h3>9. Governing Law</h3>
                  <p>
                    These Terms are governed by the laws of the jurisdiction
                    stated in our legal notice (or your agreement). Disputes
                    will be resolved in the competent courts unless otherwise
                    agreed.
                  </p>
                </section>

                <section id="changes" className="mb-4">
                  <h3>10. Changes to Terms</h3>
                  <p>
                    We may update these Terms from time to time. We will post
                    the updated date and provide notice when changes are
                    material. Continued use after changes means you accept them.
                  </p>
                </section>

                <section id="contact" className="mb-4">
                  <h3>11. Contact</h3>
                  <p>
                    If you have questions about these Terms, contact us at{" "}
                    <a href="mailto:legal@example.com" className="link">
                      legal@example.com
                    </a>
                    .
                  </p>
                </section>

                <footer className="text-xs text-gray-500 mt-6">
                  <p>
                    These Terms are a summary template for typical web services
                    and do not constitute legal advice. For binding legal text,
                    consult a qualified attorney.
                  </p>
                </footer>
              </div>
            </article>
          </div>

         
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}
