import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  webpack: (config, { isServer, webpack }) => {
    // Fix for "Cannot access 'tw' before initialization" errors
    // This prevents webpack from combining modules in a way that breaks initialization order
    config.optimization = {
      ...config.optimization,
      // Disable module concatenation which can cause initialization order issues
      concatenateModules: false,
      // Use natural module IDs to ensure proper initialization order
      moduleIds: isServer ? 'deterministic' : 'natural',
      chunkIds: isServer ? 'deterministic' : 'natural',
    };

    // Ensure proper handling of ES modules
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        extensionAlias: {
          '.js': ['.js', '.ts', '.tsx'],
          '.jsx': ['.jsx', '.tsx'],
        },
      };
    }

    return config;
  },
};

export default nextConfig;
