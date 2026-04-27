/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        navy: {
          900: '#0A1628',
          800: '#0F1F3D',
          700: '#162647',
          600: '#1E3358',
        },
        brand: {
          500: '#2563EB',
          400: '#3B82F6',
          300: '#60A5FA',
        },
        emerald: {
          500: '#10B981',
          400: '#34D399',
        },
        coral: {
          500: '#EF4444',
          400: '#F87171',
        },
        amber: {
          500: '#F59E0B',
          400: '#FBBF24',
        },
      },
    },
  },
  plugins: [],
}
