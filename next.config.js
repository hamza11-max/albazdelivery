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
  postcss: {
    plugins: {
      'tailwindcss': {},
      'autoprefixer': {},
    },
  },
  compiler: {
    styledComponents: true
  }
};