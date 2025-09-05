/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Scan all JSX/TSX in src
    "./index.html" // Optional: also scan HTML
  ],
  theme: {
    extend: {
      colors: {
        theme: "var(--theme-color)", // Optional: dynamic theme color via CSS variable
      },
    },
  },
  plugins: [],
};
