/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nuclear: '#3b82f6', // blue
        gas: '#f97316',     // orange
        hydro: '#06b6d4',   // cyan
        wind: '#10b981',    // emerald
        battery: '#a855f7', // purple
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
