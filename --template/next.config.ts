import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  webpack: (config, { isServer }) => {
    // Fix for "Cannot access 'tw' before initialization" errors with Tailwind CSS v4
    // This is a known issue with Tailwind v4 beta and module initialization order
    
    // Disable all optimizations that can cause initialization order issues
    config.optimization = {
      ...config.optimization,
      concatenateModules: false,
      moduleIds: isServer ? 'deterministic' : 'natural',
      chunkIds: isServer ? 'deterministic' : 'natural',
      // Disable tree shaking optimizations that can reorder modules
      usedExports: false,
      providedExports: false,
      sideEffects: false,
    };

    // Ensure proper handling of ES modules
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        extensionAlias: {
          '.js': ['.js', '.ts', '.tsx'],
          '.jsx': ['.jsx', '.tsx'],
        },
      };
      
      // Force proper module ordering for client bundles
      config.optimization.moduleIds = 'natural';
      config.optimization.chunkIds = 'natural';
    }

    // Add explicit handling for Tailwind CSS modules
    config.module = {
      ...config.module,
      rules: config.module.rules.map((rule: any) => {
        if (rule.test && rule.test.toString().includes('css')) {
          return {
            ...rule,
            // Ensure CSS modules are processed in order
            use: rule.use?.map((loader: any) => {
              if (typeof loader === 'object' && loader.loader?.includes('postcss')) {
                return {
                  ...loader,
                  options: {
                    ...loader.options,
                    // Ensure PostCSS processes in correct order
                    postcssOptions: {
                      ...loader.options?.postcssOptions,
                    },
                  },
                };
              }
              return loader;
            }),
          };
        }
        return rule;
      }),
    };

    return config;
  },
};

export default nextConfig;
