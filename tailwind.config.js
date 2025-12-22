/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Jett brand colors - can customize later
        jett: {
          bg: '#0f0f0f',
          surface: '#1a1a1a',
          border: '#2a2a2a',
          text: '#ffffff',
          muted: '#888888',
          accent: '#3b82f6',
        }
      }
    },
  },
  plugins: [],
}
