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
          DEFAULT: '#003B65',
          container: '#004a7c',
          fixed: '#d9e2ff',
        },
        secondary: {
          DEFAULT: '#00A1DE',
          container: '#b3e5fc',
        },
        surface: {
          DEFAULT: '#F8FAFC',
          container: {
            low: '#f1f5f9',
            high: '#e2e8f0',
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
