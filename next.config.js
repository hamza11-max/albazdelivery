module.exports = {
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
    
    // Ensure resolve and alias objects exist
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    
    // CRITICAL: Set @/ alias FIRST before spreading existing aliases
    // This ensures it takes precedence and works correctly
    const rootPath = path.resolve(__dirname, '.');
    
    // Preserve existing aliases but ensure @/ is set correctly
    config.resolve.alias = {
      // Set @/ alias first - this is critical for Next.js path resolution
      '@': rootPath,
      // Spread existing aliases (may include Next.js auto-generated ones)
      ...config.resolve.alias,
      // Override with our specific aliases
      '@/root/lib': path.resolve(__dirname, './lib'),
      '@/root/components': path.resolve(__dirname, './components'),
      '@/root/hooks': path.resolve(__dirname, './hooks'),
      '@albaz/ui': path.resolve(__dirname, 'packages/ui/src/index.ts'),
      '@albaz/shared': path.resolve(__dirname, 'packages/shared/src/index.ts'),
      // Point the utils alias at the folder (allow index.* resolution)
      '@albaz/shared/utils': path.resolve(__dirname, 'packages/shared/src/utils'),
    };
    
    // Ensure modules can be resolved from project root
    if (!config.resolve.modules) {
      config.resolve.modules = ['node_modules'];
    }
    if (!config.resolve.modules.includes(rootPath)) {
      config.resolve.modules = [rootPath, ...config.resolve.modules];
    }
    
    // Optimize module resolution
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
    };
    
    return config;
  },
};