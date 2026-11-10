import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Mwinda Brand Signature
        brand: {
          navy: "#0B1B3D",
          blue: "#0284C7",
          orange: "#EA580C",
          dark: "#0F172A",
          light: "#F8FAFC",
        },

        // Shadcn UI Semantic Tokens
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Backward compatibility for existing Mwinda tokens
        "primary-container": "#0B1B3D",
        "on-primary": "#ffffff",
        "on-primary-container": "#7684ac",
        "primary-fixed": "#dae2ff",
        "primary-fixed-dim": "#b7c6f1",

        "secondary-dark": "#006398",
        "secondary-accent": "#38BDF8",
        "secondary-container": "#5bb8fe",
        "secondary-fixed": "#cce5ff",
        "secondary-fixed-dim": "#93ccff",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#00476e",

        "tertiary": "#EA580C",
        "tertiary-hover": "#C2410C",
        "tertiary-container": "#390e00",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#e55507",
        "tertiary-fixed": "#ffdbce",

        "surface": "#F8FAFC",
        "surface-bright": "#f8f9ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container": "#e5eeff",
        "surface-container-high": "#dce9ff",
        "surface-container-highest": "#d3e4fe",
        "surface-variant": "#d3e4fe",
        "surface-dim": "#cbdbf5",

        "on-surface": "#0F172A",
        "on-surface-variant": "#475569",
        "on-background": "#0B1C30",
        "outline": "#75777f",
        "outline-variant": "#E2E8F0",
        "outline-light": "#CBD5E1",
        "disabled": "#94A3B8",

        "error": "#ba1a1a",
        "error-container": "#ffdad6",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        DEFAULT: "0.5rem",
        xl: "1rem",
        "2xl": "1.25rem",
        full: "9999px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-plus-jakarta)", "sans-serif"],
        headline: ["var(--font-plus-jakarta)", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)",
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)",
        "card-hover": "0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
        modal: "0px 16px 40px rgba(11, 27, 61, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
