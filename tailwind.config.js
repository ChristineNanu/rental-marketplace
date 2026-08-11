/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        amber: { 50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706',700:'#b45309',800:'#92400e',900:'#78350f' },
        slate:  { 50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',800:'#1e293b',900:'#0f172a' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        'glow-amber':  '0 0 40px -8px rgba(245,158,11,0.5)',
        'glow-sm':     '0 0 20px -4px rgba(245,158,11,0.3)',
        'card':        '0 4px 24px -4px rgba(0,0,0,0.08)',
        'card-hover':  '0 20px 60px -10px rgba(0,0,0,0.15)',
        'inner-glow':  'inset 0 1px 0 rgba(255,255,255,0.15)',
      },
      backgroundOpacity: {
        8: '0.08',
      },
      keyframes: {
        shimmer: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        gradientShift: {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        'shimmer':        'shimmer 1.5s infinite',
        'fade-up':        'fadeUp 0.5s ease both',
        'scale-in':       'scaleIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
        'float':          'float 3s ease-in-out infinite',
        'gradient':       'gradientShift 4s ease infinite',
        'spin-slow':      'spin 8s linear infinite',
      },
    },
  },
  plugins: [],
}
