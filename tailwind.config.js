/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand
        navy:    { DEFAULT: '#050816', 50: '#0A1030', 100: '#080D25', 200: '#060A1C', 300: '#050816', 2: '#080D25' },
        card:    { DEFAULT: '#0F1228', light: '#151830', border: 'rgba(255,255,255,0.07)' },
        orange:  { DEFAULT: '#FF6B2B', light: '#FF8A50', dim: 'rgba(255,107,43,0.12)', glow: 'rgba(255,107,43,0.25)' },
        violet:  { DEFAULT: '#7C3AED', light: '#9B5FF7', dim: 'rgba(124,58,237,0.12)' },
        teal:    { DEFAULT: '#00D9C0', dim: 'rgba(0,217,192,0.10)' },
        mint:    { DEFAULT: '#10B981', dim: 'rgba(16,185,129,0.10)' },
        danger:  { DEFAULT: '#EF4444', dim: 'rgba(239,68,68,0.10)' },
        amber:   { DEFAULT: '#F59E0B', dim: 'rgba(245,158,11,0.10)' },
        // Text
        'text-primary':   'rgba(255,255,255,0.92)',
        'text-secondary': 'rgba(255,255,255,0.55)',
        'text-tertiary':  'rgba(255,255,255,0.30)',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono:    ['Space Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-brand':   'linear-gradient(135deg, #FF6B2B, #7C3AED)',
        'gradient-dark':    'linear-gradient(160deg, #080D25 0%, #050816 100%)',
        'gradient-card':    'linear-gradient(160deg, #0F1228 0%, #0A0D20 100%)',
        'gradient-orange':  'linear-gradient(135deg, #FF6B2B, #FF8A50)',
        'gradient-violet':  'linear-gradient(135deg, #7C3AED, #9B5FF7)',
        'gradient-teal':    'linear-gradient(135deg, #00D9C0, #00B8A3)',
        'dot-pattern':      'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot': '28px 28px',
      },
      boxShadow: {
        'orange-glow':  '0 0 30px rgba(255,107,43,0.25), 0 0 60px rgba(255,107,43,0.10)',
        'violet-glow':  '0 0 30px rgba(124,58,237,0.25), 0 0 60px rgba(124,58,237,0.10)',
        'teal-glow':    '0 0 30px rgba(0,217,192,0.20)',
        'card-glow':    '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05)',
        'inner-top':    'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      animation: {
        'fade-in':        'fadeIn 0.4s ease-out',
        'slide-up':       'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'slide-down':     'slideDown 0.3s cubic-bezier(0.16,1,0.3,1)',
        'scale-in':       'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        'pulse-glow':     'pulseGlow 2s ease-in-out infinite',
        'shimmer':        'shimmer 1.5s linear infinite',
        'bounce-dot':     'bounceDot 1.2s ease-in-out infinite',
        'spin-slow':      'spin 3s linear infinite',
        'float':          'float 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:        { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:       { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideDown:     { from: { opacity: 0, transform: 'translateY(-10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn:       { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
        pulseGlow:     { '0%,100%': { opacity: 0.6 }, '50%': { opacity: 1 } },
        shimmer:       { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        bounceDot:     { '0%,80%,100%': { transform: 'scale(0)', opacity: 0.5 }, '40%': { transform: 'scale(1)', opacity: 1 } },
        float:         { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        gradientShift: { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
      },
      borderRadius: {
        'xl2': '20px',
        'xl3': '24px',
      },
    },
  },
  plugins: [],
};
