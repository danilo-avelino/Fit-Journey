/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
            900: "#0B1E26", 
            800: "#12303B",
            600: "#2A9D8F",
        },
        gold: {
            500: "#D4AF37",
        }
      }
    },
  },
  plugins: [],
};