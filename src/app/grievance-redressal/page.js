"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const HEDGIUM_ADDRESS = "Haware City, Thane; Powai, Mumbai; Seawoods, Navi Mumbai, Maharashtra, India";

const ESCALATION_ROWS = [
  { designation: "Customer Care", email: "contact@hedgium.in", contactKey: "phone" },
  { designation: "Compliance Officer", email: "compliance@hedgium.in", contactKey: null },
  { designation: "Principal Officer", email: "kamlesh.ramchandani@hedgium.in", contactKey: "8454838304" },
];

export default function GrievanceRedressalPage() {
  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body gap-4">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  Grievance Redressal
                </h1>
                <p className="text-sm text-base-content/60 mt-1">
                  SEBI Registered Research Analyst – INH000025258
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
                  title="Print grievance redressal"
                >
                  Print
                </a>
              </div>
            </header>

            <div className="divider my-0" />

            <article id="printable" className="prose prose-sm md:prose-md max-w-none">
              <p className="text-base-content/80 mb-6">
                Client&apos;s queries / complaints may arise due to lack of
                understanding or a deficiency of service experienced by clients.
                Deficiency of service may include lack of explanation,
                clarifications, understanding which escalates into shortfalls in
                the expected delivery standards, either due to inadequacy of
                facilities available or through the attitude of staff towards
                client.
              </p>

              <ol className="list-decimal list-inside space-y-4 mb-8">
                <li>
                  <strong>Grievance Officer:</strong> Aerik Wadhwani. He can be
                  reached at{" "}
                  <a
                    href="mailto:compliance@hedgium.in"
                    className="link link-primary"
                  >
                    compliance@hedgium.in
                  </a>
                  .
                </li>
                <li>
                  Clients can seek clarification to their query and are further
                  entitled to make a complaint in writing. An email may be sent
                  to the Client Servicing Team on{" "}
                  <a
                    href="mailto:contact@hedgium.in"
                    className="link link-primary"
                  >
                    contact@hedgium.in
                  </a>
                  .
                </li>
                <li>
                  A letter may also be written with their query/complaint and
                  posted at the below mentioned address:
                  <br />
                  <span className="font-medium">{HEDGIUM_ADDRESS}</span>
                </li>
                <li>
                  Clients can write to the research analyst at{" "}
                  <a
                    href="mailto:kamlesh.ramchandani@hedgium.in"
                    className="link link-primary"
                  >
                    kamlesh.ramchandani@hedgium.in
                  </a>
                  , if the Investor does not receive a response within 10
                  business days of writing to the Client Servicing Team. The
                  client can expect a reply within 10 business days of
                  approaching research analyst.
                </li>
                <li>
                  In case you are not satisfied with our response you can lodge
                  your grievance with SEBI at{" "}
                  <a
                    href="https://scores.sebi.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary"
                  >
                    scores.sebi.gov.in
                  </a>{" "}
                  or you may also write to any of the offices of SEBI. SCORES
                  may be accessed through SCORES mobile application as well.
                </li>
                <li>
                  ODR Portal could be accessed, if unsatisfied with the
                  response. Your attention is drawn to the SEBI circular no.
                  SEBI/HO/OIAE/OIAE_IAD-1/P/CIR/2023/131 dated July 31, 2023, on
                  &quot;Online Resolution of Disputes in the Indian Securities
                  Market&quot;. A common Online Dispute Resolution Portal
                  (&quot;ODR Portal&quot;) which harnesses conciliation and
                  online arbitration for resolution of disputes arising in the
                  Indian Securities Market has been established. ODR Portal can
                  be accessed via{" "}
                  <a
                    href="https://smartodr.in/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary"
                  >
                    smartodr.in
                  </a>
                  .
                </li>
                <li>
                  In case of any grievance related to accessibility or rights of
                  persons with disabilities, you may contact our Nodal Officer:
                  Aerik Wadhwani at{" "}
                  <a
                    href="mailto:compliance@hedgium.in"
                    className="link link-primary"
                  >
                    compliance@hedgium.in
                  </a>
                  .
                </li>
              </ol>

              <h2 className="text-lg font-semibold mt-8 mb-4">
                Escalation Matrix
              </h2>
              <div className="overflow-x-auto mb-8">
                <table className="table table-zebra w-full text-sm">
                  <thead>
                    <tr>
                      <th>Designation</th>
                      <th>Address</th>
                      <th>Contact</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ESCALATION_ROWS.map((row) => (
                      <tr key={row.designation}>
                        <td>{row.designation}</td>
                        <td>{HEDGIUM_ADDRESS}</td>
                        <td>
                          {row.contactKey === "phone"
                            ? (process.env.NEXT_PUBLIC_PHONE_NUMBER ? `+91 ${process.env.NEXT_PUBLIC_PHONE_NUMBER}` : "—")
                            : row.contactKey ?? "—"}
                        </td>
                        <td>
                          <a
                            href={`mailto:${row.email}`}
                            className="link link-primary"
                          >
                            {row.email}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <section className="pt-6 border-t border-base-300">
                <h2 className="text-lg font-semibold mb-3">SEBI SCORES & ODR</h2>
                <p className="text-sm text-base-content/80">
                  SEBI SCORES:{" "}
                  <a
                    href="https://scores.sebi.gov.in/scores-home"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary"
                  >
                    scores.sebi.gov.in
                  </a>
                  {" | "}
                  SMARTODR:{" "}
                  <a
                    href="https://smartodr.in/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary"
                  >
                    smartodr.in
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
