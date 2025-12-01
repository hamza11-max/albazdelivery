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
  // Prevent static generation of dynamic pages
  output: 'standalone',
  webpack: (config, { isServer }) => {
    const path = require('path');
    
    // Fix for "Cannot access 'tw' before initialization" error
    // Ensure proper module resolution order
    config.resolve.alias = {
      ...config.resolve.alias,
      // Add root path aliases for webpack resolution
      '@/root/lib': path.resolve(__dirname, './lib'),
      '@/root/components': path.resolve(__dirname, './components'),
      '@/root/hooks': path.resolve(__dirname, './hooks'),
    };
    
    // Optimize module resolution
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
    };
    
    return config;
  },
};