import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    webpackBuildWorker: false,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@radix-ui/react-select': 'commonjs @radix-ui/react-select',
      });
    }

    // Disable Jest workers in webpack to prevent runtime errors
    config.externals = config.externals || [];
    config.externals.push({
      'jest-worker': 'commonjs jest-worker',
    });

    return config;
  },
};

export default nextConfig;
