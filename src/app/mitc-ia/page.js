"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function MitcIaPage() {
  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body gap-4">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  Most Important Terms and Conditions (MITC) for Investment Advisers
                </h1>
                <p className="text-sm text-base-content/60 mt-1">
                  Investment Adviser (IA)
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
                  title="Print MITC-IA"
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
                  <p className="text-base-content/80">
                    The Investment Adviser (IA) shall only accept payments
                    towards its fees for Investment Advisory Services and is
                    not permitted to accept funds or securities in its account on
                    the client&apos;s behalf.
                  </p>
                </li>
                <li>
                  <p className="text-base-content/80">
                    The IA does not guarantee returns, accuracy, or risk-free
                    investments. All advice is subject to market risks, and there
                    is no assurance of any returns or profits.
                  </p>
                </li>
                <li>
                  <p className="text-base-content/80">
                    Any assured/guaranteed/fixed returns schemes or any other
                    schemes of similar nature are prohibited by law. No scheme of
                    this nature shall be offered to the client by the IA.
                  </p>
                </li>
                <li>
                  <p className="text-base-content/80">
                    Investment advice, only related to securities shall fall
                    under the purview of SEBI. In case of any services offered by
                    IA related to products/services not under the purview of
                    SEBI, IA shall make disclosure to the client and take
                    appropriate declaration and undertaking from the client that
                    such products/services and the services of IA in respect of
                    such products/services do not come under regulatory purview
                    of SEBI and that no recourse is available to the client with
                    SEBI for grievances related to such products/services or
                    services of IA in respect of such products/services.
                  </p>
                </li>
                <li>
                  <p className="text-base-content/80">
                    This agreement is for the investment advisory services
                    provided by the IA and IA cannot execute/carry out any trade
                    (purchase/sell transaction) on behalf of the client without
                    his/her/its specific and positive consent on every trade.
                    Thus, the client is advised not to permit IA to execute any
                    trade on his/her/its behalf without explicit consent.
                  </p>
                </li>
                <li>
                  <p className="text-base-content/80">
                    The fee charged by IA to the client will be subject to the
                    maximum of amount prescribed by SEBI/Investment Adviser
                    Administration and Supervisory Body (IAASB) from time to time
                    (applicable only for Individual and HUF Clients).
                  </p>
                  <p className="mt-2 text-sm text-base-content/70">
                    <strong>Note:</strong>
                    <br />
                    • The current fee limit under Fixed Fee mode is Rs 1,51,000/-
                    per annum per family of client. Under Assets under Advice
                    (AUA) mode, maximum fee limit is 2.5 per cent of AUA per
                    annum per family of client.
                    <br />
                    • The IA may change the fee mode at any time with the
                    client&apos;s consent; however, the maximum fee limit in such
                    cases shall be higher of fee limit under the fixed fee mode
                    or 2.5 per cent of AUA per annum per family of client.
                    <br />
                    • The fee limits do not include statutory charges.
                    <br />
                    • The fee limits apply only for investment advice related to
                    securities under purview of SEBI.
                    <br />
                    • The fee limits do not apply to a non-individual client /
                    accredited investor.
                  </p>
                </li>
                <li>
                  <p className="text-base-content/80">
                    IA may charge fees in advance if agreed by the client. Such
                    advance shall not exceed the period stipulated by SEBI;
                    presently it is maximum one year. In case of premature
                    termination of the IA services by the client or the IA, the
                    client shall be entitled to seek refund of proportionate fees
                    only for unexpired period. However, IA is entitled to retain
                    a maximum breakage fee of not greater than one-quarter fee.
                  </p>
                </li>
                <li>
                  <p className="text-base-content/80">
                    Fees to IA may be paid by the client through any of the
                    specified modes like cheque, online bank transfer, UPI, etc.
                    Cash payment is not allowed. Optionally the client can make
                    payments through Centralized Fee Collection Mechanism
                    (CeFCoM), managed by BSE Limited (i.e. currently recognized
                    IAASB).
                  </p>
                </li>
                <li>
                  <p className="text-base-content/80">
                    The IA is expected to know the client&apos;s financial
                    details for providing services. Hence, the client is required
                    to share the financial information (e.g. income, existing
                    investments, liabilities, etc.) with the IA.
                  </p>
                </li>
                <li>
                  <p className="text-base-content/80">
                    The IA is required to carry out the client&apos;s risk
                    profiling and suitability analysis before providing
                    services and thereafter on an ongoing basis. The services
                    provided will be in line with the assessed risk profile. IA
                    shall also communicate the assessed risk profile to the
                    client.
                  </p>
                </li>
                <li>
                  <p className="text-base-content/80">
                    As part of conflict-of-interest management, the client or the
                    client&apos;s family members will not be provided any
                    distribution services by IA or any of its group entity/
                    family members. IA shall, wherever available, advice direct
                    plans (non-commission based) of products only.
                  </p>
                </li>
                <li>
                  <p className="text-base-content/80">
                    The IA shall endeavor to promptly inform the client of any
                    conflict of interest that may affect the services being
                    rendered to the client.
                  </p>
                </li>
                <li>
                  <strong>Grievance redressal</strong>
                  <p className="mt-2 text-base-content/80">
                    For any grievances:
                  </p>
                  <p className="mt-2 text-base-content/80">
                    <strong>Step 1:</strong> The client should first contact the
                    IA using the details on its website (
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
                    <strong>Step 2:</strong> If the resolution provided by IA is
                    unsatisfactory, the client can lodge grievances through
                    SEBI&apos;s SCORES platform at{" "}
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
                    <strong>Step 3:</strong> If the client remains dissatisfied
                    with the outcome of the SCORES complaint, the client may
                    consider the Online Dispute Resolution (ODR) through the
                    Smart ODR portal at{" "}
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
                  <p className="text-base-content/80">
                    The SEBI registration, enlistment with IAASB, and NISM
                    certification do not guarantee the performance of IA or
                    assure returns to the client.
                  </p>
                </li>
                <li>
                  <p className="text-base-content/80">
                    Clients are required to keep contact details, including
                    email id and mobile number/s updated with the IA at all
                    times.
                  </p>
                </li>
                <li>
                  <p className="text-base-content/80">
                    The IA shall never ask for the client&apos;s login credentials
                    and OTPs for the client&apos;s Trading Account, Demat Account
                    and Bank Account. Never share such information with anyone
                    including IA.
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
