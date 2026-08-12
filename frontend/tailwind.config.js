/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0b0d14',
        cardBg: '#141724',
        cardHover: '#1c2035',
        accentPrimary: '#6366f1',
        accentSecondary: '#ec4899',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        arcade: ['"Press Start 2P"', 'monospace'],
      },
    },
  },
  plugins: [],
};
