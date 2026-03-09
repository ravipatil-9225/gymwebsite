/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#E34A29",
        "primary-hover": "#C43C20",
        dark: "var(--color-bg-main)",
        "dark-card": "var(--color-bg-card)",
      },
      textColor: {
        white: "var(--color-text-main)",
        gray: {
          300: "var(--color-text-main)",
          400: "var(--color-text-muted)",
        }
      },
      borderColor: {
        "white/5": "var(--color-border)",
        "white/10": "var(--color-border)",
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Oswald"', '"Teko"', 'system-ui', 'sans-serif'], // Oswald/Teko for bold athletic typography
      },
      backgroundImage: {
        'hero-pattern': "url('/placeholder-hero.jpg')",
      }
    },
  },
  plugins: [],
}
