import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Flashcard, SRSGrade } from '@/types';

// ─── className helper ──────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── XP & Level system ────────────────────────────────────
export function xpToLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}
export function levelToXP(level: number): number {
  return (level - 1) ** 2 * 50;
}
export function xpProgress(xp: number): { level: number; current: number; needed: number; pct: number } {
  const level = xpToLevel(xp);
  const currentLevelXP = levelToXP(level);
  const nextLevelXP = levelToXP(level + 1);
  const current = xp - currentLevelXP;
  const needed = nextLevelXP - currentLevelXP;
  return { level, current, needed, pct: Math.round((current / needed) * 100) };
}

export const XP_REWARDS = {
  doubt_started:   5,
  doubt_reply:     3,
  quiz_correct:    10,
  quiz_wrong:      2,
  quiz_completed:  15,
  flashcard_known: 5,
  flashcard_added: 3,
  planner_created: 15,
  career_mapped:   20,
  interview_reply: 8,
  interview_done:  25,
  pyq_correct:     12,
  streak_bonus:    20,
  first_login:     50,
  cert_saved:      5,
  cert_completed:  20,
} as const;

export type XPEvent = keyof typeof XP_REWARDS;

// ─── SM-2 Spaced Repetition Algorithm ─────────────────────
export function sm2(card: Flashcard, grade: SRSGrade): Partial<Flashcard> {
  let { ease_factor, interval, repetitions } = card;

  if (grade < 3) {
    // Failed — reset
    repetitions = 0;
    interval = 1;
  } else {
    // Passed
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * ease_factor);

    ease_factor = Math.max(1.3, ease_factor + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    repetitions += 1;
  }

  const next_review = new Date();
  next_review.setDate(next_review.getDate() + interval);

  return {
    ease_factor,
    interval,
    repetitions,
    next_review: next_review.toISOString(),
    last_reviewed: new Date().toISOString(),
  };
}

// ─── Date & Time helpers ──────────────────────────────────
export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1)  return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)   return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7)     return `${days}d ago`;
  return formatDate(dateStr);
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Number formatters ─────────────────────────────────────
export function formatXP(xp: number): string {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
  return xp.toString();
}

export function formatCost(inr: number): string {
  if (inr < 0.01) return '< ₹0.01';
  return `₹${inr.toFixed(4)}`;
}

// ─── Random helpers ────────────────────────────────────────
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function randomId(): string {
  return Math.random().toString(36).slice(2, 11);
}

// ─── Subject color map ─────────────────────────────────────
export const SUBJECT_COLORS: Record<string, string> = {
  'Data Structures':       '#7C3AED',
  'Algorithms':            '#7C3AED',
  'DBMS':                  '#00D9C0',
  'Operating Systems':     '#10B981',
  'Computer Networks':     '#00D9C0',
  'Mathematics':           '#F59E0B',
  'Physics':               '#60A5FA',
  'Chemistry':             '#34D399',
  'Marketing':             '#FF6B2B',
  'Finance':               '#10B981',
  'Accounting':            '#34D399',
  'Economics':             '#F59E0B',
  'Management':            '#FF6B2B',
  'default':               '#7C3AED',
};

export function subjectColor(subject: string): string {
  for (const [key, color] of Object.entries(SUBJECT_COLORS)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return SUBJECT_COLORS.default;
}

// ─── Confetti trigger ─────────────────────────────────────
export async function celebrate() {
  const confetti = (await import('canvas-confetti')).default;
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    colors: ['#FF6B2B', '#7C3AED', '#00D9C0', '#F59E0B', '#ffffff'],
  });
}

// ─── Clip / truncate ──────────────────────────────────────
export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '...' : str;
}

// ─── Indian language names ─────────────────────────────────
export const LANG_NAMES: Record<string, string> = {
  en: 'English', hi: 'हिन्दी', ta: 'தமிழ்', te: 'తెలుగు',
  bn: 'বাংলা', mr: 'मराठी', gu: 'ગુજરાતી', kn: 'ಕನ್ನಡ', ml: 'മലയാളം',
};

// ─── AI response language instruction ──────────────────────
// Appended to system prompts so AI features honor the student's onboarding
// language choice instead of always replying in English.
export function languageInstruction(code?: string): string {
  if (!code || code === 'en') return '';
  const name = LANG_NAMES[code] || code;
  return ` Respond primarily in ${name}, code-mixing in English for technical terms exactly as a bilingual Indian student would speak — not a stiff full translation.`;
}

