/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lexend', 'sans-serif'],
        heading: ['Comfortaa', 'cursive'],
      },
      colors: {
        theia: {
          dark: '#1e1e24',
          darker: '#18181b',
          accent: '#8b5cf6',
          aqua: '#06b6d4',
          patina: '#10b981',
        }
      }
    },
  },
  plugins: [],
}
