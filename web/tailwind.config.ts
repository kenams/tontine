import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050706",
        obsidian: "#08110d",
        emerald: {
          400: "#38d996",
          500: "#12c77f",
          600: "#07995f"
        },
        gold: "#d7b56d",
        ivory: "#f7f3e8",
        smoke: "#b9c4bd"
      },
      boxShadow: {
        premium: "0 24px 80px rgba(0, 0, 0, 0.25)",
        glow: "0 0 36px rgba(18, 199, 127, 0.25)"
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
