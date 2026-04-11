import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const config = {
  // For Electron: use standalone output to bundle Next.js server
  output: process.env.ELECTRON_BUILD ? 'standalone' : undefined,
  // Keep Prisma and native modules out of the server bundle
  serverExternalPackages: ['@prisma/client', 'better-sqlite3'],
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
  transpilePackages: [
    '@albaz/shared',
    '@albaz/ui',
    '@albaz/auth',
    // Hoisted to repo root; vendor app must resolve them for ../../lib imports
    'html2canvas',
    'jspdf',
  ],
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
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ]
  },
  webpack: (config, { isServer }) => {
    const rootDir = path.resolve(__dirname, '../..')
    // Allow imports from root directories (single resolution to avoid chunk "factory" undefined)
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/root/lib': path.join(rootDir, 'lib'),
      '@/root/components': path.join(rootDir, 'components'),
      '@/root/hooks': path.join(rootDir, 'hooks'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/components': path.resolve(__dirname, './components'),
      '@/hooks': path.resolve(__dirname, './hooks'),
    }

    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      // Avoid aggressive concatenation that can break chunk loading in dev
      concatenateModules: isServer,
    }

    if (!isServer) {
      config.optimization.runtimeChunk = { name: 'runtime' }
    }

    config.resolve.fullySpecified = false
    config.resolve.symlinks = false

    // Workspace packages live under root node_modules; vendor has no local html2canvas/jspdf
    const extraNodeModules = [
      path.join(rootDir, 'node_modules'),
      path.resolve(__dirname, 'node_modules'),
    ]
    config.resolve.modules = [
      ...extraNodeModules,
      ...(Array.isArray(config.resolve.modules) ? config.resolve.modules : ['node_modules']),
    ]

    return config
  },
};

export default config;

