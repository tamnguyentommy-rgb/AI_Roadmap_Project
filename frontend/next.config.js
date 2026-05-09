const path = require("path");

const replitDevDomain = process.env.REPLIT_DEV_DOMAIN || "";
const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  ...(replitDevDomain
    ? {
        allowedDevOrigins: [
          "*.replit.dev",
          "*.worf.replit.dev",
          "*.picard.replit.dev",
          "*.kirk.replit.dev",
          replitDevDomain,
        ],
      }
    : {}),
  async rewrites() {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
