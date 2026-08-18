'use client';
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { motion, animate } from 'framer-motion';
import {
  Zap, Flame, Trophy, Target, TrendingUp,
  ArrowRight, Clock, Brain, Star, Heart,
} from 'lucide-react';
import { Card, Badge, ProgressBar, SectionHeader, Skeleton } from '@/components/ui';
import { useUserStore } from '@/lib/stores';
import { xpProgress, formatXP, formatMinutes, cn } from '@/lib/utils';

// ─── Feature Action Cards ──────────────────────────────────
const ACTIONS = [
  { href: '/doubt',      emoji: '🔍', label: 'Solve a Doubt',    desc: 'Socratic AI guidance',    color: '#7C3AED', glow: 'violet' as const },
  { href: '/quiz',       emoji: '✅', label: 'Take a Quiz',       desc: 'AI-generated MCQs',      color: '#FF6B2B', glow: 'orange' as const },
  { href: '/flashcards', emoji: '🃏', label: 'Review Flashcards', desc: 'Spaced repetition',       color: '#00D9C0', glow: 'teal' as const },
  { href: '/planner',    emoji: '📅', label: 'Study Plan',        desc: 'Exam-ready schedule',     color: '#10B981', glow: 'none' as const },
  { href: '/career',     emoji: '🗺️', label: 'Career GPS',        desc: 'Roadmap to your goal',   color: '#F59E0B', glow: 'none' as const },
  { href: '/interview',  emoji: '🎤', label: 'Mock Interview',    desc: 'AI practice rounds',     color: '#EF4444', glow: 'none' as const },
  { href: '/pyq',        emoji: '📝', label: 'PYQ Mode',          desc: 'GATE, CAT, UPSC papers', color: '#9B5FF7', glow: 'none' as const },
  { href: '/analytics',  emoji: '📊', label: 'My Analytics',      desc: 'Performance insights',   color: '#60A5FA', glow: 'none' as const },
];

// ─── Tip of the day ────────────────────────────────────────
const TIPS = [
  'Use the Doubt Solver for hard concepts — it asks guiding questions that lock in understanding 3× faster.',
  'Review flashcards in the morning: your brain consolidates memory best after a night\'s sleep.',
  'Complete PYQ papers in timed mode — exam pressure is a skill you have to practice.',
  'The Career GPS updates with real job market signals. Check it monthly, not just once.',
  'Mock interviews improve most with repetition. Do one a week and track your filler word count.',
  'Short daily sessions (25 min) beat marathon studies for retention. Use the Pomodoro timer.',
];

// ─── Animated count-up (client-only, mounts after the loading gate below) ──
function AnimatedNumber({ value, format }: { value: number; format?: (n: number) => string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.9,
      ease: 'easeOut',
      onUpdate: latest => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [value]);
  return <>{format ? format(display) : display}</>;
}

// ─── Stat Card ─────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, pulse }: {
  icon: typeof Zap; label: ReactNode; value: ReactNode; sub?: string; color: string; pulse?: boolean;
}) {
  return (
    <div className="stat-card flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        {pulse ? (
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </motion.div>
        ) : (
          <Icon className="w-4 h-4" style={{ color }} />
        )}
      </div>
      <div className="font-display font-bold text-xl" style={{ color }}>{value}</div>
      <div className="text-xs text-text-secondary font-medium">{label}</div>
      {sub && <div className="text-[10px] text-text-tertiary">{sub}</div>}
    </div>
  );
}

// ─── Wellness Card (rule-based, no AI call) ────────────────
function BreathingExercise({ onDone }: { onDone: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { if (elapsed >= 19) onDone(); }, [elapsed, onDone]);

  const phase = elapsed < 4 ? 'inhale' : elapsed < 11 ? 'hold' : 'exhale';
  return (
    <div className="flex flex-col items-center py-4 gap-3">
      <div className={cn(
        'w-20 h-20 rounded-full bg-gradient-to-br from-teal to-violet transition-transform ease-linear',
        phase === 'exhale' ? 'scale-75 duration-[8000ms]' : 'scale-125 duration-[4000ms]',
      )} />
      <p className="text-xs font-mono uppercase tracking-widest text-text-tertiary">{phase} · {19 - elapsed}s</p>
    </div>
  );
}

function WellnessCard({ studyMinutesToday }: { studyMinutesToday: number }) {
  const [breathing, setBreathing] = useState(false);
  const risk = studyMinutesToday > 150 ? 'high' : studyMinutesToday > 75 ? 'moderate' : 'good';
  const copy = {
    good: { label: 'Balanced', color: '#10B981', msg: "You're pacing well today." },
    moderate: { label: 'Keep an eye on it', color: '#F59E0B', msg: 'Consider a short break soon.' },
    high: { label: 'Take a break', color: '#EF4444', msg: "That's a lot of study today — a short break helps you retain more." },
  }[risk];

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4" style={{ color: copy.color }} />
          <span className="font-display font-bold text-sm text-text-primary">Mental Wellness</span>
        </div>
        <Badge color="grey" style={{ color: copy.color }}>{copy.label}</Badge>
      </div>
      <p className="text-xs text-text-secondary">{copy.msg}</p>
      {!breathing ? (
        <button onClick={() => setBreathing(true)}
          className="text-xs font-semibold text-teal self-start hover:underline">
          Try guided breathing (60s) →
        </button>
      ) : (
        <BreathingExercise onDone={() => setBreathing(false)} />
      )}
      <p className="text-[10px] text-text-tertiary border-t border-card-border pt-2.5">
        Feeling overwhelmed? <span className="font-semibold text-text-secondary">iCall</span> offers free, confidential support — <span className="font-mono">9152987821</span>
      </p>
    </Card>
  );
}

// ─── Main Dashboard ────────────────────────────────────────
export default function HomePage() {
  const { user, progress, fetchProgress } = useUserStore();
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchProgress().finally(() => setLoaded(true));
  }, [fetchProgress]);

  const prog = progress ? xpProgress(progress.xp) : null;

  if (!loaded || !user) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 w-full" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Hero Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, #0E1230 0%, #1A0E30 60%, #0A1820 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 0 60px rgba(255,107,43,0.08), 0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        {/* BG glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #FF6B2B, transparent)', filter: 'blur(60px)', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #7C3AED, transparent)', filter: 'blur(40px)', transform: 'translate(-20%, 30%)' }} />
        </div>

        <div className="relative z-10">
          <p className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-orange mb-3">
            Welcome back
          </p>
          <h2 className="font-display font-bold text-3xl text-text-primary leading-tight mb-1">
            {user.name}
          </h2>
          <p className="text-text-secondary text-sm mb-5">{user.major} · {user.goal.join(', ')}</p>

          {prog && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-tertiary font-mono">Level {prog.level}</span>
                <span className="font-bold text-orange"><AnimatedNumber value={progress!.xp} format={formatXP} /> XP</span>
              </div>
              <ProgressBar value={prog.pct} height={7}
                color="linear-gradient(90deg, #FF6B2B, #FF8A50)" />
              <div className="flex justify-between text-[10px] text-text-tertiary">
                <span>{prog.current} / {prog.needed} XP to Level {prog.level + 1}</span>
                <span>{prog.pct}%</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Stats Row ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-4 gap-2.5"
      >
        <StatCard icon={Zap}       label="Total XP"    value={<AnimatedNumber value={progress?.xp ?? 0} format={formatXP} />}   color="#FF6B2B" />
        <StatCard icon={Flame}     label="Streak"      value={<AnimatedNumber value={progress?.streak ?? 0} format={n => `${n}d`} />}    color="#F59E0B" pulse={(progress?.streak ?? 0) > 0} />
        <StatCard icon={Trophy}    label="Quizzes"     value={<AnimatedNumber value={progress?.total_quizzes ?? 0} />} color="#7C3AED" sub="completed" />
        <StatCard icon={Brain}     label="Doubts"      value={<AnimatedNumber value={progress?.total_doubts ?? 0} />} color="#00D9C0" sub="solved" />
      </motion.div>

      {/* ── Today's Study ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Card className="flex items-center gap-4 !p-4">
          <div className="w-12 h-12 rounded-xl bg-violet/10 border border-violet/20 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-violet-light" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-tertiary font-mono uppercase tracking-wider mb-0.5">Today's Study</p>
            <p className="font-display font-bold text-xl text-text-primary">
              {formatMinutes(progress?.study_minutes_today ?? 0)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-tertiary mb-0.5">Weekly</p>
            <p className="font-bold text-sm text-text-primary">{formatMinutes(progress?.study_minutes_week ?? 0)}</p>
          </div>
        </Card>
      </motion.div>

      {/* ── Quick Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <SectionHeader
          eyebrow="Quick Actions"
          title={<>What do you want to <span className="text-gradient-orange">do today?</span></>}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {ACTIONS.map((action, i) => (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 + i * 0.04 }}
              whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.96, transition: { duration: 0.1 } }}
            >
              <Link href={action.href}>
                <div className={cn(
                  'feature-card group h-full flex flex-col gap-3',
                  'hover:shadow-lg',
                )}>
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{action.emoji}</span>
                    <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-text-secondary transition-colors" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm text-text-primary group-hover:text-white transition-colors">
                      {action.label}
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">{action.desc}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Wellness ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <WellnessCard studyMinutesToday={progress?.study_minutes_today ?? 0} />
      </motion.div>

      {/* ── Tip of the Day ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.55 }}
      >
        <Card glow="teal" className="flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center flex-shrink-0">
            <Star className="w-5 h-5 text-teal" />
          </div>
          <div>
            <p className="text-xs font-mono font-bold tracking-widest uppercase text-teal mb-1">Tip of the Day</p>
            <p className="text-sm text-text-secondary leading-relaxed">{tip}</p>
          </div>
        </Card>
      </motion.div>

      {/* ── Performance snapshot ── */}
      {(progress?.quiz_accuracy ?? 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange" />
                <span className="font-display font-bold text-base text-text-primary">Performance</span>
              </div>
              <Link href="/analytics">
                <Badge color="orange">View All</Badge>
              </Link>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-text-secondary">Quiz Accuracy</span>
                  <span className="font-bold text-orange">{progress!.quiz_accuracy}%</span>
                </div>
                <ProgressBar value={progress!.quiz_accuracy} height={5} />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-text-secondary">Flashcards Reviewed</span>
                  <span className="font-bold text-teal">{progress!.total_flashcards_reviewed}</span>
                </div>
                <ProgressBar value={Math.min(100, progress!.total_flashcards_reviewed / 5)}
                  height={5} color="var(--teal)" />
              </div>
            </div>
          </Card>
        </motion.div>
      )}

    </div>
  );
}
