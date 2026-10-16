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
        mkt: {
          cream: "#F6F4EE",
          card: "#EFECE4",
          obsidian: "#0D0E12",
          ink: "#111215",
          muted: "#4A4D55",
        },
        arcade: {
          primary: "#4F46E5",
          blue: "#2563EB",
          gold: "#D4AF37",
          crimson: "#C42B1C",
          cobalt: "#0047AB",
          ivory: "#F4EFE6",
          obsidian: "#111111",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      }
    },
  },
  plugins: [],
};
export default config;
