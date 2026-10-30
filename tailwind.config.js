/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./js/**/*.js"],
  theme: {
    extend: {
      fontFamily: {
        console: ['"Saira Condensed"', '"Arial Narrow"', "system-ui", "sans-serif"],
        digits: ['"Share Tech Mono"', "Consolas", "monospace"],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        console: {
          primary: "#e2382f", // ON AIR red
          "primary-content": "#fff3f1",
          secondary: "#3ecf74", // link green
          "secondary-content": "#0c1512",
          accent: "#f5a623", // process amber
          neutral: "#1e2126",
          "neutral-content": "#d7d3c8",
          "base-100": "#1e2126", // module face
          "base-200": "#181b1f",
          "base-300": "#121417", // rack chassis
          "base-content": "#d7d3c8", // silkscreen ink
          error: "#e2382f",
          success: "#3ecf74",
          warning: "#f5a623",
          info: "#5aa9e6",
        },
      },
    ],
  },
}
