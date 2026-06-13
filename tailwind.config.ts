import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#070712",
          900: "#0a0a14",
          800: "#0f0f1c",
          700: "#15152a",
          600: "#1c1c36",
          500: "#272749",
          400: "#3d3d68",
        },
        neon: {
          DEFAULT: "#00ff9d",
          dim: "#00cc7d",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular"],
      },
      backgroundImage: {
        "neon-gradient":
          "linear-gradient(135deg, #22d3ee 0%, #a855f7 60%, #ff4d6d 100%)",
        "cyan-violet":
          "linear-gradient(135deg, #22d3ee 0%, #a855f7 100%)",
      },
      boxShadow: {
        neon: "0 0 0 1px rgba(34,211,238,0.35), 0 0 30px -8px rgba(34,211,238,0.55)",
        "neon-violet":
          "0 0 0 1px rgba(168,139,250,0.35), 0 0 30px -8px rgba(168,139,250,0.55)",
        "neon-green":
          "0 0 0 1px rgba(0,255,157,0.35), 0 0 24px -6px rgba(0,255,157,0.55)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
        marquee: "marquee 30s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
