/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        jarvis: {
          primary: "#00d2ff",
          secondary: "#3a7bd5",
          accent: "#00f2fe",
          dark: "#0a0a0a",
        },
      },
    },
  },
  plugins: [],
};
