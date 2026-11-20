import type { Config } from 'tailwindcss';

const config: Config = {
  // Les composants shadcn/ui vivent dans un conteneur `.ui` : aucun impact sur le design public (legacy.css).
  important: '.ui',
  corePlugins: { preflight: false, container: false },
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          dark: '#C96F12',
        },
        dark: '#1E1E22',
        light: '#F5F5F5',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: '0 0% 100%' },
        surface: '#FFFFFF',
        text: {
          DEFAULT: '#1E1E22',
          muted: '#666666',
        },
        success: '#E68723',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        condensed: ['var(--font-barlow-condensed)', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
      },
      maxWidth: {
        container: '1280px',
      },
      screens: {
        mobile: '390px',
        tablet: '768px',
        desktop: '1024px',
        wide: '1440px',
      },
    },
  },
  plugins: [],
};

export default config;

