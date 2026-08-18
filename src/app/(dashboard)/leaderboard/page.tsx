'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown } from 'lucide-react';
import { Card, Badge, SectionHeader, EmptyState, Skeleton } from '@/components/ui';
import { useUserStore } from '@/lib/stores';
import { authFetch } from '@/lib/api-client';
import { formatXP, cn } from '@/lib/utils';

interface Entry { rank: number; userId: string; name: string; xp: number; }

const PERIODS = [
  { value: 'week' as const, label: 'This Week' },
  { value: 'all' as const, label: 'All Time' },
];

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const { user } = useUserStore();
  const [period, setPeriod] = useState<'week' | 'all'>('week');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selfRank, setSelfRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: 'week' | 'all') => {
    setLoading(true);
    try {
      const res = await authFetch('/api/leaderboard', { period: p });
      const data = await res.json();
      setEntries(data.entries ?? []);
      setSelfRank(data.selfRank ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(period); }, [period, load]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <SectionHeader
        eyebrow="Your Campus"
        title={<>Who's leading <span className="text-gradient-orange">this week?</span></>}
        subtitle="Ranked against students at your own institution only."
        action={
          <div className="flex items-center gap-1 p-1 rounded-xl bg-card-light border border-card-border">
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-lg font-medium transition-all',
                  period === p.value ? 'bg-orange text-white' : 'text-text-secondary hover:text-text-primary',
                )}>
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {loading && (
        <div className="space-y-2.5">
          {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        </div>
      )}

      {!loading && entries.length === 0 && (
        <EmptyState icon="🏆" title="No activity yet"
          description="Earn XP from quizzes, doubts, and flashcards to appear on the leaderboard." />
      )}

      {!loading && entries.length > 0 && (
        <>
          {selfRank && selfRank > 10 && (
            <Card glow="orange" className="!py-3 !px-4 flex items-center justify-between">
              <span className="text-sm text-text-secondary">Your rank</span>
              <Badge color="orange">#{selfRank}</Badge>
            </Card>
          )}
          <div className="space-y-2">
            {entries.map((e, i) => {
              const isSelf = e.userId === user?.id;
              return (
                <motion.div key={e.userId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i, 10) * 0.02 }}>
                  <Card className={cn('!py-3 !px-4 flex items-center gap-3', isSelf && 'border-orange/40 bg-orange/5')}>
                    <div className="w-8 text-center flex-shrink-0">
                      {i < 3 ? <span className="text-lg">{MEDALS[i]}</span> : (
                        <span className="text-sm font-mono text-text-tertiary">{e.rank}</span>
                      )}
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange to-violet flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {e.name[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-semibold truncate', isSelf ? 'text-orange' : 'text-text-primary')}>
                        {e.name}{isSelf && ' (You)'}
                      </p>
                    </div>
                    {i === 0 && <Crown className="w-4 h-4 text-amber flex-shrink-0" />}
                    <div className="flex items-center gap-1 text-orange font-bold text-sm flex-shrink-0">
                      <Trophy className="w-3.5 h-3.5" />
                      {formatXP(e.xp)}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
