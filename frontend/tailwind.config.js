/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        corridor: {
          dark: '#0A0F1D',
          navy: '#0F172A',
          card: '#1E293B',
          accent: '#2563EB',
          red: '#EF4444',
          'red-dark': '#DC2626',
          green: '#10B981',
          amber: '#F59E0B',
          muted: '#64748B'
        }
      },
      fontFamily: {
        sans: ['Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['Courier New', 'Courier', 'monospace'],
        board: ['Arial Black', 'Impact', 'sans-serif']
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'flash': 'flash 1.2s infinite'
      },
      keyframes: {
        flash: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        }
      }
    },
  },
  plugins: [],
}
