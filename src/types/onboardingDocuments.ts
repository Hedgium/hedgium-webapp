export type ClientCategory = "individual_huf" | "non_individual" | "accredited_investor";
export type FamilyDeclaration = "none" | "has_member";

export type DocumentSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  body?: string;
  bullets?: string[];
};

export type DocumentGroup = {
  id: string;
  title: string;
  sections: DocumentSection[];
};

export type ResearchTermsDocument = {
  version: string;
  title: string;
  subtitle: string;
  groups: DocumentGroup[];
};

export type FeeScheduleDocument = {
  version: string;
  title: string;
  subtitle: string;
  intro: string;
  headline: string;
  sections: DocumentSection[];
};

export type MandateDocument = {
  version: string;
  title: string;
  subtitle: string;
  intro: string;
  sections: DocumentSection[];
};
