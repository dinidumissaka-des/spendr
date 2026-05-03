import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0d0d0f",
        surface: "#16161a",
        surface2: "#1e1e24",
        border: "#2a2a35",
        accent: "#c8f55a",
        accent2: "#5af5c8",
        text: "#f0f0f2",
        muted: "#6b6b80",
        danger: "#f55a7a",
      },
      fontFamily: {
        serif: ["DM Serif Display", "serif"],
        mono: ["DM Mono", "monospace"],
        sans: ["DM Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
