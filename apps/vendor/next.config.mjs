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
      '@/root/lib': path.resolve(__dirname, '../../lib'),
      '@/root/components': path.resolve(__dirname, '../../components'),
      '@/root/hooks': path.resolve(__dirname, '../../hooks'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/components': path.resolve(__dirname, './components'),
      '@/hooks': path.resolve(__dirname, './hooks'),
    }

    // Prevent module initialization order issues - AGGRESSIVE SETTINGS
    config.optimization = {
      ...config.optimization,
      // Use deterministic module IDs for consistent ordering
      moduleIds: 'deterministic',
      // Disable module concatenation to prevent hoisting issues
      concatenateModules: false,
      // Mark all modules as having side effects to prevent aggressive tree-shaking
      sideEffects: true,
      // Disable minimize in development to help debug (optional)
      // minimize: !isServer && process.env.NODE_ENV === 'production',
    }
    
    // Additional webpack settings to prevent hoisting
    if (!isServer) {
      // Ensure proper module evaluation order
      config.optimization.usedExports = false // Disable tree-shaking of exports
      config.optimization.providedExports = false // Don't analyze provided exports
    }

    return config;
  },
};

export default config;

