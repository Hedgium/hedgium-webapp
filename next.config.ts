const { legalCharterUrl } = require("./src/lib/marketingSite.js");

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const legacyHedgiumToRoot = [
  "home",
  "positions",
  "reports",
  "alerts",
  "settings",
  "add-broker",
].flatMap((segment) => [
  {
    source: `/hedgium/${segment}`,
    destination: `/${segment}`,
    permanent: true,
  },
  {
    source: `/hedgium/${segment}/`,
    destination: `/${segment}`,
    permanent: true,
  },
]);

const consolidatedLegalRedirects = [
  ["terms-of-use", "terms-of-use"],
  ["privacy-policy", "privacy-policy"],
  ["refund-policy", "refund-policy"],
  ["grievance-redressal", "grievance-redressal"],
  ["complaint-status", "complaint-status"],
  ["mitc-ra", "mitc-ra"],
].flatMap(([segment, anchor]) => [
  {
    source: `/${segment}`,
    destination: legalCharterUrl(anchor),
    permanent: true,
  },
  {
    source: `/${segment}/`,
    destination: legalCharterUrl(anchor),
    permanent: true,
  },
]);

const onboardingLegacyRedirects = [
  "verify-email",
  "terms",
  "complete-profile",
  "verification",
].flatMap((segment) => [
  {
    source: `/onboarding/${segment}`,
    destination: "/onboarding",
    permanent: true,
  },
  {
    source: `/onboarding/${segment}/`,
    destination: "/onboarding",
    permanent: true,
  },
]);

module.exports = withBundleAnalyzer({
  // Keep POST /api/proxy/.../ from 308ing to the no-slash URL (breaks LAN login).
  skipTrailingSlashRedirect: true,
  async redirects() {
    return [
      { source: "/hedgium/dashboard", destination: "/home", permanent: true },
      { source: "/hedgium/dashboard/", destination: "/home", permanent: true },
      { source: "/sandbox", destination: "/simulation", permanent: true },
      { source: "/sandbox/", destination: "/simulation", permanent: true },
      { source: "/sandbox/dashboard", destination: "/simulation", permanent: true },
      { source: "/sandbox/dashboard/", destination: "/simulation", permanent: true },
      { source: "/sandbox/home", destination: "/simulation", permanent: true },
      { source: "/sandbox/home/", destination: "/simulation", permanent: true },
      { source: "/sandbox/positions", destination: "/simulation", permanent: true },
      { source: "/sandbox/positions/", destination: "/simulation", permanent: true },
      { source: "/sandbox/reports", destination: "/simulation", permanent: true },
      { source: "/sandbox/reports/", destination: "/simulation", permanent: true },
      { source: "/sandbox/settings", destination: "/simulation", permanent: true },
      { source: "/sandbox/settings/", destination: "/simulation", permanent: true },
      { source: "/simulation/dashboard", destination: "/simulation", permanent: true },
      { source: "/simulation/dashboard/", destination: "/simulation", permanent: true },
      { source: "/simulation/home", destination: "/simulation", permanent: true },
      { source: "/simulation/home/", destination: "/simulation", permanent: true },
      { source: "/simulation/positions", destination: "/simulation", permanent: true },
      { source: "/simulation/positions/", destination: "/simulation", permanent: true },
      { source: "/simulation/reports", destination: "/simulation", permanent: true },
      { source: "/simulation/reports/", destination: "/simulation", permanent: true },
      { source: "/simulation/settings", destination: "/simulation", permanent: true },
      { source: "/simulation/settings/", destination: "/simulation", permanent: true },
      { source: "/login", destination: "/", permanent: true },
      { source: "/login/", destination: "/", permanent: true },
      { source: "/upgrade", destination: "/settings", permanent: true },
      { source: "/upgrade/", destination: "/settings", permanent: true },
      { source: "/hedgium/upgrade", destination: "/settings", permanent: true },
      { source: "/hedgium/upgrade/", destination: "/settings", permanent: true },
      ...onboardingLegacyRedirects,
      ...consolidatedLegalRedirects,
      ...legacyHedgiumToRoot,
    ];
  },
});
