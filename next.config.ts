import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  turbopack: {
    resolveAlias: {
      canvas: "./lib/empty.js",
    },
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  outputFileTracingIncludes: {
    "/api/pdf": ["node_modules/@sparticuz/chromium/bin/**"],
  },
  images: {
    localPatterns: [
      {
        pathname: "/uploads/**",
      },
      {
        pathname: "/images/**",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
