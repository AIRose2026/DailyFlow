import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#05070a",
          900: "#0a0f14",
          800: "#0f161d",
          700: "#161f28",
          600: "#202c38",
          500: "#2c3b49",
        },
        accent: {
          DEFAULT: "#2dfbe0",
          50: "#e7fffb",
          100: "#c3fff5",
          200: "#8dffec",
          300: "#4dfbe1",
          400: "#2dfbe0",
          500: "#0fd9c2",
          600: "#0aad9c",
          700: "#0c877c",
          800: "#106b64",
          900: "#125854",
        },
        danger: {
          DEFAULT: "#ff5470",
          400: "#ff7a90",
          500: "#ff5470",
          600: "#e63a58",
        },
        warn: {
          DEFAULT: "#ffb84d",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        "glow-sm": "0 0 12px 0 rgba(45, 251, 224, 0.35)",
        glow: "0 0 24px 0 rgba(45, 251, 224, 0.35), 0 0 4px 0 rgba(45, 251, 224, 0.5)",
        "glow-lg": "0 0 48px 0 rgba(45, 251, 224, 0.3), 0 0 8px 0 rgba(45, 251, 224, 0.45)",
        "inner-glow": "inset 0 0 20px 0 rgba(45, 251, 224, 0.15)",
        card: "0 4px 30px rgba(0, 0, 0, 0.35)",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #2dfbe0 0%, #0aad9c 100%)",
      },
      backdropBlur: {
        xs: "2px",
      },
      borderRadius: {
        xl2: "1.25rem",
        "3xl": "1.75rem",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.92)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        "pop-in": "pop-in 0.2s ease-out",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
