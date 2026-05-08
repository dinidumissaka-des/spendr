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
        background: "rgb(var(--background) / <alpha-value>)",
        surface:    "rgb(var(--surface)    / <alpha-value>)",
        surface2:   "rgb(var(--surface2)   / <alpha-value>)",
        border:     "rgb(var(--border)     / <alpha-value>)",
        text:       "rgb(var(--foreground) / <alpha-value>)",
        muted:      "rgb(var(--muted)      / <alpha-value>)",
        accent:     "rgb(var(--accent)     / <alpha-value>)",
        "accent-on":"rgb(var(--accent-on)  / <alpha-value>)",
        primary:    "rgb(var(--accent)     / <alpha-value>)",
        danger:     "rgb(var(--danger)     / <alpha-value>)",
        tertiary:   "#00B67A",
        // shadcn aliases
        foreground:           "rgb(var(--foreground) / <alpha-value>)",
        card:                 { DEFAULT: "rgb(var(--surface)  / <alpha-value>)", foreground: "rgb(var(--foreground) / <alpha-value>)" },
        popover:              { DEFAULT: "rgb(var(--surface2) / <alpha-value>)", foreground: "rgb(var(--foreground) / <alpha-value>)" },
        "muted-foreground":   "rgb(var(--muted)      / <alpha-value>)",
        "accent-foreground":  "rgb(var(--accent-on)  / <alpha-value>)",
        destructive:          { DEFAULT: "rgb(var(--danger)   / <alpha-value>)", foreground: "rgb(var(--foreground) / <alpha-value>)" },
        input:                "rgb(var(--border)     / <alpha-value>)",
        ring:                 "rgb(var(--accent)     / <alpha-value>)",
        "primary-foreground": "rgb(var(--accent-on)  / <alpha-value>)",
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
