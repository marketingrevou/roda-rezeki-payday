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
        navy: "#0d1854",
        gold: "#FFDE3D",
        "gold-dark": "#B8860B",
        cream: "#F5E6C8",
      },
      fontFamily: {
        poppins: ["var(--font-poppins)", "Poppins", "sans-serif"],
        cinzel: ["var(--font-cinzel)", "serif"],
        "cinzel-decorative": ["var(--font-cinzel-decorative)", "serif"],
        pacifico: ["var(--font-pacifico)", "cursive"],
      },
    },
  },
  plugins: [],
};
export default config;
