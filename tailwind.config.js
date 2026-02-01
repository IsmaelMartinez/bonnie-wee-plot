/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Zen Garden Palette - muted, organic, calming
        zen: {
          // Stone - primary neutral
          stone: {
            50: '#fafaf9',
            100: '#f5f5f4',
            200: '#e7e5e4',
            300: '#d6d3d1',
            400: '#a8a29e',
            500: '#78716c',
            600: '#57534e',
            700: '#44403c',
            800: '#292524',
            900: '#1c1917',
          },
          // Moss - organic green
          moss: {
            50: '#f6f7f4',
            100: '#e8ebe3',
            200: '#d4dbc9',
            300: '#b5c2a4',
            400: '#94a67d',
            500: '#768a5e',
            600: '#5c6e49',
            700: '#48573b',
            800: '#3b4732',
            900: '#333d2c',
          },
          // Bamboo - warm neutral
          bamboo: {
            50: '#fdfcf9',
            100: '#f9f6ee',
            200: '#f2ecda',
            300: '#e8ddc0',
            400: '#dbc99e',
            500: '#c9b07a',
            600: '#b89a5f',
            700: '#9a7d4e',
            800: '#7d6644',
            900: '#67543b',
          },
          // Sakura - cherry blossom pink
          sakura: {
            50: '#fdf6f8',
            100: '#fceef2',
            200: '#fadde6',
            300: '#f5c1d1',
            400: '#ed9ab3',
            500: '#e07294',
            600: '#cb4d74',
            700: '#ac3a5c',
            800: '#8f334d',
            900: '#782f44',
          },
          // Ume - plum/deep red
          ume: {
            50: '#faf5f7',
            100: '#f6ecf0',
            200: '#efdbe2',
            300: '#e3bfcb',
            400: '#d198aa',
            500: '#bc728a',
            600: '#a4556d',
            700: '#894558',
            800: '#723c4a',
            900: '#613641',
          },
          // Kitsune - autumn orange/rust
          kitsune: {
            50: '#fdf8f4',
            100: '#faefe6',
            200: '#f4dbca',
            300: '#ecc2a4',
            400: '#e1a07a',
            500: '#d4805a',
            600: '#c4664a',
            700: '#a3503e',
            800: '#854338',
            900: '#6d3a31',
          },
          // Sumi - ink black
          ink: {
            50: '#f7f7f7',
            100: '#e3e3e3',
            200: '#c8c8c8',
            300: '#a4a4a4',
            400: '#818181',
            500: '#666666',
            600: '#515151',
            700: '#434343',
            800: '#383838',
            900: '#1a1a1a',
          },
          // Water - subtle blue
          water: {
            50: '#f5f8fa',
            100: '#e9f0f5',
            200: '#d1e1ea',
            300: '#a9c8d9',
            400: '#7ba9c3',
            500: '#5a8dad',
            600: '#467392',
            700: '#3a5d77',
            800: '#344e63',
            900: '#2f4354',
          },
        },
        // Keep primary as alias for backward compatibility during transition
        primary: {
          50: '#f6f7f4',
          100: '#e8ebe3',
          200: '#d4dbc9',
          300: '#b5c2a4',
          400: '#94a67d',
          500: '#768a5e',
          600: '#5c6e49',
          700: '#48573b',
          800: '#3b4732',
          900: '#333d2c',
        },
      },
      fontFamily: {
        // Refined serif for headings - organic, literary feel
        display: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        // Clean sans for body - readable, modern
        body: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      spacing: {
        // Japanese-inspired spacing based on tatami proportions
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        // Softer, more organic radii
        'zen': '0.375rem',
        'zen-lg': '0.5rem',
        'zen-xl': '0.75rem',
      },
      boxShadow: {
        // Subtle, ink-wash inspired shadows
        'zen': '0 1px 3px rgba(26, 26, 26, 0.04), 0 1px 2px rgba(26, 26, 26, 0.06)',
        'zen-md': '0 4px 6px rgba(26, 26, 26, 0.04), 0 2px 4px rgba(26, 26, 26, 0.06)',
        'zen-lg': '0 10px 15px rgba(26, 26, 26, 0.04), 0 4px 6px rgba(26, 26, 26, 0.06)',
        'zen-inner': 'inset 0 1px 2px rgba(26, 26, 26, 0.04)',
      },
      backgroundImage: {
        // Subtle paper texture gradient
        'washi': 'linear-gradient(135deg, rgba(250,250,249,0.8) 0%, rgba(245,245,244,0.6) 100%)',
        'washi-warm': 'linear-gradient(135deg, rgba(253,252,249,0.8) 0%, rgba(249,246,238,0.6) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.2s ease-out forwards',
        'breathe': 'breathe 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};
