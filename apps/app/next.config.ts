import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

// WhatsApp Simulator UI URL
const WA_SIM_UI_URL = process.env.WA_SIM_UI_INTERNAL_URL || "http://localhost:8004";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  devIndicators: false,
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [{ key: "Cache-Control", value: "no-cache, must-revalidate" }],
      },
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, must-revalidate" }],
      },
    ];
  },
  async rewrites() {
    return [
      // Proxy /app/wa to wa-sim-ui (dentro de /app para compartilhar autenticação)
      {
        source: "/app/wa",
        destination: `${WA_SIM_UI_URL}/app/wa/`,
      },
      {
        source: "/app/wa/:path*",
        destination: `${WA_SIM_UI_URL}/app/wa/:path*`,
      },
    ];
  },
};

export default withSerwist(nextConfig);
