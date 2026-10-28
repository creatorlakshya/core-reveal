/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F5EFC6',
        burgundy: '#4D0E12',
        cerulean: '#A5BCD6',
        'potting-soil': '#4A2E27',
        'java-brown': '#231815',
      },
      fontFamily: {
        serif: ['DM Serif Display', 'Cormorant Garamond', 'Georgia', 'serif'],
        'serif-sub': ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Manrope', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['IBM Plex Mono', 'JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
