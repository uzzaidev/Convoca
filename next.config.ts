import type { NextConfig } from "next";

const isMobileBuild = process.env.CAPACITOR_BUILD === "true";

const nextConfig: NextConfig = {
  output: isMobileBuild ? "export" : undefined,
  async rewrites() {
    return [
      {
        source: "/.well-known/apple-app-site-association",
        destination: "/api/well-known/aasa",
      },
      {
        source: "/.well-known/assetlinks.json",
        destination: "/api/well-known/assetlinks",
      },
    ];
  },
  images: {
    unoptimized: isMobileBuild,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
