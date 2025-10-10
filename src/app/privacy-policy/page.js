// app/privacy-policy/page.tsx
"use client";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body gap-4">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Privacy Policy</h1>
              <p className="text-sm text-gray-500 mt-1">
                Last updated:{" "}
                <time dateTime="2025-09-30">September 30, 2025</time>
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
                title="Print privacy policy"
              >
                Print
              </a>
            </div>
          </header>

          <div className="divider my-0" />

          <article
            id="printable"
            className="prose prose-sm md:prose-md max-w-none"
          >
            <section id="introduction" className="mb-4">
              <h2>1. Introduction</h2>
              <p>
                {`We value your privacy and are committed to protecting your
                personal information. This Privacy Policy explains how we
                collect, use, disclose, and safeguard your information when you
                use our website, services, and applications (collectively, the
                "Service")`}.
              </p>
            </section>

            <section id="information" className="mb-4">
              <h2>2. Information We Collect</h2>
              <ul>
                <li>
                  <strong>Personal Information:</strong> such as your name,
                  email address, phone number, or payment details when you
                  register, make a purchase, or contact us.
                </li>
                <li>
                  <strong>Usage Data:</strong> including your IP address,
                  browser type, device information, and interactions with the
                  Service.
                </li>
                <li>
                  <strong>Cookies & Tracking:</strong> we use cookies and
                  similar technologies to improve user experience and analyze
                  usage.
                </li>
              </ul>
            </section>

            <section id="use" className="mb-4">
              <h2>3. How We Use Your Information</h2>
              <p>We may use the information collected to:</p>
              <ul>
                <li>Provide, operate, and maintain our Service.</li>
                <li>Improve, personalize, and expand functionality.</li>
                <li>Communicate with you about updates, promotions, and support.</li>
                <li>Process payments and prevent fraudulent activity.</li>
                <li>Comply with legal obligations.</li>
              </ul>
            </section>

            <section id="sharing" className="mb-4">
              <h2>4. Sharing of Information</h2>
              <p>
                We do not sell your personal data. However, we may share your
                information with:
              </p>
              <ul>
                <li>
                  <strong>Service Providers:</strong> who perform services on
                  our behalf (e.g., hosting, analytics, payments).
                </li>
                <li>
                  <strong>Legal Requirements:</strong> if required by law or to
                  protect rights and safety.
                </li>
                <li>
                  <strong>Business Transfers:</strong> in the event of a merger,
                  acquisition, or sale of assets.
                </li>
              </ul>
            </section>

            <section id="security" className="mb-4">
              <h2>5. Data Security</h2>
              <p>
                We implement industry-standard technical and organizational
                measures to safeguard your information. However, no method of
                transmission or storage is 100% secure, and we cannot guarantee
                absolute security.
              </p>
            </section>

            <section id="retention" className="mb-4">
              <h2>6. Data Retention</h2>
              <p>
                We retain your personal information only as long as necessary to
                fulfill the purposes outlined in this policy, comply with our
                legal obligations, resolve disputes, and enforce agreements.
              </p>
            </section>

            <section id="rights" className="mb-4">
              <h2>7. Your Rights</h2>
              <p>Depending on your location, you may have rights including:</p>
              <ul>
                <li>Accessing and obtaining a copy of your data.</li>
                <li>Correcting inaccurate or incomplete information.</li>
                <li>Requesting deletion of your data.</li>
                <li>
                  Opting out of marketing communications by following the
                  unsubscribe instructions.
                </li>
              </ul>
            </section>

            <section id="children" className="mb-4">
              <h2>8. Children’s Privacy</h2>
              <p>
                Our Service is not directed to children under 13 (or the minimum
                age in your jurisdiction). We do not knowingly collect personal
                data from children. If you believe a child has provided us with
                data, please contact us.
              </p>
            </section>

            <section id="changes" className="mb-4">
              <h2>9. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Changes
                will be posted with the updated date at the top. We encourage
                you to review this policy periodically.
              </p>
            </section>

            <section id="contact" className="mb-4">
              <h2>10. Contact Us</h2>
              <p>
                If you have questions or concerns about this Privacy Policy,
                please contact us at:{" "}
                <a href="mailto:privacy@example.com" className="link">
                  privacy@example.com
                </a>
              </p>
            </section>

            <footer className="text-xs text-gray-500 mt-6">
              <p>
                This Privacy Policy template is provided for informational
                purposes and does not constitute legal advice. Consult a
                qualified attorney for compliance with applicable laws (such as
                GDPR, CCPA, etc.).
              </p>
            </footer>
          </article>
        </div>
      </div>
    </div>
  );
}
