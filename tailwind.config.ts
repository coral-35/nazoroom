import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        mist: "#f7faf9",
        signal: "#008a72"
      },
      boxShadow: {
        soft: "0 16px 40px rgb(23 32 51 / 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
