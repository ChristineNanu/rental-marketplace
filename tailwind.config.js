/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Amber = tools/hardware/marketplace energy; slate = trust/neutral.
        // Deliberately distinct from RescueMePets' teal/coral — this is its own brand.
        amber:  { 50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706',700:'#b45309',800:'#92400e',900:'#78350f' },
        slate:  { 50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',800:'#1e293b',900:'#0f172a' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        'glow-amber': '0 0 30px -5px rgba(245,158,11,0.35)',
        'card':       '0 4px 24px -4px rgba(0,0,0,0.08)',
        'card-hover': '0 16px 48px -8px rgba(0,0,0,0.16)',
      },
    },
  },
  plugins: [],
}
