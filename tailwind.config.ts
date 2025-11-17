/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        // ALBAZ Brand Colors
        albaz: {
          green: {
            DEFAULT: '#224c1f',
            light: '#2d5f2a',
            dark: '#1a3a17',
            '50': '#f0f7f0',
            '100': '#d9e8d9',
            '200': '#b3d1b3',
            '300': '#8dba8d',
            '400': '#67a367',
            '500': '#224c1f',
            '600': '#1a3a17',
            '700': '#122812',
            '800': '#0a160a',
            '900': '#050a05',
          },
          orange: {
            DEFAULT: '#ff6b35',
            light: '#ff8c5c',
            dark: '#e55a2b',
            '50': '#fff5f2',
            '100': '#ffe5dc',
            '200': '#ffcbb9',
            '300': '#ffb196',
            '400': '#ff9773',
            '500': '#ff6b35',
            '600': '#e55a2b',
            '700': '#cc4921',
            '800': '#b33817',
            '900': '#9a270d',
          },
          yellow: {
            DEFAULT: '#ffd23f',
            light: '#ffdc66',
            dark: '#e6bd2f',
            '50': '#fffef5',
            '100': '#fffce8',
            '200': '#fff9d1',
            '300': '#fff6ba',
            '400': '#fff3a3',
            '500': '#ffd23f',
            '600': '#e6bd2f',
            '700': '#cca81f',
            '800': '#b3930f',
            '900': '#997e00',
          },
        },
      },
      backgroundImage: {
        'albaz-green-gradient': 'linear-gradient(135deg, #224c1f 0%, #2d5f2a 100%)',
        'albaz-orange-gradient': 'linear-gradient(135deg, #ff6b35 0%, #ff8c5c 50%, #ffd23f 100%)',
        'albaz-orange-glow': 'linear-gradient(135deg, rgba(255, 107, 53, 0.3) 0%, rgba(255, 140, 92, 0.2) 50%, rgba(255, 210, 63, 0.3) 100%)',
        'albaz-yellow-glow': 'radial-gradient(circle, rgba(255, 210, 63, 0.4) 0%, rgba(255, 210, 63, 0.1) 70%, transparent 100%)',
        'albaz-bg-gradient': 'linear-gradient(135deg, #f5f7f5 0%, #e8ede8 50%, #f0f5f0 100%)',
        'albaz-bg-gradient-dark': 'linear-gradient(135deg, #1a1f1a 0%, #151815 50%, #1a1f1a 100%)',
      },
      boxShadow: {
        'albaz-green': '0 4px 14px 0 rgba(34, 76, 31, 0.3)',
        'albaz-orange': '0 4px 20px 0 rgba(255, 107, 53, 0.4), 0 0 30px rgba(255, 210, 63, 0.2)',
        'albaz-orange-glow': '0 0 20px rgba(255, 107, 53, 0.5), 0 0 40px rgba(255, 140, 92, 0.3), 0 0 60px rgba(255, 210, 63, 0.2)',
        'albaz-yellow-glow': '0 0 15px rgba(255, 210, 63, 0.4), 0 0 30px rgba(255, 210, 63, 0.2)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
  future: {
    respectDefaultRingColorOpacity: true,
  },
}