/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./es/**/*.html", "./en/**/*.html", "./public/**/*.html", "./src/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#1d1e20",
          paper: "#ffffff",
          accent: "#d63163",
          cta: "#00b090",
          muted: "#f2f3f6"
        }
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Taviraj", "ui-serif", "Georgia", "serif"]
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,.10)"
      }
    }
  },
  plugins: []
};
