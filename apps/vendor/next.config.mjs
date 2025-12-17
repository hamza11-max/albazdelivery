import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const config = {
  // For Electron: use standalone output to bundle Next.js server
  output: process.env.ELECTRON_BUILD ? 'standalone' : undefined,
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
  // Enable source maps for debugging
  productionBrowserSourceMaps: true,
  transpilePackages: ['@albaz/shared', '@albaz/ui', '@albaz/auth'],
  // Allow camera access from this origin (needed for barcode scanner)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=(self)',
          },
        ],
      },
    ]
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

    // Webpack optimization settings - simplified after modularization
    // The previous aggressive settings were needed for the monolithic component
    // Now that the code is modular, we can use more standard settings
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      // Re-enable module concatenation for better performance
      concatenateModules: true,
    }
    
    // Client-side optimizations
    if (!isServer) {
      // Use runtime chunk for better caching
      config.optimization.runtimeChunk = {
        name: 'runtime'
      }
    }
    
    // Module resolution
    config.resolve.fullySpecified = false
    config.resolve.symlinks = false

    return config;
  },
};

export default config;

