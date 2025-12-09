/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        party: {
          'socialdemokraterna': '#E02020',
          'bondeforbundet': '#166534',
          'liberala': '#3B82F6',
          'vansterpartiet': '#7C2D12',
          'hoger': '#4338CA',
          'nationella': '#6366F1',
          'default': '#6B7280',
        },
      },
    },
  },
  plugins: [],
}

