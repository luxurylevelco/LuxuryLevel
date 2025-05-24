/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}", // if using the App Router
  ],
  theme: {
    extend: {
      opacity: {
        15: "0.15",
        35: "0.35",
        65: "0.65",
      },
    },
  },
  plugins: [],
};
