import type { NextConfig } from "next";
import path from "node:path";

const LOADER = path.resolve(__dirname, 'src/visual-edits/component-tagger-loader.js');

// @ts-ignore
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@tabler/icons-react',
      '@heroicons/react',
      'framer-motion',
      'recharts',
      'date-fns',
      'clsx',
      'tailwind-merge',
    ],
  },
  images: {
    // AVIF + WebP: 50-75% smaller than JPEG/PNG, auto-negotiated by Next.js Image
    formats: ['image/avif', 'image/webp'],
    // Cache optimized images for 24 hours minimum to avoid repeated re-optimization
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  turbopack: {
    rules: {
      "*.{jsx,tsx}": {
        loaders: [LOADER]
      }
    }
  }
};

export default withPWA(nextConfig);
// Visual editor restart: 1769085002323
