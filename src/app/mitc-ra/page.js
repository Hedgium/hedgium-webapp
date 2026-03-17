"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function MitcRaPage() {
  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body gap-4">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  Most Important Terms and Conditions (MITC)
                </h1>
                <p className="text-sm text-base-content/60 mt-1">
                  Research Analyst (RA) – SEBI Registration No. INH000025258
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
                  title="Print MITC-RA"
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
              <ol className="list-decimal list-inside space-y-6">
                <li>
                  <strong>Scope and trade execution</strong>
                  <p className="mt-2 text-base-content/80">
                    These terms and conditions, and consent thereon are for the
                    research services provided by the Research Analyst (RA) and
                    RA cannot execute/carry out any trade (purchase/sell
                    transaction) on behalf of the client. Thus, the clients are
                    advised not to permit RA to execute any trade on their
                    behalf.
                  </p>
                </li>
                <li>
                  <strong>Fee limits</strong>
                  <p className="mt-2 text-base-content/80">
                    The fee charged by RA to the client will be subject to the
                    maximum amount prescribed by SEBI / Research Analyst
                    Administration and Supervisory Body (RAASB) from time to time
                    (applicable only for Individual and HUF Clients).
                  </p>
                  <p className="mt-2 text-sm text-base-content/70">
                    <strong>Note:</strong>
                    <br />
                    2.1. The current fee limit is Rs 1,51,000/- per annum per
                    family of client for all research services of the RA.
                    <br />
                    2.2. The fee limit does not include statutory charges.
                    <br />
                    2.3. The fee limits do not apply to a non-individual client
                    / accredited investor.
                  </p>
                </li>
                <li>
                  <strong>Advance fees and refunds</strong>
                  <p className="mt-2 text-base-content/80">
                    RA may charge fees in advance if agreed by the client. Such
                    advance shall not exceed the period stipulated by SEBI;
                    presently it is one year. In case of pre-mature termination
                    of the RA services by either the client or the RA, the client
                    shall be entitled to seek refund of proportionate fees only
                    for the unexpired period.
                  </p>
                </li>
                <li>
                  <strong>Payment methods</strong>
                  <p className="mt-2 text-base-content/80">
                    Fees to RA may be paid by the client through any of the
                    specified modes like cheque, online bank transfer, UPI, etc.
                    Cash payment is not allowed. Optionally the client can make
                    payments through Centralized Fee Collection Mechanism
                    (CeFCoM) managed by BSE Limited (i.e. currently recognized
                    RAASB).
                  </p>
                </li>
                <li>
                  <strong>Conflicts of interest</strong>
                  <p className="mt-2 text-base-content/80">
                    The RA is required to abide by the applicable
                    regulations/circulars/directions specified by SEBI and RAASB
                    from time to time in relation to disclosure and mitigation of
                    any actual or potential conflict of interest. The RA will
                    endeavor to promptly inform the client of any conflict of
                    interest that may affect the services being rendered to the
                    client.
                  </p>
                </li>
                <li>
                  <strong>Prohibited schemes</strong>
                  <p className="mt-2 text-base-content/80">
                    Any assured/guaranteed/fixed returns schemes or any other
                    schemes of similar nature are prohibited by law. No scheme of
                    this nature shall be offered to the client by the RA.
                  </p>
                </li>
                <li>
                  <strong>No guaranteed returns</strong>
                  <p className="mt-2 text-base-content/80">
                    The RA cannot guarantee returns, profits, accuracy, or
                    risk-free investments from the use of the RA&apos;s research
                    services. All opinions, projections, estimates of the RA are
                    based on the analysis of available data under certain
                    assumptions as of the date of preparation/publication of the
                    research report.
                  </p>
                </li>
                <li>
                  <strong>Market risks and reliance</strong>
                  <p className="mt-2 text-base-content/80">
                    Any investment made based on recommendations in research
                    reports is subject to market risks, and recommendations do
                    not provide any assurance of returns. There is no recourse to
                    claim any losses incurred on the investments made based on
                    the recommendations in the research report. Any reliance
                    placed on the research report provided by the RA shall be as
                    per the client&apos;s own judgement and assessment of the
                    conclusions contained in the research report.
                  </p>
                </li>
                <li>
                  <strong>Certifications and registration</strong>
                  <p className="mt-2 text-base-content/80">
                    The SEBI registration, Enlistment with RAASB, and NISM
                    certification do not guarantee the performance of the RA or
                    assure any returns to the client.
                  </p>
                </li>
                <li>
                  <strong>Grievance redressal</strong>
                  <p className="mt-2 text-base-content/80">
                    For any grievances, follow the steps below:
                  </p>
                  <p className="mt-2 text-base-content/80">
                    <strong>Step 1:</strong> The client should first contact the
                    RA using the details on its website (
                    <a
                      href="/grievance-redressal"
                      className="link link-primary"
                    >
                      www.hedgium.in/grievance-redressal
                    </a>
                    ) or the following contact details:
                    <br />
                    Grievance Officer: Aerik Wadhwani
                    <br />
                    Grievance Email ID:{" "}
                    <a
                      href="mailto:compliance@hedgium.in"
                      className="link link-primary"
                    >
                      compliance@hedgium.in
                    </a>
                  </p>
                  <p className="mt-2 text-base-content/80">
                    <strong>Step 2:</strong> If the resolution is unsatisfactory,
                    the client can also lodge grievances through SEBI&apos;s
                    SCORES platform at{" "}
                    <a
                      href="https://scores.sebi.gov.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link link-primary"
                    >
                      www.scores.sebi.gov.in
                    </a>
                  </p>
                  <p className="mt-2 text-base-content/80">
                    <strong>Step 3:</strong> The client may also consider the
                    Online Dispute Resolution (ODR) through the Smart ODR portal
                    at{" "}
                    <a
                      href="https://smartodr.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link link-primary"
                    >
                      smartodr.in
                    </a>
                  </p>
                </li>
                <li>
                  <strong>Keep contact details updated</strong>
                  <p className="mt-2 text-base-content/80">
                    Clients are required to keep contact details, including
                    email id and mobile number/s updated with the RA at all
                    times.
                  </p>
                </li>
                <li>
                  <strong>Confidentiality & credentials</strong>
                  <p className="mt-2 text-base-content/80">
                    The RA shall never ask for the client&apos;s login
                    credentials and OTPs for the client&apos;s Trading Account,
                    Demat Account, or Bank Account. Never share such information
                    with anyone including RA.
                  </p>
                </li>
              </ol>
            </article>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
