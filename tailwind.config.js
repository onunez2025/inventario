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
          DEFAULT: '#003178',
          container: '#0d47a1',
          fixed: '#d9e2ff',
        },
        secondary: {
          DEFAULT: '#006b5f',
          container: '#8df5e4',
        },
        surface: {
          DEFAULT: '#f7f9fb',
          container: {
            low: '#f2f4f6',
            high: '#e6e8ea',
            lowest: '#ffffff',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
