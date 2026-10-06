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
        // Kinshasa Commerce Grid Palette
        "primary": "#0B1B3D",
        "primary-container": "#0B1B3D",
        "on-primary": "#ffffff",
        "on-primary-container": "#7684ac",
        "primary-fixed": "#dae2ff",
        "primary-fixed-dim": "#b7c6f1",

        "secondary": "#0284C7",
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

        "background": "#F8FAFC",
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
        DEFAULT: "0.5rem", // 8px
        md: "0.5rem", // 8px
        lg: "0.5rem", // 8px
        xl: "1rem", // 16px
        "2xl": "1.25rem",
        full: "9999px",
      },
      spacing: {
        "margin": "1rem",
        "margin-tablet": "1.5rem",
        "margin-desktop": "2.5rem",
        "gutter": "1rem",
        "gutter-desktop": "1.5rem",
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "space-xl": "2rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-plus-jakarta)", "sans-serif"],
        headline: ["var(--font-plus-jakarta)", "sans-serif"],
      },
      boxShadow: {
        card: "0px 1px 3px rgba(11, 27, 61, 0.04), 0px 4px 12px rgba(11, 27, 61, 0.03)",
        "card-hover": "0px 8px 24px rgba(11, 27, 61, 0.08), 0px 2px 6px rgba(11, 27, 61, 0.04)",
        modal: "0px 16px 40px rgba(11, 27, 61, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
