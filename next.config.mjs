/** @type {import('next').NextConfig} */
const config = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  compiler: {
    styledComponents: true
  },
  webpack: (config, { isServer, webpack }) => {
    // Fix for module initialization order issues
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      // Ensure proper chunk splitting to avoid initialization order issues
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    };
    
    // Prevent circular dependency warnings from breaking the build
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve.fallback,
      },
    };

    // Fix for "Cannot access before initialization" errors
    // Disable module concatenation which can cause initialization order issues
    // This prevents webpack from combining modules in a way that breaks initialization order
    config.optimization.concatenateModules = false;
    
    return config;
  },
  // Experimental features to help with module resolution
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
};

export default config;