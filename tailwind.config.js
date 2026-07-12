/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "corewyze-purple": "var(--corewyze-purple)",
        "gray-c200": "var(--gray-c200)",
        "gray-c300": "var(--gray-c300)",
        "gray-c500": "var(--gray-c500)",
        "gray-c600": "var(--gray-c600)",
        "gray-cobsidian": "var(--gray-cobsidian)",
        "gray-cwhite": "var(--gray-cwhite)",
        "review-bg": "var(--review-bg)",
        "utility-white": "var(--utility-white)",
      },
      fontFamily: {
        display: ["Gilroy-Bold", "Helvetica", "sans-serif"],
        heading: ["Gilroy-SemiBold", "Helvetica", "sans-serif"],
        body: ["Gilroy-Medium", "Helvetica", "sans-serif"],
        regular: ["Gilroy-Regular", "Helvetica", "sans-serif"],
      },
      screens: {
        xs: "375px",
        // Below this, the builder + review stack in a single column
        // (review internally splits into 2 columns once there's room, see lg:).
        // At/above this, review becomes the narrow 399px sidebar next to the builder.
        dxl: "1440px",
      },
    },
  },
  plugins: [],
};