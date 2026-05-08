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
        background: "rgb(10 15 8)",
        surface:    "rgba(255, 255, 255, 0.07)",
        surface2:   "rgba(255, 255, 255, 0.12)",
        border:     "rgba(255, 255, 255, 0.10)",
        text:       "rgba(255, 255, 255, 0.88)",
        muted:      "rgba(255, 255, 255, 0.42)",
        accent:     "rgb(var(--accent)    / <alpha-value>)",
        "accent-on":"rgb(var(--accent-on) / <alpha-value>)",
        primary:    "rgb(var(--accent)    / <alpha-value>)",
        danger:     "rgb(var(--danger)    / <alpha-value>)",
        tertiary:   "#00B67A",
        // shadcn aliases
        foreground:           "rgba(255, 255, 255, 0.88)",
        card:                 { DEFAULT: "rgba(255, 255, 255, 0.07)", foreground: "rgba(255, 255, 255, 0.88)" },
        popover:              { DEFAULT: "rgba(255, 255, 255, 0.12)", foreground: "rgba(255, 255, 255, 0.88)" },
        "muted-foreground":   "rgba(255, 255, 255, 0.42)",
        "accent-foreground":  "rgb(var(--accent-on) / <alpha-value>)",
        destructive:          { DEFAULT: "rgb(var(--danger) / <alpha-value>)", foreground: "rgba(255, 255, 255, 0.88)" },
        input:                "rgba(255, 255, 255, 0.13)",
        ring:                 "rgb(var(--accent) / <alpha-value>)",
        "primary-foreground": "rgb(var(--accent-on) / <alpha-value>)",
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
