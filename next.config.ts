import type { NextConfig } from "next";


const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});


module.exports = withBundleAnalyzer({
  async redirects() {
    return [
      { source: "/hedgium/dashboard", destination: "/hedgium/home", permanent: true },
      { source: "/hedgium/dashboard/", destination: "/hedgium/home", permanent: true },
      { source: "/sandbox/dashboard", destination: "/sandbox/home", permanent: true },
      { source: "/sandbox/dashboard/", destination: "/sandbox/home", permanent: true },
    ];
  },
});
