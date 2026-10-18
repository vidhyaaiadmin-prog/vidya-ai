'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Search, CheckSquare, BookOpen, Calendar, Map,
  Mic, BarChart2, User, Menu, X, BookMarked, Zap, Bell, ChevronRight, Trophy,
  ShieldCheck, Compass, Award, LogOut,
} from 'lucide-react';
import { cn, xpProgress, formatXP } from '@/lib/utils';
import { useUserStore, useUIStore } from '@/lib/stores';
import { performLogout } from '@/lib/logout';
import { useTranslation } from '@/lib/i18n';
import { ProgressBar } from '@/components/ui';

// ─── Navigation items ──────────────────────────────────────
const NAV_ITEMS = [
  { href: '/home',      icon: Home,        key: 'nav_home',       emoji: '🏠' },
  { href: '/doubt',     icon: Search,      key: 'nav_doubt',      emoji: '🔍' },
  { href: '/quiz',      icon: CheckSquare, key: 'nav_quiz',       emoji: '✅' },
  { href: '/flashcards',icon: BookOpen,    key: 'nav_flashcards', emoji: '🃏' },
  { href: '/planner',   icon: Calendar,    key: 'nav_planner',    emoji: '📅' },
  { href: '/career',    icon: Map,         key: 'nav_career',     emoji: '🗺️' },
  { href: '/certifications', icon: Award,  key: 'nav_certifications', emoji: '🎓' },
  { href: '/interview', icon: Mic,         key: 'nav_interview',  emoji: '🎤' },
  { href: '/pyq',       icon: BookMarked,  key: 'nav_pyq',        emoji: '📝' },
  { href: '/leaderboard', icon: Trophy,    key: 'nav_leaderboard', emoji: '🏆' },
  { href: '/resources', icon: Compass,     key: 'nav_resources',  emoji: '🧭' },
  { href: '/plagiarism', icon: ShieldCheck, key: 'nav_plagiarism', emoji: '🔒' },
  { href: '/analytics', icon: BarChart2,   key: 'nav_analytics',  emoji: '📊' },
  { href: '/profile',   icon: User,        key: 'nav_profile',    emoji: '👤' },
];

// Bottom nav shows only 5 items
const BOTTOM_NAV = NAV_ITEMS.slice(0, 5);

// ─── Sidebar ───────────────────────────────────────────────
function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user, progress } = useUserStore();
  const t = useTranslation();
  const prog = progress ? xpProgress(progress.xp) : null;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside className={cn(
        'fixed top-0 left-0 z-50 h-full flex flex-col',
        'bg-navy-2 border-r border-card-border',
        'transition-transform duration-300 ease-in-out',
        'w-64',
        // Mobile: slide in/out
        'lg:translate-x-0 lg:static lg:flex',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-card-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange to-violet flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-text-primary">
              Vidya<span className="text-orange">AI</span>
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden text-text-tertiary hover:text-text-primary p-1 rounded-lg hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        {user && (
          <div className="mx-3 mt-3 p-3 rounded-xl bg-gradient-to-br from-orange/10 to-violet/5 border border-orange/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange to-violet flex items-center justify-center text-sm font-bold text-white">
                {user.name[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{user.name}</p>
                <p className="text-[10px] text-text-tertiary truncate">{user.major}</p>
              </div>
            </div>
            {prog && (
              <>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-text-tertiary font-mono">Lv.{prog.level}</span>
                  <span className="text-[10px] text-orange font-bold">{formatXP(progress!.xp)} XP</span>
                </div>
                <ProgressBar value={prog.pct} height={4} />
              </>
            )}
          </div>
        )}

        {/* Streak pill */}
        {progress && (
          <div className="mx-3 mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber/10 border border-amber/20">
            <span className="text-amber text-base">🔥</span>
            <span className="text-xs font-bold text-amber">{progress.streak} day streak</span>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ href, icon: Icon, key, emoji }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href} onClick={onClose}>
                <div className={cn(
                  'nav-item text-sm',
                  active && 'active',
                )}>
                  <span className="text-base">{emoji}</span>
                  <span>{t(key)}</span>
                  {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-card-border space-y-1">
          <button
            onClick={() => { performLogout(); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-tertiary hover:text-danger hover:bg-danger/5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-tertiary">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
            <span>{t('ai_status')}</span>
          </div>
        </div>
      </aside>
    </>
  );
}

// ─── Header ────────────────────────────────────────────────
function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const { progress } = useUserStore();
  const t = useTranslation();

  const current = NAV_ITEMS.find(n => pathname.startsWith(n.href));
  const title = current ? t(current.key) : 'Vidya AI';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-navy/90 backdrop-blur-md border-b border-card-border">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-base text-text-primary lg:hidden">
          {current?.emoji} {title}
        </h1>
        <h1 className="font-display font-bold text-xl text-text-primary hidden lg:block">
          {current?.emoji} {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* XP pill */}
        {progress && (
          <div className="xp-badge">
            <Zap className="w-3 h-3" />
            {formatXP(progress.xp)} XP
          </div>
        )}
        {/* Streak */}
        {progress && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber/10 border border-amber/20 text-xs font-bold text-amber">
            🔥 {progress.streak}
          </div>
        )}
        {/* Notifications */}
        <button className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange" />
        </button>
      </div>
    </header>
  );
}

// ─── Bottom Navigation (mobile) ────────────────────────────
function BottomNav() {
  const pathname = usePathname();
  const t = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-navy-2/95 backdrop-blur-md border-t border-card-border pb-safe">
      <div className="flex">
        {BOTTOM_NAV.map(({ href, key, emoji }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} className="flex-1">
              <div className={cn('tab-btn', active && 'active')}>
                <span className="text-xl leading-none">{emoji}</span>
                <span className="text-[9px] font-bold tracking-wider uppercase leading-none">{t(key)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ─── App Shell ─────────────────────────────────────────────
export default function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <div className="flex h-screen bg-navy overflow-hidden">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-6 pb-24 lg:pb-6 page-enter">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Nav (mobile) */}
      <BottomNav />
    </div>
  );
}
