// Tailwind config — light editorial theme with mood-based accent palettes
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Fraunces"', '"Playfair Display"', 'Georgia', 'serif'],
      },
      colors: {
        ink: {
          50: '#f8f7f4',
          100: '#efeee8',
          200: '#dcd9cf',
          300: '#b9b4a4',
          400: '#7a7565',
          500: '#52503f',
          600: '#34322b',
          700: '#1f1d18',
          800: '#15140f',
        },
        accent: {
          DEFAULT: '#7c5cff',
          soft: '#e9e3ff',
          ink: '#3a2a8a',
        },
        mood: {
          calm: '#6dbb8a',
          sad: '#6c8ec9',
          nostalgic: '#c89868',
          angry: '#d96762',
          dreamy: '#b693d8',
          happy: '#e6b54a',
          excited: '#e87a4d',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(20,18,12,0.04), 0 8px 24px rgba(20,18,12,0.06)',
        glow: '0 12px 36px rgba(124,92,255,0.18)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        'orb-spin': 'orbSpin 6s linear infinite',
        shimmer: 'shimmer 2s ease-in-out infinite',
        'slide-out-left': 'slideOutLeft 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.35s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: 0.95, transform: 'scale(1)' },
          '50%': { opacity: 0.7, transform: 'scale(1.04)' },
        },
        orbSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%, 100%': { opacity: 0.6 },
          '50%': { opacity: 1 },
        },
        slideOutLeft: {
          '0%': { opacity: 1, transform: 'translateX(0) scale(1)' },
          '100%': { opacity: 0, transform: 'translateX(-32px) scale(0.93)' },
        },
        scaleIn: {
          '0%': { opacity: 0, transform: 'scale(0.92)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
