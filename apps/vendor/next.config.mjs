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
  experimental: {
    // Ensure proper module resolution for shared packages
    serverComponentsExternalPackages: ['tailwind-merge', 'clsx'],
  },
  webpack: (config, { isServer }) => {
    // Allow imports from root directories
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/root/lib': path.resolve(__dirname, '../../lib'),
      '@/root/components': path.resolve(__dirname, '../../components'),
      '@/root/hooks': path.resolve(__dirname, '../../hooks'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/components': path.resolve(__dirname, './components'),
      '@/hooks': path.resolve(__dirname, './hooks'),
    }
    // Fix for module initialization order issues
    config.optimization = {
      ...config.optimization,
      // Use 'deterministic' for consistent module ordering
      moduleIds: 'deterministic',
      // Disable module concatenation to prevent hoisting issues
      concatenateModules: false,
      // Enable side effects to ensure proper initialization order
      sideEffects: true,
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
      // Ensure proper module evaluation order
      config.optimization.moduleIds = 'deterministic';
      // Keep exports for proper module resolution
      config.optimization.usedExports = true;
      config.optimization.providedExports = true;
    }
    
    // Ensure tailwind-merge and clsx are properly resolved
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
      '.jsx': ['.jsx', '.tsx'],
    }
    
    // Additional webpack configuration to prevent module initialization issues
    if (!config.resolve) {
      config.resolve = {}
    }
    config.resolve.fullySpecified = false
    
    // Prevent circular dependencies by ensuring proper module resolution order
    config.resolve.symlinks = false
    
    return config;
  },
};

export default config;

