import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
  transpilePackages: ['@albaz/shared', '@albaz/ui', '@albaz/auth'],
  webpack: (config, { isServer }) => {
    // Allow imports from root directories
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/lib': path.resolve(__dirname, '../../lib'),
      '@/components': path.resolve(__dirname, '../../components'),
      '@/hooks': path.resolve(__dirname, '../../hooks'),
    }
    // Fix for module initialization order issues
    config.optimization = {
      ...config.optimization,
      // Use 'named' for better module ordering
      moduleIds: isServer ? 'deterministic' : 'named',
      // Disable module concatenation to prevent hoisting issues
      concatenateModules: false,
      // Disable side effects optimization for client
      sideEffects: false,
      splitChunks: {
        ...config.optimization.splitChunks,
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Separate chunk for shared code
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
    };
    
    if (!isServer) {
      // Disable tree shaking optimizations that can cause initialization issues
      config.optimization.usedExports = false;
      config.optimization.providedExports = false;
      config.optimization.mangleExports = false;
      // Ensure proper module evaluation order - already set above, but enforce here
      if (!config.optimization.moduleIds) {
        config.optimization.moduleIds = 'named';
      }
    }
    
    // Additional webpack configuration to prevent module initialization issues
    if (!config.resolve) {
      config.resolve = {}
    }
    config.resolve.fullySpecified = false
    
    return config;
  },
};

export default config;

