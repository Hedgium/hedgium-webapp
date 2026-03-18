"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body gap-4">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Privacy Policy</h1>
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
              <section id="introduction" className="mb-6">
                <p>
                  The Website www.hedgium.in and the Application Hedgium
                  (&quot;Platforms&quot;) are owned and operated by Hedgium Services LLP
                  (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;), a
                  limited liability partnership incorporated under the laws of
                  India, having its registered office at Haware City, Thane;
                  Powai, Mumbai; Seawoods, Navi Mumbai, India.
                </p>
                <p>
                  This privacy policy (&quot;Privacy Policy&quot;) explains how
                  we collect, use, share and protect personal information about
                  the users of the Platforms (&quot;you&quot; or
                  &quot;User&quot;). Any capitalized term used but not defined
                  in this Privacy Policy shall have the meaning attributed to it
                  in the Terms of Use.
                </p>
                <p>
                  A condition of each User&apos;s use and access to the
                  Platforms is their acceptance of the Terms of Use, which also
                  involves acceptance of the terms of this Privacy Policy. You
                  agree to the practices and policies outlined in this Privacy
                  Policy and you hereby consent to our collection, use and
                  sharing of your information as described in this Privacy
                  Policy.
                </p>
              </section>

              <section id="type-of-information" className="mb-6">
                <h2>1. Type of Personal or Sensitive Personal Information Collected</h2>
                <ol className="list-decimal list-inside space-y-3">
                  <li>
                    While registering for an account on our Platforms, a User is
                    required to provide personal information so that the
                    Platforms can recognise him and provide the desired Services.
                    The personal information required would include username,
                    name, user ID, e-mail address, contact addresses, date of
                    birth, gender, phone number and password chosen by the User.
                    Other optional information may also be requested on the
                    registration page. We recommend and require that you keep
                    your user ID and password confidential. Further, we recommend
                    that you change your password periodically. We shall not be
                    responsible for any unauthorized access to your account if
                    you share your user ID and Password with anyone or as a
                    consequence of a violation of this Privacy Policy or the
                    Website&apos;s Terms of Use.
                  </li>
                  <li>
                    The information collected from you by the Company may
                    constitute personal information or &apos;sensitive personal
                    data or information&apos; under the Information Technology
                    (Reasonable Security Practices and Procedures and Sensitive
                    Personal Information) Rules, 2011 (&quot;SPI Rules&quot;). The
                    SPI Rules define &quot;sensitive personal data or
                    information&quot; of a person. In the case of our Platform,
                    it would mean personal information about a User relating
                    to: (a) password; (b) financial information such as Bank
                    account or credit card or debit card or other payment
                    instrument details; (c) any detail relating to the above
                    clauses as provided to the Company for providing Services;
                    and (d) any of the information received under above clauses
                    by the Company for processing, stored or processed under
                    lawful contract or otherwise.
                  </li>
                  <li>
                    Information that is freely available in the public domain
                    or accessible under the Right to Information Act, 2005 or
                    any other law will not be regarded as personal information
                    or sensitive personal data or information. The collection
                    of information which has been designated as &apos;sensitive
                    personal data or information&apos; under the SPI Rules
                    requires your express consent. By affirming your assent to
                    this Privacy Policy, you provide your consent to such
                    collection as required under applicable law. Our Services may
                    be unavailable to you in the event such consent is not
                    given.
                  </li>
                  <li>
                    Further, we collect personal information when you are using
                    our financial planning tools or registering with us for
                    setting up of an user account. This may include, inter alia,
                    your PAN Card number and image, Aadhaar card number and
                    image and relevant proofs of the same. This information is
                    primarily collected for regulatory compliance with
                    applicable laws in order to enable and/or activate your
                    account and to enable you to conduct online transactions.
                  </li>
                  <li>
                    This information will be stored with us and shared with
                    select third parties such as our group companies, affiliate
                    companies etc. in order to enable us to complete your
                    registration as a client with us, generate and send
                    reminders, alerts, notifications to you for transactions,
                    upcoming funds transfers etc.
                  </li>
                </ol>
              </section>

              <section id="information-via-technology" className="mb-6">
                <h2>2. Information Collected via Technology</h2>
                <p>
                  Due to the communications standards on the internet, when a
                  User visits the Website, we automatically receive the URL of
                  the site from which anyone visits. We also receive the Internet
                  Protocol (&quot;IP&quot;) address of each User&apos;s computer
                  (or the proxy server a User used to access the World Wide Web),
                  User&apos;s computer/ device operating system and type of web
                  browser the User is using, email patterns, as well as the name
                  of User&apos;s internet service provider. This information is
                  used to analyse overall trends to help the Company improve its
                  Service. The linkage between User&apos;s IP address and
                  User&apos;s personally identifiable information may be
                  available to us but is not shared with other third parties.
                  The Platforms may use cookies to store certain data (that is
                  not sensitive personal data or information) that is used by us
                  for the technical administration of the Website, Application,
                  research and development, and for User administration.
                </p>
              </section>

              <section id="purpose" className="mb-6">
                <h2>3. Purpose of Collection and Usage of Information</h2>
                <ol className="list-decimal list-inside space-y-3">
                  <li>
                    The Platforms collect the information which is voluntarily
                    provided by the User to create and personalise the
                    User&apos;s account on the Platforms and enhance the quality
                    of Services. You understand that the Company may use certain
                    information of yours, which has been designated as
                    &apos;sensitive personal data or information&apos; under the
                    SPI Rules: (a) for the purpose of providing you the
                    Services, (b) for commercial purposes and in an aggregated or
                    non-personally identifiable form for research, statistical
                    analysis and business intelligence purposes, (c) for sale or
                    transfer of such research, statistical or intelligence data
                    in an aggregated or non-personally identifiable form to our
                    advertisement, strategic and marketing partners. The Company
                    also reserves the right to use information provided by or
                    about the User for the following purposes: (1) Publishing
                    such information on the Platforms; (2) Contacting the User
                    for offering new services; (3) Contacting the User for taking
                    feedback or for providing support; (4) Analysing software
                    usage patterns for improving product design and utility; and
                    (5) Analysing anonymized information for commercial use.
                  </li>
                  <li>
                    Information other than the personal information or sensitive
                    personal data or information, that does not personally
                    identify the Users as an individual, is collected by the
                    Company from Users (such as, patterns of utilization
                    described above) and is exclusively owned by the Company.
                    Such anonymized information may be used for research and
                    development of new technologies and shared with the third
                    parties for commercial use.
                  </li>
                  <li>
                    The Platforms shall, prior to the collection of information
                    including sensitive personal data or information, provide an
                    option to the User to not to provide the data or information
                    sought to be collected. The User shall, at any time while
                    availing the services or otherwise, also have an option to
                    withdraw its consent given earlier to the Platforms. In the
                    case of the User not providing or later on withdrawing his
                    consent, the Company and the Platforms shall have the option
                    not to provide services for which the said information was
                    sought.
                  </li>
                </ol>
              </section>

              <section id="third-party" className="mb-6">
                <h2>4. Third Party Links</h2>
                <ol className="list-decimal list-inside space-y-3">
                  <li>
                    This Privacy Policy applies to the Platforms that are
                    owned and operated by the Company. We do not exercise
                    control over the third-party sites or links that may be
                    displayed or embedded within the Platforms. These other sites
                    may place their own cookies or other files on the
                    User&apos;s computer, collect data or solicit personal
                    information from the Users, for which the Company is not
                    responsible or liable. Accordingly, the Company does not make
                    any representations concerning the privacy practices or
                    policies of such third parties or terms of use of such
                    websites.
                  </li>
                  <li>
                    The Company does not guarantee the accuracy, integrity, or
                    quality of the information, data, text, software, sound,
                    photographs, graphics, videos, messages or other materials
                    available on such websites. The inclusion or exclusion does
                    not imply any endorsement by the Company of the website, the
                    website&apos;s provider, or the information on the website.
                    If you decide to visit a third-party website linked to the
                    Website, you do this entirely at your own risk. The Company
                    encourages the User to read the privacy policies of such
                    third-party websites.
                  </li>
                  <li>
                    Our Website and the Application may include social media
                    buttons for Twitter, Instagram, Facebook, Tumblr etc.
                    (&quot;Features&quot;). These Features may collect your IP
                    address, which page you are visiting on our site, and may
                    set a cookie to enable the Feature to function properly. Your
                    interactions with these Features are governed by the privacy
                    statement of the Company providing them.
                  </li>
                </ol>
              </section>

              <section id="retention" className="mb-6">
                <h2>5. Retention of Information</h2>
                <p>
                  If you wish to cancel your account or request that we no
                  longer use your information to provide you the Services,
                  contact us through{" "}
                  <a href="mailto:clients@hedgium.ai" className="link">
                    clients@hedgium.ai
                  </a>
                  . We will retain your information for as long as your account
                  on the Platforms is active and as needed to provide you the
                  Services. We shall not retain such information for longer
                  than is required for the purposes for which the information
                  may lawfully be used or is otherwise required under any other
                  law for the time being in force. After a period of time, your
                  data may be anonymized and aggregated, and then may be held
                  by us as long as necessary for us to provide our Services
                  effectively or improve the Services, but our use of the
                  anonymized data will be solely for analytic purposes.
                </p>
              </section>

              <section id="disclosure" className="mb-6">
                <h2>6. Disclosure of Information</h2>
                <p>
                  The Company will only disclose your personal information,
                  other than as specifically stated in this Privacy Policy, in
                  the event it is required to do so by law, rule, regulation,
                  law enforcement agency, governmental official, legal authority
                  or similar requirements or when the Company, in its sole
                  discretion, deems it necessary in order to protect its rights
                  or the rights of others or to enforce or apply the Terms of
                  Use. The Company may also disclose or transfer User&apos;s
                  personal and other information, to a third party as part of
                  reorganization or a sale of the assets of a Company division
                  or company. Any third party to which the Company transfers or
                  sells its assets to will have the right to continue to use the
                  personal and other information that Users provide to us, in
                  accordance with the Terms of Use.
                </p>
              </section>

              <section id="liability" className="mb-6">
                <h2>7. Limited Liability</h2>
                <p>
                  The Company shall not be held liable for any loss whatsoever
                  incurred by the User for any data loss or theft due to
                  unauthorized access to the User&apos;s electronic devices
                  through which the User avails the Services. The Company will
                  implement reasonable security practices and procedures that
                  are commensurate with respect to the information being
                  collected and the nature of the Company&apos;s business. The
                  Company is committed to protecting the security of your
                  information. We use a variety of industry-standard security
                  technologies and procedures to help protect your information
                  from unauthorized access, use, or disclosure. However, no
                  method of transmission over the Internet, or method of
                  electronic storage, is completely secure. Therefore, while the
                  Company uses reasonable efforts to protect your information,
                  it cannot guarantee its absolute security.
                </p>
              </section>

              <section id="casual-visitors" className="mb-6">
                <h2>8. Casual Visitors Note</h2>
                <p>
                  No sensitive personal data or information is automatically
                  collected by the Company from any casual visitors, who are
                  merely perusing the Platforms. Nevertheless, certain
                  provisions of this Privacy Policy are applicable to even such
                  casual visitors, and such casual visitors are also required to
                  read and understand the privacy statements set out herein,
                  failing which they are required to leave the Website or
                  Application immediately. You are not a casual visitor if you
                  have willingly submitted any personal data or information to
                  the Company through any means, including email, post or
                  through the registration process on the Website or
                  Application. All such visitors will be deemed to be, and will
                  be treated as, Users for the purposes of this Privacy Policy,
                  and in which case, all the statements in this Privacy Policy
                  apply to such persons.
                </p>
              </section>

              <section id="confidentiality" className="mb-6">
                <h2>9. Confidentiality and Security</h2>
                <p>
                  Your personal information is maintained by the Company in
                  electronic form. Such information may also be converted to
                  physical form from time to time. We take necessary precautions
                  to protect your personal information both online and off-line,
                  and implements reasonable security practices and measures
                  including certain managerial, technical, operational and
                  physical security control measures that are commensurate with
                  respect to the information being collected and the nature of
                  the Company&apos;s business. The Company is not responsible
                  for the confidentiality, security or distribution of your
                  personal information by third parties outside the scope of our
                  agreement with them. Further, the Company shall not be
                  responsible for any breach of security or for any actions of
                  any third parties or events that are beyond the reasonable
                  control of the Company including, acts of government, computer
                  hacking, unauthorised access to computer data and storage
                  device, computer crashes, breach of security and encryption,
                  poor quality of internet service or telephone service of the
                  User.
                </p>
              </section>

              <section id="changes" className="mb-6">
                <h2>10. Changes to Privacy Policy</h2>
                <p>
                  We reserve the right to change, modify, add or delete portions
                  of the terms of this Privacy Policy, at our sole discretion, at
                  any time, with or without advance notice. The Company will
                  inform the Users regarding any change or amendment in the
                  Terms via email or notice on the Website, once a year. If you
                  object to any of the changes to our terms, and you no longer
                  wish to use the Services, you may contact{" "}
                  <a href="mailto:clients@hedgium.ai" className="link">
                    clients@hedgium.ai
                  </a>{" "}
                  to deactivate your account. Unless stated otherwise, the
                  Company&apos;s current Privacy Policy applies to all
                  information that the Company has about you and your account. If
                  a User uses the Platforms after a notice of changes has been
                  sent to such User or published on the Platforms, such User
                  hereby provides his consent to the changed terms. We permit the
                  User, as and when requested by them, to review the information
                  they had provided and ensure that any personal information or
                  sensitive personal data or information found to be inaccurate
                  or deficient shall be corrected or amended as feasible.
                </p>
              </section>

              <section id="contact" className="mb-6">
                <h2>11. Address for Privacy Questions</h2>
                <p>
                  If you have questions about this Privacy Policy or the
                  Company&apos;s information collection, use and disclosure
                  practices, you may contact us at{" "}
                  <a href="mailto:clients@hedgium.ai" className="link">
                    clients@hedgium.ai
                  </a>
                  . We will use reasonable efforts to respond promptly to any
                  requests, questions or concerns, which you may have regarding
                  our use of your personal information.
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
