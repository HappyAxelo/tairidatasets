import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        // Institutional palette (spec): primary #0056A6, secondary #1976D2.
        brand: {
          50: "#e9f2fb",
          100: "#cfe1f5",
          200: "#9fc3ea",
          300: "#6fa5df",
          400: "#3f87d4",
          500: "#1976D2",
          600: "#0056A6",
          700: "#004585",
          800: "#003466",
          900: "#002346",
        },
        surface: "#ffffff",
        muted: "#f6f8fa",
        card: "#fbfcfd",
        border: "#e5e9ee",
        ink: {
          DEFAULT: "#0f172a",
          soft: "#334155",
          faint: "#64748b",
        },
        success: "#127b45",
        warning: "#b45309",
        danger: "#b42318",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)",
        pop: "0 8px 24px rgba(16, 24, 40, 0.10)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
