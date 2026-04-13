/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'zoom-in-95': { from: { transform: 'scale(0.95)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
        'slide-in-from-top-4': { from: { transform: 'translateY(-1rem)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'slide-in-from-top-2': { from: { transform: 'translateY(-0.5rem)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'zoom-in-95': 'zoom-in-95 0.2s ease-out',
        'slide-in-from-top-4': 'slide-in-from-top-4 0.5s ease-out',
        'slide-in-from-top-2': 'slide-in-from-top-2 0.2s ease-out',
      }
    },
  },
  plugins: [],
}
