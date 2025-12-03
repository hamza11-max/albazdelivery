module.exports = {
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
  webpack: (config, { isServer }) => {
    const path = require('path');
    
    // Fix for "Cannot access 'tw' before initialization" error
    // Ensure proper module resolution order
    config.resolve.alias = {
      ...config.resolve.alias,
      // Critical: Add @/ alias for Next.js path resolution
      '@': path.resolve(__dirname, '.'),
      // Add root path aliases for webpack resolution (for backward compatibility)
      '@/root/lib': path.resolve(__dirname, './lib'),
      '@/root/components': path.resolve(__dirname, './components'),
      '@/root/hooks': path.resolve(__dirname, './hooks'),
      // Resolve @albaz/ui to the packages/ui directory
      '@albaz/ui': path.resolve(__dirname, 'packages/ui/src/index.ts'),
    };
    
    // Optimize module resolution
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
    };
    
    return config;
  },
};