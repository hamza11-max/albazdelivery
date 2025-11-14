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
      moduleIds: isServer ? 'deterministic' : 'natural',
      concatenateModules: false,
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
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      },
    };
    
    if (!isServer) {
      config.optimization.usedExports = false;
      config.optimization.providedExports = false;
    }
    
    return config;
  },
};

export default config;

