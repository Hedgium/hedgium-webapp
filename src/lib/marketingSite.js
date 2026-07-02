const HEDGIUM_MARKETING_SITE_URL = "https://www.hedgium.ai";

const LEGAL_COMPLAINTS_INVESTOR_CHARTER_PATH =
  "/legal-complaints-investor-charter";

function marketingSiteUrl(path = "") {
  return `${HEDGIUM_MARKETING_SITE_URL}${path}`;
}

function legalCharterUrl(anchor) {
  const base = marketingSiteUrl(LEGAL_COMPLAINTS_INVESTOR_CHARTER_PATH);
  return anchor ? `${base}#${anchor}` : base;
}

module.exports = {
  HEDGIUM_MARKETING_SITE_URL,
  LEGAL_COMPLAINTS_INVESTOR_CHARTER_PATH,
  marketingSiteUrl,
  legalCharterUrl,
};
