/**
 * Research Services terms (SEBI/RA). Keep TERMS_VERSION in sync with
 * hedgium_backend/users/constants.py RESEARCH_TERMS_VERSION.
 */
export const TERMS_VERSION = "v2026-04-17" as const;

export type TermSection = {
  id: string;
  title: string;
  /** Plain paragraph(s); omit when using `bullets`. */
  body?: string;
  /** Rendered as a bulleted list when present. */
  bullets?: string[];
};

export const mandatoryTermsSections: TermSection[] = [
  {
    id: "m1",
    title: "1. Availing the research services",
    body: "By accepting delivery of the research service, the client confirms that he/she has elected to subscribe the research service of the RA at his/her sole discretion. RA confirms that research services shall be rendered in accordance with the applicable provisions of the RA Regulations.",
  },
  {
    id: "m2",
    title: "2. Obligations on RA",
    body: "RA and client shall be bound by SEBI Act and all the applicable rules and regulations of SEBI, including the RA Regulations and relevant notifications of Government, as may be in force, from time to time.",
  },
  {
    id: "m3",
    title: "3. Client Information and KYC",
    body: "The client shall furnish all such details in full as may be required by the RA in its standard form with supporting details, if required, as may be made mandatory by RAASB/SEBI from time to time. RA shall collect, store, upload and check KYC records of the clients with KYC Registration Agency (KRA) as specified by SEBI from time to time.",
  },
  {
    id: "m4",
    title: "4. Standard Terms of Service (SEBI mandated clauses)",
    body: `Standard terms and declaration of the RA:

“I / We have read and understood the terms and conditions applicable to a research analyst as defined under regulation 2(1)(u) of the SEBI (Research Analyst) Regulations, 2014, including the fee structure.

I/We are subscribing to the research services for our own benefits and consumption, and any reliance placed on the research report provided by research analyst shall be as per our own judgment and assessment of the conclusions contained in the research report.

I/We understand that –
i. Any investment made based on the recommendations in the research report are subject to market risk.
ii. Recommendations in the research report do not provide any assurance of returns.
iii. There is no recourse to claim any losses incurred on the investments made based on the recommendations in the research report.”

Declaration of the RA that:
i. It is duly registered with SEBI as an RA pursuant to the SEBI (Research Analysts) Regulations, 2014 and its registration details are: (registration number, registration date);
ii. It has registration and qualifications required to render the services contemplated under the RA Regulations, and the same are valid and subsisting;
iii. Research analyst services provided by it do not conflict with or violate any provision of law, rule or regulation, contract, or other instrument to which it is a party or to which any of its property is or may be subject;
iv. A) Individual/HUF:- The maximum fee that may be charged by RA is ₹1.51 lakhs per annum per family of client (excluding statutory fees or taxes). The fee limit shall be revised and announced by RAASB once in three years based on the Cost Inflation Index (CII) after due consultation with SEBI. The provisions related to limit on fee chargeable by RAs shall only apply to individual and HUF clients and shall not be applicable in case of non-individual clients and accredited investors, B) Non-individuals:- In case of non-individual clients, accredited investors, and in case of institutional investors seeking recommendation of proxy adviser, fee related terms and conditions shall be governed through bilaterally negotiated contractual terms.
v. The recommendations provided by RA do not provide any assurance of returns.`,
  },
  {
    id: "m5",
    title: "5. Consideration and mode of payment",
    body: "The client shall duly pay to RA, the agreed fees for the services that RA renders to the client and statutory charges, as applicable. Such fees and statutory charges shall be payable through the specified manner and mode(s)/ mechanism(s).",
  },
  {
    id: "m6",
    title: "6. Risk factors",
    bullets: [
      "Market Risk: Investments in securities are subject to market risks, including price volatility arising from macroeconomic factors, market sentiment, liquidity conditions, and global developments. Past performance does not guarantee future returns.",
      "Capital Loss Risk: The client acknowledges that investments in securities may result in partial or complete loss of capital, and no assurance can be given that investment objectives will be achieved. Investments or strategies involving derivatives, options, futures, or leverage may carry a higher degree of risk.",
      "Volatility and Liquidity Risk: Prices of securities may fluctuate significantly due to market conditions, and certain securities may have limited liquidity, which could impact the ability to exit positions at desired prices.",
      "Strategy Risk: Investment strategies, including quantitative or algorithmic approaches, are based on historical data, statistical models, and assumptions that may not perform as expected in future market conditions.",
      "Regulatory and Policy Risk: Changes in government policies, taxation rules, regulatory frameworks, or exchange regulations may affect investment outcomes.",
      "Client Responsibility: The client confirms that they have understood the risks involved in investing in securities and will make investment decisions based on their own risk tolerance and financial circumstances.",
    ],
  },
  {
    id: "m7",
    title: "7. Conflict of interest",
    body: "The RA shall adhere to the applicable regulations/ circulars/ directions specified by SEBI from time to time in relation to disclosure and mitigation of any actual or potential conflict of interest.",
  },
  {
    id: "m8",
    title: "8. Termination of service and refund of fees",
    body: "Disclosure that the RA may suspend or terminate rendering of research services to client on account of suspension/ cancellation of registration of RA by SEBI and shall refund the residual amount to the client. In case of suspension of certificate of registration of the RA for more than 60 (sixty) days or cancellation of the RA registration, RA shall refund the fees, on a pro rata basis for the period from the effective date of cancellation/ suspension to end of the subscription period.",
  },
  {
    id: "m9",
    title: "9. Grievance redressal and dispute resolution",
    body: "Any grievance related to (i) non-receipt of research report or (ii) missing pages or inability to download the entire report, or (iii) any other deficiency in the research services provided by RA, shall be escalated promptly by the client to the person/employee designated by RA, in this behalf (RA to provide name and e-mail ID of the designated person/employee).\n\nThe RA shall be responsible to resolve grievances within 7 (seven) business working days or such timelines as may be specified by SEBI under the RA Regulations. RA shall redress grievances of the client in a timely and transparent manner. Any dispute between the RA and his client may be resolved through arbitration or through any other modes or mechanism as specified by SEBI from time to time.",
  },
  {
    id: "m10",
    title: "10. Additional clauses",
    bullets: [
      "Any disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.",
      "In case of arbitration such arbitration shall be conducted in Mumbai, Maharashtra, in accordance with the provisions of the Arbitration and Conciliation Act, 1996, and the seat and venue of arbitration shall be Mumbai. The proceedings shall be conducted in the English language.",
      "The Advisor shall not be liable for losses arising from system failures, connectivity issues, broker platform disruptions, or exchange outages.",
      "The client agrees to abide by the operational guidelines of the platform including and especially daily login connect to ensure timely updates for ongoing positions.",
      "The advisor will not be liable for consequences for any deviations and inaction by client pertaining in these SoPs",
    ],
  },
  {
    id: "m11",
    title: "11. Mandatory notice",
    body: "Clients shall be requested to go through Do’s and Don’ts while dealing with RA as specified in SEBI master circular no. SEBI/HO/MIRSD-POD-1/P/CIR/2024/49 dated May 21, 2024 or as may be specified by SEBI from time to time.",
  },
];

export const mostImportantTermsSections: TermSection[] = [
  {
    id: "mi1",
    title: "1.",
    body: "These terms and conditions, and consent thereon are for the research services provided by the Research Analyst (RA) and RA cannot execute/carry out any trade (purchase/sell transaction) on behalf of, the client. Thus, the clients are advised not to permit RA to execute any trade on their behalf.",
  },
  {
    id: "mi2",
    title: "2.",
    body: `The fee charged by RA to the client will be subject to the maximum of amount prescribed by SEBI/ Research Analyst Administration and Supervisory Body (RAASB) from time to time (applicable only for Individual and HUF Clients).

Note:
2.1. The current fee limit is Rs 1,51,000/- per annum per family of client for all research services of the RA.
2.2. The fee limit does not include statutory charges.
2.3. The fee limits do not apply to a non-individual client / accredited investor.`,
  },
  {
    id: "mi3",
    title: "3.",
    body: "RA may charge fees in advance if agreed by the client. Such advance shall not exceed the period stipulated by SEBI; presently it is one quarter. In case of pre-mature termination of the RA services by either the client or the RA, the client shall be entitled to seek refund of proportionate fees only for unexpired period.",
  },
  {
    id: "mi4",
    title: "4.",
    body: "Fees to RA may be paid by the client through any of the specified modes like cheque, online bank transfer, UPI, etc. Cash payment is not allowed. Optionally the client can make payments through Centralized Fee Collection Mechanism (CeFCoM) managed by BSE Limited (i.e. currently recognized RAASB).",
  },
  {
    id: "mi5",
    title: "5.",
    body: "The RA is required to abide by the applicable regulations/ circulars/ directions specified by SEBI and RAASB from time to time in relation to disclosure and mitigation of any actual or potential conflict of interest. The RA will endeavor to promptly inform the client of any conflict of interest that may affect the services being rendered to the client.",
  },
  {
    id: "mi6",
    title: "6.",
    body: "Any assured/guaranteed/fixed returns schemes or any other schemes of similar nature are prohibited by law. No scheme of this nature shall be offered to the client by the RA.",
  },
  {
    id: "mi7",
    title: "7.",
    body: "The RA cannot guarantee returns, profits, accuracy, or risk-free investments from the use of the RA’s research services. All opinions, projections, estimates of the RA are based on the analysis of available data under certain assumptions as of the date of preparation/publication of research report.",
  },
  {
    id: "mi8",
    title: "8.",
    body: "Any investment made based on recommendations in research reports are subject to market risks, and recommendations do not provide any assurance of returns. There is no recourse to claim any losses incurred on the investments made based on the recommendations in the research report. Any reliance placed on the research report provided by the RA shall be as per the client’s own judgement and assessment of the conclusions contained in the research report.",
  },
  {
    id: "mi9",
    title: "9.",
    body: "The SEBI registration, Enlistment with RAASB, and NISM certification do not guarantee the performance of the RA or assure any returns to the client.",
  },
  {
    id: "mi10",
    title: "10.",
    body: `For any grievances,
Step 1: the client should first contact the RA using the details on its website or following contact details: (RA to provide details as per ‘Grievance Redressal / Escalation Matrix’)
Step 2: If the resolution is unsatisfactory, the client can also lodge grievances through SEBI’s SCORES platform at www.scores.sebi.gov.in
Step 3: The client may also consider the Online Dispute Resolution (ODR) through the Smart ODR portal at https://smartodr.in`,
  },
  {
    id: "mi11",
    title: "11.",
    body: "Clients are required to keep contact details, including email id and mobile number/s updated with the RA at all times.",
  },
  {
    id: "mi12",
    title: "12.",
    body: "The RA shall never ask for the client’s login credentials and OTPs for the client’s Trading Account Demat Account and Bank Account. Never share such information with anyone including RA.",
  },
];
