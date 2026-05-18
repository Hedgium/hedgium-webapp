const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const legacyHedgiumToRoot = [
  "home",
  "positions",
  "reports",
  "alerts",
  "settings",
  "upgrade",
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

module.exports = withBundleAnalyzer({
  async redirects() {
    return [
      { source: "/hedgium/dashboard", destination: "/home", permanent: true },
      { source: "/hedgium/dashboard/", destination: "/home", permanent: true },
      { source: "/sandbox/dashboard", destination: "/sandbox", permanent: true },
      { source: "/sandbox/dashboard/", destination: "/sandbox", permanent: true },
      { source: "/sandbox/home", destination: "/sandbox", permanent: true },
      { source: "/sandbox/home/", destination: "/sandbox", permanent: true },
      { source: "/sandbox/positions", destination: "/sandbox", permanent: true },
      { source: "/sandbox/positions/", destination: "/sandbox", permanent: true },
      { source: "/sandbox/reports", destination: "/sandbox", permanent: true },
      { source: "/sandbox/reports/", destination: "/sandbox", permanent: true },
      { source: "/sandbox/settings", destination: "/sandbox", permanent: true },
      { source: "/sandbox/settings/", destination: "/sandbox", permanent: true },
      ...legacyHedgiumToRoot,
    ];
  },
});
