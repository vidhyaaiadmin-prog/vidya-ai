// src/app/(dashboard)/profile/page.tsx
'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Zap, Flame, Trophy, BookOpen, Brain, LogOut, Settings, ChevronRight, Check } from 'lucide-react';
import { Button, Card, Badge, SectionHeader, ProgressBar, Modal } from '@/components/ui';
import { useUserStore } from '@/lib/stores';
import { xpProgress, formatXP, LANG_NAMES, cn } from '@/lib/utils';
import { performLogout } from '@/lib/logout';
import { createClient } from '@/lib/supabase';
import type { Language } from '@/types';
import toast from 'react-hot-toast';

const ACHIEVEMENTS = [
  { key: 'first_doubt',  icon: '🔍', label: 'First Doubt Solved',  desc: 'Solved your first doubt',       xp: 5  },
  { key: 'quiz_10',      icon: '✅', label: 'Quiz Master',          desc: 'Completed 10 quizzes',           xp: 50 },
  { key: 'streak_7',     icon: '🔥', label: '7-Day Streak',         desc: 'Studied 7 days in a row',       xp: 20 },
  { key: 'streak_30',    icon: '⚡', label: '30-Day Legend',         desc: 'Studied 30 days in a row',      xp: 100 },
  { key: 'level_5',      icon: '⭐', label: 'Level 5 Scholar',       desc: 'Reached Level 5',               xp: 0  },
  { key: 'career',       icon: '🗺️', label: 'Career Mapped',         desc: 'Generated first career roadmap', xp: 20 },
  { key: 'interview',    icon: '🎤', label: 'Interview Ready',       desc: 'Completed a mock interview',    xp: 25 },
  { key: 'cards_50',     icon: '🃏', label: 'Flashcard Champion',    desc: 'Reviewed 50 flashcards',        xp: 30 },
  { key: 'xp_500',       icon: '🏆', label: '500 XP Club',           desc: 'Earned 500 total XP',           xp: 0  },
  { key: 'planner',      icon: '📅', label: 'Planner Pro',           desc: 'Created a study plan',          xp: 15 },
];

export default function ProfilePage() {
  const { user, progress, setUser } = useUserStore();
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [langPickerOpen, setLangPickerOpen] = useState(false);

  const prog = progress ? xpProgress(progress.xp) : null;

  const changeLanguage = async (code: Language) => {
    if (!user) return;
    setUser({ ...user, language: code });
    setLangPickerOpen(false);
    const db = createClient();
    if (db) await db.from('users').update({ language: code }).eq('id', user.id);
    toast.success(`Language set to ${LANG_NAMES[code]}`);
  };

  // Simulate which achievements are earned based on progress
  const earned = new Set<string>();
  if ((progress?.total_doubts ?? 0) >= 1) earned.add('first_doubt');
  if ((progress?.total_quizzes ?? 0) >= 10) earned.add('quiz_10');
  if ((progress?.streak ?? 0) >= 7) earned.add('streak_7');
  if ((progress?.streak ?? 0) >= 30) earned.add('streak_30');
  if ((prog?.level ?? 0) >= 5) earned.add('level_5');
  if ((progress?.xp ?? 0) >= 500) earned.add('xp_500');
  if ((progress?.total_flashcards_reviewed ?? 0) >= 50) earned.add('cards_50');

  const logout = () => { performLogout(); };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <SectionHeader eyebrow="Your Profile" title="Learning stats & progress" />

      {/* Profile card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card glow="orange" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange to-violet flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 shadow-orange-glow">
              {user.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display font-bold text-xl text-text-primary">{user.name}</h2>
                  <p className="text-sm text-text-secondary mt-0.5">{user.major}</p>
                </div>
                {user.institution_name && (
                  <Badge color="grey" className="flex-shrink-0">{user.institution_name}</Badge>
                )}
              </div>
              <p className="text-xs text-text-tertiary mt-2">{user.goal.join(', ')}</p>
              {prog && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-tertiary">Level {prog.level}</span>
                    <span className="text-orange font-bold">{formatXP(progress!.xp)} XP total</span>
                  </div>
                  <ProgressBar value={prog.pct} height={6} />
                  <p className="text-[10px] text-text-tertiary">{prog.current}/{prog.needed} XP to Level {prog.level + 1}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Zap,      label: 'Total XP',    value: formatXP(progress?.xp ?? 0),                   color: '#FF6B2B' },
          { icon: Flame,    label: 'Streak',       value: `${progress?.streak ?? 0}d`,                   color: '#F59E0B' },
          { icon: Trophy,   label: 'Quizzes',      value: `${progress?.total_quizzes ?? 0}`,             color: '#7C3AED' },
          { icon: Brain,    label: 'Doubts',        value: `${progress?.total_doubts ?? 0}`,              color: '#00D9C0' },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="text-center !py-4">
            <Icon className="w-5 h-5 mx-auto mb-2" style={{ color }} />
            <div className="font-display font-bold text-xl" style={{ color }}>{value}</div>
            <div className="text-xs text-text-secondary mt-0.5">{label}</div>
          </Card>
        ))}
      </div>

      {/* Achievements */}
      <div>
        <p className="text-xs font-mono font-bold tracking-widest uppercase text-text-tertiary mb-3">
          Achievements ({earned.size}/{ACHIEVEMENTS.length})
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {ACHIEVEMENTS.map(a => (
            <div key={a.key}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border transition-all',
                earned.has(a.key)
                  ? 'bg-orange/5 border-orange/20'
                  : 'bg-card-light border-card-border opacity-40',
              )}>
              <span className="text-2xl flex-shrink-0">{a.icon}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-text-primary leading-snug truncate">{a.label}</p>
                <p className="text-[10px] text-text-tertiary truncate">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <Card>
        <p className="text-xs font-mono font-bold tracking-widest uppercase text-text-tertiary mb-3">
          Account
        </p>
        <div className="space-y-0.5">
          {[
            { icon: '🌐', label: 'Language', value: LANG_NAMES[user.language || 'en'], onClick: () => setLangPickerOpen(true) },
            { icon: '🎓', label: 'Major', value: user.major },
            { icon: '🎯', label: 'Goal', value: user.goal.join(', ') },
          ].map(item => (
            <div key={item.label}
              onClick={item.onClick}
              className={cn(
                'flex items-center justify-between py-3 border-b border-card-border last:border-0',
                item.onClick && 'cursor-pointer',
              )}>
              <div className="flex items-center gap-3">
                <span className="text-base">{item.icon}</span>
                <span className="text-sm text-text-secondary">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-primary font-medium">{item.value}</span>
                <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Language picker */}
      <Modal open={langPickerOpen} onClose={() => setLangPickerOpen(false)} title="Choose your language" size="sm">
        <div className="space-y-1.5">
          {(Object.entries(LANG_NAMES) as [Language, string][]).map(([code, label]) => (
            <button key={code} onClick={() => changeLanguage(code)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all',
                user.language === code
                  ? 'bg-orange/10 border-orange/40 text-text-primary'
                  : 'bg-card-light border-card-border text-text-secondary hover:border-white/20',
              )}>
              <span className="text-sm font-medium">{label}</span>
              {user.language === code && <Check className="w-4 h-4 text-orange" />}
            </button>
          ))}
        </div>
      </Modal>

      {/* Logout */}
      {!logoutConfirm ? (
        <Button variant="ghost" full onClick={() => setLogoutConfirm(true)} icon={<LogOut className="w-4 h-4" />}>
          Sign Out
        </Button>
      ) : (
        <Card className="!p-4">
          <p className="text-sm text-text-primary font-medium mb-3 text-center">Are you sure you want to sign out?</p>
          <div className="flex gap-3">
            <Button variant="secondary" full onClick={() => setLogoutConfirm(false)}>Cancel</Button>
            <Button variant="danger" full onClick={logout} icon={<LogOut className="w-4 h-4" />}>Sign Out</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
