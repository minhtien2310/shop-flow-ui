/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT: '#0f172a', muted: '#1e293b', border: '#334155' },
        accent: { DEFAULT: '#22c55e', hover: '#16a34a' }
      }
    }
  },
  plugins: []
};
