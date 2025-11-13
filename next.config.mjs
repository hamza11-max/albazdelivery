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
          // Use 'natural' for client bundles to ensure proper initialization order
          moduleIds: isServer ? 'deterministic' : 'natural',
          // Ensure proper chunk splitting to avoid initialization order issues
          splitChunks: {
            ...config.optimization.splitChunks,
            chunks: 'all',
            cacheGroups: {
              ...config.optimization.splitChunks?.cacheGroups,
              default: {
                minChunks: 2,
                priority: -20,
                reuseExistingChunk: true,
              },
              // Separate vendor chunks to avoid initialization issues
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                priority: 10,
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
      // Add alias to help with module resolution
      alias: {
        ...config.resolve.alias,
      },
    };

    // Fix for "Cannot access before initialization" errors
    // Disable module concatenation which can cause initialization order issues
    // This prevents webpack from combining modules in a way that breaks initialization order
    config.optimization.concatenateModules = false;
    
    // Add more aggressive fixes for initialization issues
    if (!isServer) {
      // Ensure proper handling of ES modules in client bundles
      config.resolve.extensionAlias = {
        '.js': ['.js', '.ts', '.tsx'],
        '.jsx': ['.jsx', '.tsx'],
      };
      
      // Disable problematic optimizations that can cause initialization issues
      config.optimization.usedExports = false;
      config.optimization.providedExports = false;
    }
    
    return config;
  },
  // Experimental features to help with module resolution
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
};

export default config;