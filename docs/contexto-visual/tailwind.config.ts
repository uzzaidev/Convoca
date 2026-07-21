// ============================================================
// Convoca · tailwind.config.ts
// shadcn/ui + brand tokens (pitch, gold, coral, navy)
// ============================================================

import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Bebas Neue'", "'Oswald'", "'Anton'", "Impact", "sans-serif"],
        sans: ["'DM Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Space Mono'", "ui-monospace", "monospace"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },

        // ─── Brand tokens (Convoca) ───
        pitch: {
          DEFAULT: "hsl(var(--pitch))",
          deep: "hsl(var(--pitch-deep))",
          glow: "hsl(var(--pitch-glow))",
          50: "hsl(var(--pitch-50))",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          50: "hsl(var(--gold-50))",
        },
        coral: "hsl(var(--coral))",
        navy: {
          DEFAULT: "hsl(var(--navy))",
          2: "hsl(var(--navy-2))",
          light: "hsl(var(--navy-light))",
        },
        "green-dark": {
          DEFAULT: "hsl(var(--green-dark))",
          light: "hsl(var(--green-light))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      boxShadow: {
        "warm-sm": "0 1px 2px hsl(218 60% 10% / .05)",
        "warm-md": "0 6px 18px hsl(218 60% 10% / .06), 0 1px 3px hsl(218 60% 10% / .04)",
        "warm-lg": "0 18px 40px hsl(218 60% 10% / .08), 0 4px 10px hsl(218 60% 10% / .05)",
        glow: "0 0 0 4px hsl(var(--pitch-glow) / .18)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-live": { "50%": { opacity: ".4" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-live": "pulse-live 1.4s infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
