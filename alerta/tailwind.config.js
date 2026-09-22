/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Alerta brand palette — deep navy/teal primary, neutral surfaces,
        // red reserved exclusively for emergency/SOS states.
        brand: {
          50: '#eef5f4',
          100: '#d6e6e4',
          200: '#adcdc9',
          300: '#7cadaa',
          400: '#4d8b88',
          500: '#2f6f6d',
          600: '#1e5957',
          700: '#164846',
          800: '#123736',
          900: '#0f2e2d',
          950: '#0a2021',
        },
        ink: {
          50: '#f7f8f8',
          100: '#eef0f0',
          200: '#dbdfdf',
          300: '#b9c0c1',
          400: '#8f9899',
          500: '#6f7879',
          600: '#565f60',
          700: '#454c4d',
          800: '#383e3f',
          900: '#26292a',
          950: '#16181a',
        },
        emergency: {
          50: '#fef2f2',
          100: '#fde3e3',
          200: '#fbc9c9',
          300: '#f7a3a3',
          400: '#f0706f',
          500: '#e34443',
          600: '#cc2726',
          700: '#ab1e1e',
          800: '#8c1c1c',
          900: '#751c1c',
          950: '#400a0a',
        },
        surface: '#f7f8f7',
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(15, 46, 45, 0.06), 0 1px 3px 0 rgba(15, 46, 45, 0.08)',
        panel: '0 4px 12px -2px rgba(15, 46, 45, 0.12), 0 2px 4px -2px rgba(15, 46, 45, 0.06)',
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
}
