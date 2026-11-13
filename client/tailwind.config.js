// Tailwind theme and content scanning configuration for the client.
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: "var(--primary)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: "var(--destructive)",
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        indigo: {
          50: "var(--brand-50)", 100: "var(--brand-100)", 200: "var(--brand-200)",
          300: "var(--brand-300)", 400: "var(--brand-400)", 500: "var(--brand-500)",
          600: "var(--brand-600)", 700: "var(--brand-700)", 800: "var(--brand-800)",
          900: "var(--brand-900)", 950: "var(--brand-950)",
        },
        violet: {
          50: "var(--brand-50)", 100: "var(--brand-100)", 200: "var(--brand-200)",
          300: "var(--brand-300)", 400: "var(--brand-400)", 500: "var(--brand-500)",
          600: "var(--brand-600)", 700: "var(--brand-700)", 800: "var(--brand-800)",
          900: "var(--brand-900)", 950: "var(--brand-950)",
        },
        slate: {
          50: "var(--slate-50)", 100: "var(--slate-100)", 200: "var(--slate-200)",
          300: "var(--slate-300)", 400: "var(--slate-400)", 500: "var(--slate-500)",
          600: "var(--slate-600)", 700: "var(--slate-700)", 800: "var(--slate-800)",
          900: "var(--slate-900)", 950: "var(--slate-950)",
        },
        gray: {
          50: "var(--slate-50)", 100: "var(--slate-100)", 200: "var(--slate-200)",
          300: "var(--slate-300)", 400: "var(--slate-400)", 500: "var(--slate-500)",
          600: "var(--slate-600)", 700: "var(--slate-700)", 800: "var(--slate-800)",
          900: "var(--slate-900)", 950: "var(--slate-950)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Geist Variable", "sans-serif"],
      },
    },
  },
  plugins: [],
}

