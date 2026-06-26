/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        wave: {
          DEFAULT: "#22e584",
          dim: "#16a34a",
          glow: "#4ade80",
        },
        ink: {
          900: "#0a0f14",
          800: "#0f1620",
          700: "#16202c",
          600: "#1f2d3d",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
