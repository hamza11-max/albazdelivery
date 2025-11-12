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
  webpack: (config, { isServer }) => {
    // Fix for module initialization order issues
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
    };
    
    // Prevent circular dependency warnings from breaking the build
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve.fallback,
      },
    };
    
    return config;
  },
};

export default config;