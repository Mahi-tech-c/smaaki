/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#fdf8f4',
          100: '#f9eee5',
          200: '#f1dcd0',
          300: '#e5c1a8',
          400: '#d79e78',
          500: '#cd8050',
          600: '#bf653b',
          700: '#9e4e2f',
          800: '#80402a',
          900: '#673524',
          950: '#381a10',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
