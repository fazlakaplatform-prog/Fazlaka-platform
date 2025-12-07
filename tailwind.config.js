/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0A3D62",
        secondary: "#1E90FF",
        darkBg: "#121212",
        lightText: "#F5F5F5",
      },
      fontFamily: {
        sans: ['"Tajawal"', "ui-sans-serif", "system-ui"],
      },
    },
  },
  darkMode: "class",
  plugins: [require("@tailwindcss/typography")],
};