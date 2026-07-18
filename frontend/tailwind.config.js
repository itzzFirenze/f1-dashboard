/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        f1: {
          red: '#E10600',
          'red-dark': '#B30500',
          'red-light': '#FF1801',
          black: '#15151E',
          'dark-gray': '#1E1E2E',
          'mid-gray': '#2D2D3F',
          'light-gray': '#38384F',
          white: '#F5F5F5',
          silver: '#9B9BAD',
        },
        // Team colors
        team: {
          'red-bull': '#3671C6',
          ferrari: '#E8002D',
          mclaren: '#FF8000',
          mercedes: '#27F4D2',
          'aston-martin': '#229971',
          alpine: '#FF87BC',
          williams: '#64C4FF',
          rb: '#6692FF',
          sauber: '#52E252',
          haas: '#B6BABD',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'count-up': 'countUp 1s ease-out',
        shimmer: 'shimmer 2s linear infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(225, 6, 0, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(225, 6, 0, 0.4)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient':
          'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
