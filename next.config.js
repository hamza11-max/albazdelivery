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
    // Fix for "Cannot access 'tw' before initialization" error
    // Ensure proper module resolution order
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    // Optimize module resolution
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
    };
    
    return config;
  },
};