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
        background: "#101014",
        surface:    "#1c1c24",
        surface2:   "#26262f",
        border:     "#2e2e3a",
        text:       "#ffffff",
        muted:      "#6b6b80",
        accent:     "#9FE870",
        "accent-on":"#163300",
        primary:    "#9FE870",
        tertiary:   "#00B67A",
        danger:     "#e05c5c",
        // shadcn aliases
        foreground:           "#ffffff",
        card:                 { DEFAULT: "#1c1c24", foreground: "#ffffff" },
        popover:              { DEFAULT: "#26262f", foreground: "#ffffff" },
        "muted-foreground":   "#6b6b80",
        "accent-foreground":  "#163300",
        destructive:          { DEFAULT: "#e05c5c", foreground: "#ffffff" },
        input:                "#2e2e3a",
        ring:                 "#9FE870",
        "primary-foreground": "#163300",
      },
      fontFamily: {
        serif: ["var(--font-manrope)", "sans-serif"],
        sans:  ["var(--font-manrope)", "sans-serif"],
        mono:  ["var(--font-manrope)", "sans-serif"],
      },
      borderRadius: {
        none:    "0",
        sm:      "0.5rem",
        DEFAULT: "1rem",
        md:      "1.5rem",
        lg:      "1rem",
        xl:      "1.5rem",
        "2xl":   "2rem",
        "3xl":   "3rem",
        full:    "9999px",
      },
      keyframes: {
        fadeSlideIn: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-slide-in": "fadeSlideIn 220ms ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
