/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Scan all JSX/TSX in src
    "./public/index.html"         // Optional: also scan HTML
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
