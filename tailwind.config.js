/** @type {import('tailwindcss').Config} */
// Light theme — "Clean Minimal". Token names preserved from the dark-theme
// build so existing JSX class usage (bg-navy, text-orange, shadow-orange-glow,
// bg-gradient-brand, …) keeps working; only the VALUES behind each token
// change. See globals.css for the mirrored CSS custom-property set.
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Page / surface backgrounds (was navy family)
        navy:    { DEFAULT: '#FFFFFF', 50: '#F3F4F6', 100: '#F9FAFB', 200: '#FDFDFE', 300: '#FFFFFF', 2: '#F9FAFB' },
        card:    { DEFAULT: '#FFFFFF', light: '#F9FAFB', border: 'rgba(10,37,64,0.08)' },

        // Brand primary — was orange, now Stripe-indigo
        orange:  { DEFAULT: '#635BFF', light: '#8780FF', dim: 'rgba(99,91,255,0.10)', glow: 'rgba(99,91,255,0.20)' },

        // Secondary — was violet, now sky blue
        violet:  { DEFAULT: '#0EA5E9', light: '#38BDF8', dim: 'rgba(14,165,233,0.10)' },

        // Accent — was teal, now emerald
        teal:    { DEFAULT: '#10B981', dim: 'rgba(16,185,129,0.10)' },

        // Status colors
        mint:    { DEFAULT: '#22C55E', dim: 'rgba(34,197,94,0.10)' },
        danger:  { DEFAULT: '#EF4444', dim: 'rgba(239,68,68,0.10)' },
        amber:   { DEFAULT: '#F59E0B', dim: 'rgba(245,158,11,0.10)' },

        // Text — dark on light
        'text-primary':   '#0A2540',
        'text-secondary': '#425466',
        'text-tertiary':  '#697386',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono:    ['Space Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-brand':   'linear-gradient(135deg, #635BFF, #0EA5E9)',
        'gradient-dark':    'linear-gradient(160deg, #F9FAFB 0%, #FFFFFF 100%)',
        'gradient-card':    'linear-gradient(160deg, #FFFFFF 0%, #F9FAFB 100%)',
        'gradient-orange':  'linear-gradient(135deg, #635BFF, #8780FF)',
        'gradient-violet':  'linear-gradient(135deg, #0EA5E9, #38BDF8)',
        'gradient-teal':    'linear-gradient(135deg, #10B981, #22C55E)',
        'dot-pattern':      'radial-gradient(circle, rgba(10,37,64,0.08) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot': '28px 28px',
      },
      boxShadow: {
        'orange-glow':  '0 0 30px rgba(99,91,255,0.20), 0 0 60px rgba(99,91,255,0.08)',
        'violet-glow':  '0 0 30px rgba(14,165,233,0.20), 0 0 60px rgba(14,165,233,0.08)',
        'teal-glow':    '0 0 30px rgba(16,185,129,0.18)',
        'card-glow':    '0 1px 2px rgba(10,37,64,0.04), 0 4px 16px rgba(10,37,64,0.06)',
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
