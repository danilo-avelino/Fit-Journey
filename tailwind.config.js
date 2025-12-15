/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: {
          950: "#05161A", // Darkest background
          900: "#0B1E26", // Card background
          800: "#12303B", // Lighter card
          500: "#2A9D8F", // Primary accent
          400: "#4FD1C5", // Bright accent
        },
        gold: {
          400: "#F3DFA2", // Light Gold
          500: "#D4AF37", // Base Gold
          600: "#AA8C2C", // Dark Gold
        },
      },
      fontFamily: {
        // In a real app, you'd load Montserrat here
        sans: ["System"], 
      }
    },
  },
  plugins: [],
};