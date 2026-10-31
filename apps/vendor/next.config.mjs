import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** Map @/lib/* to apps/vendor/lib when a file exists there; otherwise repo root lib. */
function buildLibAliases(vendorLibDir, rootLibDir) {
  const aliases = { '@/lib': rootLibDir }

  function walk(dir, prefix = '') {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name
      const abs = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(abs, rel)
        continue
      }
      if (!/\.(ts|tsx|js|mjs|cjs)$/.test(entry.name)) continue
      const withoutExt = rel.replace(/\.(tsx?|mjs|cjs|js)$/, '')
      aliases[`@/lib/${withoutExt.replace(/\\/g, '/')}`] = abs
    }
  }

  if (fs.existsSync(vendorLibDir)) walk(vendorLibDir)
  return aliases
}

/** @type {import('next').NextConfig} */
const config = {
  // For Electron: use standalone output to bundle Next.js server
  output: process.env.ELECTRON_BUILD ? 'standalone' : undefined,
  // Keep Prisma and native modules out of the server bundle
  serverExternalPackages: ['@prisma/client', 'better-sqlite3'],
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
    '@mui/material',
    '@mui/material-nextjs',
    '@emotion/react',
    '@emotion/styled',
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
    const vendorLib = path.resolve(__dirname, './lib')
    const rootLib = path.join(rootDir, 'lib')
    // Allow imports from root directories (single resolution to avoid chunk "factory" undefined)
    config.resolve.alias = {
      ...config.resolve.alias,
      ...buildLibAliases(vendorLib, rootLib),
      '@/root/lib': rootLib,
      '@/root/components': path.join(rootDir, 'components'),
      '@/root/hooks': path.join(rootDir, 'hooks'),
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

