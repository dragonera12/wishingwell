/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#060609",
        surface: "#0e1117",
        border: "#1e2433",
        primary: "#2563eb",
        secondary: "#7c3aed",
        success: "#16a34a",
        warning: "#d97706",
        danger: "#dc2626",
        tokenA: "#22c55e",
        tokenB: "#3b82f6",
        lpToken: "#a855f7",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
}
