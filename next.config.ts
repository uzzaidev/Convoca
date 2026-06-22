import type { NextConfig } from "next";

const isMobileBuild = process.env.CAPACITOR_BUILD === "true";

/** Evita resolver firebase/messaging no deploy Vercel (push é só nativo). */
const firebaseMessagingStub =
  "./src/lib/mobile/stubs/capacitor-firebase-messaging.ts";

const nextConfig: NextConfig = {
  output: isMobileBuild ? "export" : undefined,
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
  ...(!isMobileBuild && {
    turbopack: {
      resolveAlias: {
        "@capacitor-firebase/messaging": firebaseMessagingStub,
      },
    },
    webpack: (config) => {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@capacitor-firebase/messaging": firebaseMessagingStub,
      };
      return config;
    },
  }),
};

export default nextConfig;
