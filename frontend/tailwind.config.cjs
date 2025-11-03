/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        satoshi: ['Satoshi', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
      base: "#F6F6F6",
      primary: "#A0C4FF",
      secondary: "#BDB2FF",
      accent: "#FFADAD",
    },
    },
  },
  plugins: [],
}

