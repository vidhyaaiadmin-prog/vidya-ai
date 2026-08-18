'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, X } from 'lucide-react';

// ─── Button ────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'violet' | 'teal';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  full?: boolean;
}

const BTN_BASE = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed select-none';
const BTN_VARIANTS = {
  primary:   'bg-orange text-white hover:bg-orange-light shadow-[0_0_20px_rgba(255,107,43,0.3)] hover:shadow-[0_0_30px_rgba(255,107,43,0.5)]',
  secondary: 'bg-card-light text-text-primary border border-card-border hover:border-white/20 hover:bg-white/5',
  outline:   'bg-transparent text-orange border border-orange/40 hover:border-orange hover:bg-orange/5',
  ghost:     'bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5',
  danger:    'bg-danger text-white hover:bg-red-500',
  violet:    'bg-violet text-white hover:bg-violet-light shadow-[0_0_20px_rgba(124,58,237,0.3)]',
  teal:      'bg-teal text-navy font-bold hover:opacity-90',
};
const BTN_SIZES = {
  xs: 'text-[11px] px-3 py-1.5 rounded-lg',
  sm: 'text-xs px-3.5 py-2 rounded-lg',
  md: 'text-sm px-5 py-2.5',
  lg: 'text-base px-7 py-3.5 rounded-xl',
};

export function Button({
  children, variant = 'primary', size = 'md', loading, icon, iconRight, full, className, disabled, ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(BTN_BASE, BTN_VARIANTS[variant], BTN_SIZES[size], full && 'w-full', className)}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
}

// ─── Card ──────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'orange' | 'violet' | 'teal' | 'none';
  hover?: boolean;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className, glow = 'none', hover, onClick, padding = 'md' }: CardProps) {
  const padMap = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-7' };
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-card-border',
        'bg-gradient-to-br from-card to-navy-2',
        'shadow-[0_4px_24px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.04)]',
        padMap[padding],
        hover && 'cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
        glow === 'orange' && 'border-orange/30 shadow-[0_0_30px_rgba(255,107,43,0.15)]',
        glow === 'violet' && 'border-violet/30 shadow-[0_0_30px_rgba(124,58,237,0.15)]',
        glow === 'teal'   && 'border-teal/30 shadow-[0_0_30px_rgba(0,217,192,0.15)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─── Badge / Tag ───────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  color?: 'orange' | 'violet' | 'teal' | 'mint' | 'amber' | 'danger' | 'grey';
  size?: 'sm' | 'md';
  className?: string;
  style?: React.CSSProperties;
}

const BADGE_COLORS = {
  orange: 'bg-orange/10 text-orange border-orange/20',
  violet: 'bg-violet/10 text-violet-light border-violet/20',
  teal:   'bg-teal/10 text-teal border-teal/20',
  mint:   'bg-mint/10 text-mint border-mint/20',
  amber:  'bg-amber/10 text-amber border-amber/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  grey:   'bg-white/5 text-text-secondary border-white/10',
};

export function Badge({ children, color = 'orange', size = 'md', className, style }: BadgeProps) {
  return (
    <span style={style} className={cn(
      'inline-flex items-center gap-1 font-bold border rounded-full font-mono tracking-wider uppercase',
      size === 'sm' ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-2.5 py-1',
      BADGE_COLORS[color], className,
    )}>
      {children}
    </span>
  );
}

// ─── Input ─────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export function Input({ label, hint, error, icon, iconRight, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-bold text-text-secondary tracking-wider uppercase">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary">{icon}</div>}
        <input
          {...props}
          className={cn(
            'w-full bg-card-light border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary',
            'placeholder:text-text-tertiary outline-none transition-all duration-200',
            'focus:border-orange/50 focus:ring-2 focus:ring-orange/10',
            icon && 'pl-10',
            iconRight && 'pr-10',
            error && 'border-danger/50 focus:border-danger focus:ring-danger/10',
            className,
          )}
        />
        {iconRight && <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary">{iconRight}</div>}
      </div>
      {hint && !error && <p className="text-xs text-text-tertiary">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

// ─── Textarea ──────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Textarea({ label, hint, error, className, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-bold text-text-secondary tracking-wider uppercase">{label}</label>}
      <textarea
        {...props}
        className={cn(
          'w-full bg-card-light border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary',
          'placeholder:text-text-tertiary outline-none transition-all duration-200 resize-none',
          'focus:border-orange/50 focus:ring-2 focus:ring-orange/10',
          error && 'border-danger/50',
          className,
        )}
      />
      {hint && !error && <p className="text-xs text-text-tertiary">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

// ─── Spinner ───────────────────────────────────────────────
export function Spinner({ size = 24, color = 'orange' }: { size?: number; color?: string }) {
  return (
    <Loader2
      style={{ width: size, height: size, color: `var(--${color})` }}
      className="animate-spin"
    />
  );
}

export function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-orange typing-dot"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton animate-shimmer', className)} />;
}

// ─── Modal ─────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null;
  const sizeMap = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className={cn(
          'relative w-full rounded-2xl border border-card-border bg-card',
          'shadow-[0_24px_80px_rgba(0,0,0,0.8)] animate-scale-in',
          sizeMap[size],
        )}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-5 border-b border-card-border">
            <h3 className="font-display font-bold text-lg text-text-primary">{title}</h3>
            <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-white/5">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Progress Bar ──────────────────────────────────────────
interface ProgressBarProps {
  value: number;   // 0–100
  color?: string;
  height?: number;
  animated?: boolean;
  className?: string;
}

export function ProgressBar({ value, color = 'var(--orange)', height = 6, animated, className }: ProgressBarProps) {
  return (
    <div className={cn('progress-track', className)} style={{ height }}>
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: color,
          boxShadow: `0 0 8px ${color}60`,
        }}
      />
    </div>
  );
}

// ─── XP Toast ──────────────────────────────────────────────
export function XPToast({ amount }: { amount: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">⚡</span>
      <span className="font-bold text-orange">+{amount} XP</span>
      <span className="text-text-secondary text-sm">earned!</span>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="text-5xl mb-2 animate-float">{icon}</div>
      <h3 className="font-display font-bold text-lg text-text-primary">{title}</h3>
      {description && <p className="text-sm text-text-secondary max-w-xs">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────
interface SectionHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ eyebrow, title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        {eyebrow && (
          <p className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-orange mb-2">{eyebrow}</p>
        )}
        <h2 className="font-display font-bold text-2xl text-text-primary leading-tight">{title}</h2>
        {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Chip selector ─────────────────────────────────────────
interface ChipGroupProps<T extends string> {
  options: { value: T; label: string; icon?: string }[];
  value: T;
  onChange: (v: T) => void;
  color?: string;
}

export function ChipGroup<T extends string>({ options, value, onChange, color = 'var(--orange)' }: ChipGroupProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200',
              active ? 'text-white' : 'text-text-secondary bg-card-light border border-card-border hover:border-white/20',
            )}
            style={active ? { background: color, boxShadow: `0 0 20px ${color}40` } : {}}
          >
            {opt.icon && <span>{opt.icon}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
