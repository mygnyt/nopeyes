/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#090a0f',
          800: '#11131c',
          700: '#191c2b',
          600: '#23273c',
          500: '#323753',
        },
        accent: {
          nope: '#f43f5e',   // Rose red for Option A
          yes: '#06b6d4',    // Cyan for Option B
          gold: '#eab308',
        }
      },
      fontFamily: {
        sans: [
          'SF Pro Display',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Inter',
          'sans-serif',
        ],
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 2.5s infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(0.98)' },
        }
      }
    },
  },
  plugins: [],
}
