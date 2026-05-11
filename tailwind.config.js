/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rose:  { 50: "#FDF2F4", 100: "#F9E8EC", 200: "#F2C5D0", 500: "#C05070", 600: "#A03D58" },
        navy:  { 50: "#EEF2F7", 100: "#D4DFF0", 700: "#1A2E4A", 800: "#111E31" },
        sage:  { 50: "#EEF7F2", 100: "#D4EDE0", 500: "#3A8060" },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
