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
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Bebas Neue"', '"Oswald"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-pattern': "url('/hero_bg.png')",
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      boxShadow: {
        'glow-primary': '0 0 30px rgba(227, 74, 41, 0.4)',
        'glow-primary-lg': '0 0 60px rgba(227, 74, 41, 0.3)',
      }
    },
  },
  plugins: [],
}
