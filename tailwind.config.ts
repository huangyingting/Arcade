import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#f7f6f0', 100: '#efede5', 200: '#deddd2', 300: '#c8c7ba', 400: '#929589',
          500: '#73776b', 600: '#575e50', 700: '#414a3c', 800: '#30382c', 900: '#252d22', 950: '#171e16',
        },
        indigo: {
          50: '#fff3ec', 100: '#fde3d3', 200: '#f8c6ab', 300: '#f0a17b', 400: '#df8057',
          500: '#d26b43', 600: '#b95030', 700: '#994128', 800: '#7d3725', 900: '#653123', 950: '#38170e',
        },
        violet: {
          50: '#f6f5ec', 100: '#eae9d8', 200: '#d4d6b5', 300: '#b7bd8f', 400: '#939d68',
          500: '#77834f', 600: '#5c693c', 700: '#465132', 800: '#39432c', 900: '#303925', 950: '#171e14',
        },
        mkt: {
          cream: "#F6F4EE",
          card: "#EFECE4",
          obsidian: "#0D0E12",
          ink: "#111215",
          muted: "#4A4D55",
        },
        arcade: {
          primary: "#b95030",
          blue: "#2563EB",
          gold: "#D4AF37",
          crimson: "#C42B1C",
          cobalt: "#0047AB",
          ivory: "#F4EFE6",
          obsidian: "#111111",
        }
      },
      fontFamily: {
        sans: ["Mona Sans", "Noto Sans SC", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      }
    },
  },
  plugins: [],
};
export default config;
