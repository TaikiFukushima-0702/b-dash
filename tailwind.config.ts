import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', "system-ui", "sans-serif"],
        body: ['"Mochiy Pop One"', "system-ui", "sans-serif"],
      },
      colors: {
        sky: {
          soft: "#bde4ff",
          mid: "#74c7ff",
          deep: "#3a8de0",
        },
        pop: {
          pink: "#ffb1d8",
          yellow: "#ffe16c",
          green: "#98e89a",
          purple: "#c5a3ff",
          orange: "#ffb074",
        },
        frame: {
          dark: "#2b2b3d",
          mid: "#4a4a66",
          light: "#f7f3e3",
        },
      },
      boxShadow: {
        pop: "0 6px 0 rgba(0,0,0,0.15)",
        inner_pop: "inset 0 -4px 0 rgba(0,0,0,0.1)",
      },
      animation: {
        "bob": "bob 2s ease-in-out infinite",
        "wiggle": "wiggle 0.6s ease-in-out infinite",
        "pop-in": "pop-in 0.3s ease-out",
      },
      keyframes: {
        bob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "70%": { transform: "scale(1.1)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
