/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        moveBackground: {
          "0%": { backgroundPosition: "0 0, 0 0" },
          "100%": { backgroundPosition: "20px 20px, 20px 20px" },
        },
      },
      animation: {
        moveBackground: "moveBackground 3s linear infinite",
      },
      backgroundImage: {
        radial: "radial-gradient(rgba(87, 87, 87, 0.3) 1px, transparent 1px), radial-gradient(rgba(87, 87, 87, 0.3) 1px, transparent 1px)",
      },
      backgroundSize: {
        "20px": "20px 20px",
      },
      backgroundPosition: {
        "default": "0 0, 0 0",
      },
      gridTemplateColumns: {
        'auto-fit-min-200': 'repeat(auto-fit, minmax(200px, 1fr))',
      },
    },
  },
  plugins: [],
};
