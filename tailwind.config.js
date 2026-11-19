/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#C0392B',
          50: '#FDF2F0',
          100: '#FBE4E1',
          200: '#F6CAC3',
          300: '#EEA297',
          400: '#E47464',
          500: '#C0392B',
          600: '#A72B1E',
          700: '#8C2016',
          800: '#731B13',
          900: '#601A13',
        },
        accent: {
          DEFAULT: '#D97706',
          yellow: '#F59E0B',
          blue: '#0284C7',
          green: '#16A34A',
        },
        surface: {
          DEFAULT: '#F8FAFC',
          card: '#FFFFFF',
          muted: '#F1F5F9',
          border: '#E2E8F0',
        }
      },
      fontFamily: {
        anek: ['"Anek Malayalam"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', '"Anek Malayalam"', 'system-ui', 'sans-serif'],
      },
      lineHeight: {
        malayalam: '1.48',
      }
    },
  },
  plugins: [],
}
