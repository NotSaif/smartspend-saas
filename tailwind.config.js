/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Deep ink surfaces
        navy: {
          950: '#04050A',
          900: '#07080F',
          800: '#0C0E1A',
          700: '#131628',
          600: '#1C2038',
          500: '#272C4A',
        },
        // Primary accent (electric violet) — paired with cyan in gradients
        brand: {
          600: '#6A48F5',
          500: '#7C5CFF',
          400: '#9B83FF',
          300: '#C0B2FF',
          200: '#DDD5FF',
        },
        cyan: {
          500: '#06B6D4',
          400: '#22D3EE',
          300: '#67E8F9',
        },
        // Semantic colours (kept: green = on track / income, red = over budget / expense, amber = anomaly)
        emerald: { 500: '#10B981', 400: '#34D399', 300: '#6EE7B7' },
        coral:   { 500: '#F43F5E', 400: '#FB7185', 300: '#FDA4AF' },
        amber:   { 500: '#F59E0B', 400: '#FBBF24', 300: '#FCD34D' },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        glass: '0 1px 0 0 rgba(255,255,255,0.06) inset, 0 20px 50px -20px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(124,92,255,0.35), 0 10px 40px -10px rgba(124,92,255,0.55)',
        'glow-cyan': '0 10px 40px -12px rgba(34,211,238,0.5)',
      },
      keyframes: {
        aurora: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '33%': { transform: 'translate3d(4%,-6%,0) scale(1.08)' },
          '66%': { transform: 'translate3d(-5%,4%,0) scale(0.95)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        gradient: { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        rise: { from: { opacity: 0, transform: 'translateY(14px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pop: { from: { opacity: 0, transform: 'translateY(10px) scale(0.97)' }, to: { opacity: 1, transform: 'translateY(0) scale(1)' } },
        slideIn: { from: { opacity: 0, transform: 'translateX(40px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        spin: { to: { transform: 'rotate(360deg)' } },
        pulseRing: { '0%': { boxShadow: '0 0 0 0 rgba(251,191,36,0.45)' }, '100%': { boxShadow: '0 0 0 10px rgba(251,191,36,0)' } },
      },
      animation: {
        aurora: 'aurora 22s ease-in-out infinite',
        'aurora-slow': 'aurora 30s ease-in-out infinite reverse',
        shimmer: 'shimmer 1.6s infinite',
        float: 'float 6s ease-in-out infinite',
        gradient: 'gradient 8s ease infinite',
        rise: 'rise .5s cubic-bezier(.2,.7,.2,1) both',
        pop: 'pop .28s cubic-bezier(.2,.8,.2,1) both',
        slideIn: 'slideIn .3s ease both',
        spin: 'spin 1s linear infinite',
        'pulse-ring': 'pulseRing 1.6s ease-out infinite',
      },
    },
  },
  plugins: [],
};
