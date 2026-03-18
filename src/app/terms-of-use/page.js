"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsOfUsePage() {
  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body gap-4">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  Terms of Use for Client
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Last updated:{" "}
                  <time dateTime="2025-03-17">March 17, 2025</time>
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
                  title="Print terms of use"
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
              <section id="introduction" className="mb-6">
                <p>
                  Thank you for visiting our website www.hedgium.in and for
                  downloading our mobile application Hedgium (&quot;Application&quot;).
                  The website, application or any other computer Platform are
                  hereinafter collectively referred to as the &quot;Platform&quot;
                  or &quot;Website&quot;. The Platforms are Internet based
                  portals owned and operated by Hedgium LLP (&quot;Company&quot;),
                  a limited liability partnership incorporated under the laws of
                  India, having its registered office at Haware City, Thane;
                  Powai, Mumbai; Seawoods, Navi Mumbai, India.
                </p>
                <p>
                  The Company is a research analyst registered with Securities
                  and Exchange Board of India (&quot;SEBI&quot;) under registration
                  no. INH000025258.
                </p>
                <p>
                  This page (read in conjunction with our Privacy Policy)
                  details the terms and conditions on which Hedgium LLP and its
                  affiliates (&quot;Company&quot;, &quot;We&quot;, &quot;Us&quot;,
                  &quot;Our&quot;) provide their services (&quot;Services&quot;)
                  on the Platforms (&quot;Terms&quot;).
                </p>
                <p>
                  These Terms become effective on any person accessing or using
                  any of the Platforms or availing the Services offered by the
                  Company (&quot;User&quot;). For these Terms, the term
                  (&quot;you&quot;) refers to the User or visitor of the
                  Platforms.
                </p>
                <p>
                  Both parties agree to undertake online conciliation and/or
                  online arbitration by participating in the ODR Portal and/or
                  undertaking dispute resolution in the manner specified in the
                  SEBI circular no. SEBI/HO/OIAE/OIAE_IAD-1/P/CIR/2023/131 dated
                  July 31, 2023, on &quot;Online Resolution of Disputes in the
                  Indian Securities Market&quot;.
                </p>
              </section>

              <section id="acceptance" className="mb-6">
                <h2>1. Acceptance of Terms</h2>
                <p>
                  The Services of the Company can be availed by the User only by
                  accepting the Terms. These Terms constitute a legally binding
                  and enforceable agreement between you and the Company and your
                  use of the Platforms signifies your irrevocable and
                  unconditional acceptance of the Terms.
                </p>
              </section>

              <section id="registration" className="mb-6">
                <h2>2. Registration and Account Information</h2>
                <p>
                  To access the Platform, you need to register on the Platform
                  and open an account by completing the registration process.
                  Each registration is for a single individual user only. You
                  agree that any information you give to the Company will always
                  be accurate, correct and up to date.
                </p>
                <p>
                  You shall not disclose your password or account information
                  (&quot;Access Credentials&quot;) to any person. You shall
                  notify the Company immediately of any unauthorized use of your
                  account or any other breach of security. The Company will not
                  be liable for any unauthorised use of your account and for any
                  loss that you may incur as a result of such unauthorised use.
                  However, you shall continue to be liable to indemnify the
                  Company for any losses incurred by it either directly or
                  indirectly as a result of the unauthorised use of your account.
                </p>
              </section>

              <section id="services" className="mb-6">
                <h2>3. Services</h2>
                <ol className="list-decimal list-inside space-y-3">
                  <li>
                    The Company shall provide Services as provided by a SEBI
                    registered research analyst, including but not restricted to
                    information or views on investments or markets such as
                    making buy/sell/hold recommendations in equity and
                    derivative markets, investment analysis or offering an
                    opinion on a public offer with respect to securities that
                    are listed or to be listed in a stock exchange or with
                    respect to any other entities (collectively referred to as
                    Publication/(s)), to the extent permitted by the relevant
                    laws and regulations. Publication/(s) may use modelling
                    methodologies and statistical techniques, which we assume you
                    are already familiar with.
                  </li>
                  <li>
                    The User has subscribed to the Website to receive the
                    Services and agree to receive research reports, research
                    analysis, research recommendation or an opinion concerning
                    securities or public offer, providing a basis for investment
                    decision, in the form of: (1) SMS alerts on registered mobile
                    number; (2) Periodic emails on the registered e-mail id; (3)
                    Newsletters on the Website; (4) Conversation in the form of
                    chats; (5) Content and trading ideas available on the
                    Platform; (6) Any other tools employed by the Website.
                  </li>
                </ol>
              </section>

              <section id="declarations" className="mb-6">
                <h2>4. Declarations by the User</h2>
                <ol className="list-decimal list-inside space-y-3">
                  <li>
                    The User shall not share his/her Access Credentials with any
                    third person and shall exercise complete care in protecting
                    and maintaining the confidentiality of his/her Access
                    Credentials.
                  </li>
                  <li>
                    The User agrees and confirms that the Company shall not be
                    responsible for any transactions arising out of any misuse
                    of his/her Access Credentials. The User shall adopt adequate
                    security measures to prevent any unauthorised access to
                    their Platform account, and the Company shall not be liable
                    for any such unauthorised access.
                  </li>
                  <li>
                    The User shall not hold liable the Company, its directors,
                    officers, representatives and employees for any claim, suit,
                    action, loss, damage, expense or any breach of law in this
                    context, which he/she may incur as a result of his/her
                    decision to invest in any products or services, based on our
                    Publications, whether directly or through its partners.
                  </li>
                  <li>
                    The User understands that returns on investments are not
                    guaranteed and that he/she has gone/shall go through all
                    investment related documents prior to making any investment
                    decision, and should consult with financial advisor/(s), if
                    required, before taking any decisions or actions based on
                    any of the trading ideas, investment ideas, or live funds on
                    the platform.
                  </li>
                  <li>
                    The User understands that derivative trading is extremely
                    risky in nature with the possibility of losing some or all of
                    the capital invested.
                  </li>
                  <li>
                    The Company shall make reasonable efforts to keep all the
                    information relating to your dealings through your account
                    on the Platform confidential. Provided however that the
                    Company shall be entitled to disclose any information or
                    particulars pertaining to you to any authority, statutory or
                    otherwise, as may be required by law or by a third-party
                    service provider required to complete any transactions
                    requested by you. The User understands that the Company
                    reserves the right to disclose your personal information to
                    any regulatory authority such as, but not limited to, the
                    SEBI, Reserve Bank of India (&quot;RBI&quot;), the Income
                    Tax Department, if required under any law or if directed to
                    do so by a court of competent jurisdiction.
                  </li>
                  <li>
                    The User agrees that the data and information shared by them
                    with the Company can be further shared with its authorised
                    agents, representatives, affiliates, group companies and
                    subsidiaries for facilitating transaction processing,
                    servicing, data processing, transaction statement generation
                    and for the handling and resolution of any queries received
                    from them.
                  </li>
                  <li>
                    The User understands that the Services and Publications
                    provided by the Company are not in the nature of investment
                    advice, as defined under the SEBI (Investment Advisers)
                    Regulations, 2013.
                  </li>
                  <li>
                    The User understands that the data and information provided
                    on the Website does not constitute advice and shall not be
                    relied upon by the User while making investment decisions.
                    The User understands that they shall not make investment
                    decisions based on the information contained on the Website
                    without independently consulting with duly registered and
                    qualified advisors and that, if the User chooses to engage
                    in such transactions with or without seeking advice from a
                    duly registered and qualified financial advisor, then such
                    decision and any consequences flowing therefrom are his sole
                    responsibility.
                  </li>
                  <li>
                    User confirms that the Publication/(s) are prepared for
                    persons who have experience in matters related to
                    investments or are investment professionals with sufficient
                    financial sophistication to be able to appraise and evaluate
                    the information received or accessed, including, where
                    appropriate, a full understanding of the credit risks
                    inherent in new debt issues and the price volatility of
                    stocks when brought to the market. The Publication/(s) may
                    not be suitable for all investors.
                  </li>
                  <li>
                    The User understands that while the views expressed in the
                    Publication/(s) would generally be ours as of the date of
                    the Publication/(s), some or all of the views contained
                    therein may be based on the views of one or several of our
                    sources. All opinions, estimates and projections provided by
                    such sources or the author/(s) are as of the date of such
                    Publication/(s) and are subject to change without notice and
                    we have no obligation to update any views, opinion, estimates
                    or projections set forth therein.
                  </li>
                  <li>
                    The User understands that the Company shall not provide any
                    promise or assurance of favourable review in its research
                    report to a company or industry or sector or group of
                    companies or business group as consideration to commence or
                    influence a business relationship or for the receipt of
                    compensation or other benefits.
                  </li>
                </ol>
              </section>

              <section id="user-conduct" className="mb-6">
                <h2>5. User Conduct and Rules</h2>
                <p>
                  You agree and undertake to use the Platforms only for the
                  purposes that are permitted by the Terms and any applicable
                  law, regulation or generally accepted practices or guidelines
                  in the relevant jurisdictions. By way of example, and not as a
                  limitation, you agree and undertake that while using our
                  Services or accessing our Platforms, you will not:
                </p>
                <ol className="list-decimal list-inside space-y-2 mt-3">
                  <li>
                    Host, display, upload, modify, publish, transmit, store,
                    update or share any information that belongs to another
                    person and to which you do not have any right;
                  </li>
                  <li>
                    Upload files that infringe any patent, trademark, copyright
                    or other proprietary rights;
                  </li>
                  <li>
                    Defame, abuse, harass, stalk, threaten or otherwise violate
                    the legal rights of others;
                  </li>
                  <li>
                    Post, upload, or disseminate any inappropriate, profane,
                    defamatory, infringing, obscene, indecent or unlawful topic,
                    name, material or information;
                  </li>
                  <li>
                    Download, copy or imitate any portion of Platform, its
                    underlying software and content, or its user interface, or
                    the Website, except as expressly permitted by us;
                  </li>
                  <li>
                    Deceive or mislead the addressee about the origin of the
                    message or knowingly and intentionally communicate any
                    information which is patently false or misleading in nature
                    but may reasonably be perceived as a fact;
                  </li>
                  <li>
                    Access or attempt to access any of the Services by any means
                    other than through the interface that is provided by the
                    Company, except as expressly permitted by us, and shall
                    ensure that you comply with the instructions set out in any
                    robots.txt file present on the Services;
                  </li>
                  <li>
                    Seek to transact any fraudulent or illegal activity, through
                    any means or corrupt practices, including but not limited to
                    hacking, password mining, deceptive impersonation of another
                    person, misrepresentation of your affiliation with a person
                    or entity, hiding or attempting to hide your true identity or
                    location (including via proxy server or otherwise) or
                    providing false, inaccurate or altered documentation,
                    information or identification;
                  </li>
                  <li>
                    Circumvent or seek to circumvent any security measures or
                    other features meant to protect the security of the Website
                    and the users&apos; security;
                  </li>
                  <li>
                    Upload files that contain software or other material
                    protected by intellectual property laws unless you own or
                    control the rights thereto or have received all necessary
                    consents;
                  </li>
                  <li>
                    Upload files that are patently false and untrue, and are
                    written or published in any form, with the intent to mislead
                    or harass a person, entity or agency for financial gain or
                    to cause any injury to any person;
                  </li>
                  <li>
                    Upload files that contain viruses, corrupted files, or any
                    other similar software or programs that may damage the
                    operation of the Platforms;
                  </li>
                  <li>
                    Violate any code of conduct or other guidelines, which may
                    apply for or to the Services;
                  </li>
                  <li>
                    Violate any applicable laws or regulations for the time
                    being in force in India;
                  </li>
                  <li>Violate, abuse, unethically manipulate or exploit, any of the Terms.</li>
                </ol>
              </section>

              <section id="termination" className="mb-6">
                <h2>6. Termination of Account or Services</h2>
                <p>
                  You agree that the Company may at any time and for any or no
                  reason, terminate your access to the Platforms, or restrict or
                  suspend your access to all or any part of the Website or the
                  Application at any time, with or without prior notice, and
                  without liability. The Company reserves the right to cancel
                  your rights to access the Platforms if it believes that you are
                  using any of the Platforms in breach of these Terms.
                </p>
              </section>

              <section id="ip" className="mb-6">
                <h2>7. Intellectual Property Rights</h2>
                <p>
                  All materials on our Platforms, including, without limitation,
                  names, logos, trademarks, images, text, columns, graphics,
                  videos, photographs, illustrations, artwork, software and other
                  elements (collectively, &quot;Material&quot;) are protected
                  by copyrights, trademarks and/or other intellectual property
                  rights owned and controlled by the Company. You acknowledge and
                  agree that all content on our Platforms is made available for
                  limited, non-commercial, personal use only. You may not add,
                  delete, distort, or otherwise modify the Material.
                </p>
                <p>
                  The Company is the sole owner of the Platforms and all
                  software created to provide you with the Services. The Company
                  provides you with a single limited license to download, use and
                  access the Platforms on your devices for the limited purpose
                  of using the Services. The license is specifically personal,
                  non-transferable, non-licensable and non-exclusive.
                </p>
              </section>

              <section id="third-party" className="mb-6">
                <h2>8. Links to Third Parties</h2>
                <p>
                  Platforms will contain links to other websites (&quot;Linked
                  Sites&quot;). The Linked Sites are not under the control of
                  the Company, and the Company is not responsible for the
                  contents of any Linked Site, including without limitation any
                  link contained in a Linked Site, or any changes or updates to
                  a Linked Site. If you decide to access any such linked
                  third-party website, you do so at your own risk. The Company
                  disclaims all responsibility and liability as regards the
                  services, conduct or actions of such third party.
                </p>
              </section>

              <section id="force-majeure" className="mb-6">
                <h2>9. Force Majeure</h2>
                <p>
                  The Company shall have no liability to you whatsoever for any
                  interruption or delay in its Services, or to access the
                  Platforms if such interruption, delay, or inability is caused
                  by a force majeure event. A &quot;Force Majeure Event&quot;
                  means any event or circumstance beyond the reasonable control
                  of the Company including but not limited to an act of God,
                  fire, explosion, flood, epidemic, power failure, governmental
                  actions including acts of government officials or police
                  authorities, war or threat of war, acts of terrorism, national
                  emergency, riot, civil disturbance, sabotage, labour disputes,
                  strikes, pandemic, epidemic, change in law or policies, court
                  orders, cyber threats and cyber-attacks including those
                  resulting from malware, trojans, ransomware, data breach,
                  hacking, or malicious damage to the Platforms.
                </p>
              </section>

              <section id="indemnity" className="mb-6">
                <h2>10. Indemnity</h2>
                <ol className="list-decimal list-inside space-y-3">
                  <li>
                    You agree to indemnify, defend and hold harmless the Company,
                    its service providers, its partners and their officers and
                    agents from and against all losses, liabilities, claims,
                    damages, costs and expenses (including legal fees and
                    disbursements in connection therewith and interest
                    chargeable thereon) asserted against or incurred by the
                    Company that arise out of or result from or maybe payable by
                    virtue of any breach or non-performance of any
                    representation, warranty, covenant or agreement made or
                    obligation to be performed by you under these Terms.
                  </li>
                  <li>
                    You agree that the Company, its service providers and their
                    officers and agents are not liable for any loss caused
                    through a fall in value of investments etc which can go up
                    or down depending on the factors and forces affecting
                    capital markets or any indirect, special or consequential
                    loss you might suffer.
                  </li>
                  <li>
                    You agree and undertake not to hold the Company and its
                    service providers liable for the following: (1) for any loss
                    or damage incurred or suffered by you due to any error or
                    defect arising from or caused by any reason whatsoever; (2)
                    for any fraud, negligence/mistake or misconduct by you; (3)
                    for any breach or non-compliance by you of these Terms of
                    Use.
                  </li>
                </ol>
              </section>

              <section id="disclaimer" className="mb-6">
                <h2>11. Disclaimer of Warranties</h2>
                <ol className="list-decimal list-inside space-y-3">
                  <li>
                    The Company shall not be liable for any, direct, indirect,
                    punitive, incidental, special, consequential, damages
                    including, without limitation, damages for loss of business
                    projects, damage to your computer system, loss of profits,
                    loss of data arising out of the use of the Platforms, delay
                    or inability to use the Platforms, failure to provide the
                    Services, or for any failure of performance, error, omission,
                    interruption, deletion, defect, delay in operation or
                    transmission, computer virus, communications line failure,
                    theft or destruction or unauthorised access to, alteration
                    of, or use of the information contained on the Platforms,
                    shutting down of the whole or part of the Services that
                    might result in any loss of information, non-retrieval or
                    loss of data, or arising out of the inability to use any
                    Services.
                  </li>
                  <li>
                    No advice or information, whether oral or written, obtained
                    by you from the Company or from the Services shall create
                    any warranty not expressly stated in the terms.
                  </li>
                </ol>
              </section>

              <section id="investment-disclosure" className="mb-6">
                <h2>12. General Investment Disclosure</h2>
                <ol className="list-decimal list-inside space-y-3">
                  <li>
                    The content and data available on the Platform are for
                    information and illustration purposes only. Charts and
                    performance numbers are back-tested/simulated results
                    calculated via a standard methodology and do not include the
                    impact of transaction fees and other related costs. Data
                    used for calculation of historical returns and other
                    information is provided by exchange approved third party
                    data vendors and has neither been audited nor validated by
                    the Company. All information present on the Platform is to
                    help investors in their decision-making process and shall
                    not be considered as a recommendation or solicitation of an
                    investment or investment strategy. The investors are
                    responsible for their investment decisions and are
                    responsible to validate all the information used to make the
                    investment decision. Investors should understand that
                    his/her investment decision is based on personal investment
                    needs and risk tolerance and the performance information
                    available on the Platform is one among many other things
                    that should be considered while making an investment
                    decision. Past performance does not guarantee future returns
                    and performance of the strategies you pick are subject to
                    market risk.
                  </li>
                  <li>
                    Investments are subject to market risk. The User should refer
                    to the offering documents or information memorandum and the
                    specific risk factors before investing. Unless expressly
                    stated, products mentioned in the Publication/(s) are not
                    guaranteed by Company or its affiliates.
                  </li>
                  <li>
                    Nothing in the Publication/(s) shall constitute an
                    investment recommendation made by us nor is it intended to
                    form the sole basis for any evaluation of the securities or
                    any other instrument which may be discussed in it or any
                    investment decision. Unless there is an explicit and recorded
                    recognition on our part, in relation to a particular
                    transaction, that investment advice is being offered on the
                    basis of such Publication/(s), you acknowledge that any
                    such investment decisions you make in relation to the
                    Publication/(s), will not be treated as advised by us. Save
                    as stated above, in every other circumstance, you
                    acknowledge that you will assume responsibility for any
                    investment decisions you make further to the information
                    contained in the Publication/(s). Unless required by
                    applicable laws and regulations (if any), neither us nor any
                    of our directors, partners, or employees accepts any
                    liability whatsoever for any losses arising from any use of
                    or reliance upon the Publication/(s) or its contents, or
                    for any omission.
                  </li>
                  <li>
                    We believe the information contained in the Publication/(s)
                    is reliable however, we make no representation as to the
                    accuracy or completeness of information contained in such
                    Publication/(s) which is stated to have been obtained from or
                    is based upon trade and statistical services or other
                    third-party sources. Any data on past performance, modelling
                    or back-testing contained therein is no indication as to
                    future performance. No representation is made as to the
                    reasonableness of the assumptions made within or the
                    accuracy or completeness of any modelling or back-testing.
                    The value of any investment may fluctuate as a result of
                    market changes. There can be no assurance or guarantee that
                    any investment will achieve any particular return. Past
                    performance is not necessarily an indicator of the future
                    performance of any investment.
                  </li>
                </ol>
              </section>

              <section id="modification" className="mb-6">
                <h2>13. Modification</h2>
                <p>
                  The Company reserves the right to modify, amend or waive any of
                  the provisions of these Terms, from time to time entirely at its
                  own discretion. You agree and understand that you are
                  responsible for checking these Terms periodically to remain in
                  compliance with these Terms. The Company will inform you, once
                  in a year, regarding the updated and amended Terms of the
                  Platforms. Your use of the Platforms after any amendment to
                  the Terms shall constitute your acceptance of such amended
                  Terms.
                </p>
              </section>

              <section id="entire-agreement" className="mb-6">
                <h2>14. Entire Agreement</h2>
                <p>
                  These Terms along with the Privacy Policy shall constitute the
                  final, complete and exclusive statement of the agreement
                  between the Company and the User with respect to the use of the
                  Website and the Application.
                </p>
              </section>

              <section id="waiver" className="mb-6">
                <h2>15. Waiver and Severability</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    The failure of the Company to exercise any right as per these
                    Terms shall not constitute a waiver of such right. Any
                    express waiver or failure to exercise promptly any right
                    under the Terms will not create a continuing waiver or any
                    expectation of non-enforcement. No waiver of any breach of
                    these Terms shall waive any other breach, and no waiver shall
                    be effective unless made in writing.
                  </li>
                  <li>
                    If any provision of these Terms is held invalid by any court
                    or tribunal in a final decision from which no appeal is or
                    can be taken, such provision shall be deemed modified to
                    eliminate the invalid element and, as so modified, such
                    provision shall be deemed a part of these Terms. The
                    remaining provisions of these Terms shall not be affected by
                    such modification.
                  </li>
                </ul>
              </section>

              <section id="governing-law" className="mb-6">
                <h2>16. Governing Law and Venue</h2>
                <p>
                  These Terms shall be governed by the laws of India. The courts
                  of Mumbai shall have exclusive jurisdiction over any disputes
                  arising under these Terms.
                </p>
              </section>

              <section id="grievance" className="mb-6">
                <h2>17. Grievance Officer</h2>
                <p>
                  Any complaints, abuse or concerns with regards to content and
                  or comment or breach of these Terms shall be immediately
                  informed to the designated Grievance Officer or at the customer
                  care e-mail as mentioned below in writing or through e-mail.
                  The Company shall not be responsible for any communication, if
                  addressed, to any non-designated person in this regard.
                </p>
                <p>
                  <strong>Compliance Officer / Grievance Officer:</strong> Aerik
                  Wadhwani
                  <br />
                  Email:{" "}
                  <a href="mailto:compliance@hedgium.in" className="link">
                    compliance@hedgium.in
                  </a>
                </p>
                <p>
                  For general inquiries:{" "}
                  <a href="mailto:clients@hedgium.ai" className="link">
                    clients@hedgium.ai
                  </a>
                </p>
              </section>
            </article>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
