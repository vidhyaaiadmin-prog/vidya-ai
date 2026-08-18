'use client';
import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Brain, Clock, Target, Zap } from 'lucide-react';
import { Card, Badge, SectionHeader, ProgressBar } from '@/components/ui';
import { useUserStore } from '@/lib/stores';
import { cn } from '@/lib/utils';

// ── Mock data (replace with real DB queries) ───────────────
const XP_HISTORY = [
  { day: 'Mon', xp: 35 }, { day: 'Tue', xp: 62 }, { day: 'Wed', xp: 28 },
  { day: 'Thu', xp: 85 }, { day: 'Fri', xp: 50 }, { day: 'Sat', xp: 110 },
  { day: 'Sun', xp: 73 },
];

const SUBJECT_DATA = [
  { subject: 'Data Structures', score: 78, attempts: 12, color: '#7C3AED' },
  { subject: 'DBMS',            score: 65, attempts: 8,  color: '#00D9C0' },
  { subject: 'OS',              score: 82, attempts: 6,  color: '#10B981' },
  { subject: 'Networks',        score: 55, attempts: 5,  color: '#F59E0B' },
  { subject: 'Mathematics',     score: 90, attempts: 15, color: '#FF6B2B' },
];

const ACTIVITY_PIE = [
  { name: 'Quizzes',     value: 40, color: '#FF6B2B' },
  { name: 'Flashcards',  value: 25, color: '#7C3AED' },
  { name: 'Doubts',      value: 20, color: '#00D9C0' },
  { name: 'Planner',     value: 15, color: '#10B981' },
];

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#0F1228',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
  },
};

const PERIODS = ['This Week', 'This Month', 'All Time'];

function MetricCard({ icon: Icon, label, value, sub, color, trend }: {
  icon: typeof Zap; label: string; value: string; sub?: string; color: string; trend?: string;
}) {
  return (
    <Card className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-tertiary font-mono uppercase tracking-wider">{label}</p>
        <p className="font-display font-bold text-2xl mt-0.5" style={{ color }}>{value}</p>
        {sub && <p className="text-xs text-text-tertiary mt-0.5">{sub}</p>}
      </div>
      {trend && (
        <Badge color={trend.startsWith('+') ? 'mint' : 'danger'} className="flex-shrink-0">
          {trend}
        </Badge>
      )}
    </Card>
  );
}

export default function AnalyticsPage() {
  const { user, progress } = useUserStore();
  const [period, setPeriod] = useState('This Week');

  const totalXP = XP_HISTORY.reduce((s, d) => s + d.xp, 0);
  const avgScore = Math.round(SUBJECT_DATA.reduce((s, d) => s + d.score, 0) / SUBJECT_DATA.length);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <SectionHeader
        eyebrow="Performance Analytics"
        title={<>Your learning <span className="text-gradient-orange">at a glance</span></>}
        action={
          <div className="flex items-center gap-1 p-1 rounded-xl bg-card-light border border-card-border">
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-lg font-medium transition-all',
                  period === p ? 'bg-orange text-white' : 'text-text-secondary hover:text-text-primary',
                )}>
                {p}
              </button>
            ))}
          </div>
        }
      />

      {/* Demo data banner */}
      <div className="rounded-xl border border-amber/30 bg-amber/5 px-4 py-3 flex items-center gap-3">
        <span className="text-lg">🧪</span>
        <p className="text-xs text-amber leading-relaxed">
          <strong>Demo Mode</strong> — Charts below show sample data. Real analytics based on your activity are coming soon.
        </p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={Zap}       label="XP This Week"    value={`${totalXP}`}         color="#FF6B2B" trend="+23%" />
        <MetricCard icon={Target}    label="Quiz Accuracy"   value={`${avgScore}%`}        color="#7C3AED" trend="+5%" />
        <MetricCard icon={Brain}     label="Doubts Solved"   value={`${progress?.total_doubts ?? 0}`}   color="#00D9C0" />
        <MetricCard icon={Clock}     label="Study Time"      value={`${progress?.study_minutes_week ?? 0}m`} color="#10B981" sub="this week" />
      </div>

      {/* XP trend chart */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-mono text-text-tertiary uppercase tracking-widest mb-0.5">XP Earned</p>
            <h3 className="font-display font-bold text-base text-text-primary">Daily Progress</h3>
          </div>
          <div className="font-display font-bold text-2xl text-orange">{totalXP} XP</div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={XP_HISTORY} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#FF6B2B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FF6B2B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Area type="monotone" dataKey="xp" stroke="#FF6B2B" strokeWidth={2} fill="url(#xpGrad)" dot={{ fill: '#FF6B2B', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#FF6B2B' }} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Subject performance */}
        <Card>
          <p className="text-xs font-mono text-text-tertiary uppercase tracking-widest mb-1">Subject Performance</p>
          <h3 className="font-display font-bold text-base text-text-primary mb-4">Quiz Scores by Subject</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={SUBJECT_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, 'Score']} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {SUBJECT_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Activity breakdown */}
        <Card>
          <p className="text-xs font-mono text-text-tertiary uppercase tracking-widest mb-1">Activity Split</p>
          <h3 className="font-display font-bold text-base text-text-primary mb-4">Time Distribution</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={ACTIVITY_PIE} cx="50%" cy="50%" innerRadius={35} outerRadius={55}
                  dataKey="value" paddingAngle={3}>
                  {ACTIVITY_PIE.map((entry, i) => (
                    <Cell key={i} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2.5 flex-1">
              {ACTIVITY_PIE.map(item => (
                <div key={item.name} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-xs text-text-secondary flex-1">{item.name}</span>
                  <span className="text-xs font-bold" style={{ color: item.color }}>{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Subject detail */}
      <Card>
        <p className="text-xs font-mono text-text-tertiary uppercase tracking-widest mb-1">Subject Breakdown</p>
        <h3 className="font-display font-bold text-base text-text-primary mb-4">Detailed Performance</h3>
        <div className="space-y-4">
          {SUBJECT_DATA.map(subject => (
            <div key={subject.subject}>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="font-medium text-text-primary">{subject.subject}</span>
                <div className="flex items-center gap-3">
                  <span className="text-text-tertiary">{subject.attempts} quizzes</span>
                  <span className="font-bold" style={{ color: subject.color }}>{subject.score}%</span>
                </div>
              </div>
              <ProgressBar value={subject.score} height={5} color={subject.color} />
              {subject.score < 70 && (
                <p className="text-[10px] text-amber mt-1">⚠️ Below target — focus area for next week</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Streak calendar */}
      <Card>
        <p className="text-xs font-mono text-text-tertiary uppercase tracking-widest mb-1">Study Streak</p>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-base text-text-primary">Last 28 Days</h3>
          <Badge color="amber">🔥 {progress?.streak ?? 0} day streak</Badge>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 28 }, (_, i) => {
            // Deterministic pseudo-random (seeded by index) — plain Math.random()
            // here produced a different pattern on the server render vs. the
            // client hydration render, causing a hydration-mismatch warning
            // on every load.
            const seeded = (n: number) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
            const intensity = seeded(i);
            const active = seeded(i + 100) > 0.3;
            return (
              <div key={i} title={`Day ${i + 1}`}
                className="aspect-square rounded-sm transition-all"
                style={{
                  background: active
                    ? `rgba(255,107,43,${0.2 + intensity * 0.8})`
                    : 'rgba(255,255,255,0.04)',
                  border: active ? '1px solid rgba(255,107,43,0.2)' : '1px solid rgba(255,255,255,0.04)',
                }}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-text-tertiary">
          <div className="w-2.5 h-2.5 rounded-sm bg-white/5" />
          <span>No study</span>
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(255,107,43,0.3)' }} />
          <span>Light</span>
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(255,107,43,0.9)' }} />
          <span>Intense</span>
        </div>
      </Card>
    </div>
  );
}
