import { NextRequest } from 'next/server';
import { guard, json, safeError } from '@/lib/security';
import { createAdminClient } from '@/lib/supabase';

// Institution-scoped leaderboard — students only ever rank against their own
// college's cohort, never across institutions (a 30-student college and a
// 5,000-student university aren't a fair comparison, and B2B customers won't
// want their students compared against a rival institution's either).
export async function POST(req: NextRequest) {
  const g = await guard(req, {
    bucket: 'default',
    requireUser: true,
    schema: { period: { type: 'string', enum: ['all', 'week'] as const } },
  });
  if (!g.ok) return g.response;

  try {
    const { period = 'all' } = g.data as { period?: 'all' | 'week' };
    const db = createAdminClient();
    if (!db || g.userId === 'local-dev') return json({ entries: [], selfRank: null });

    const { data: self } = await db.from('users').select('institution_id').eq('id', g.userId).single();
    if (!self) return json({ entries: [], selfRank: null });

    const { data: peers } = await db
      .from('users')
      .select('id, name')
      .eq('institution_id', self.institution_id);
    if (!peers?.length) return json({ entries: [], selfRank: null });

    const peerIds = peers.map((p) => p.id);
    const nameById = new Map(peers.map((p) => [p.id, p.name]));

    let ranked: { user_id: string; xp: number }[];

    if (period === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data: events } = await db
        .from('xp_events')
        .select('user_id, amount')
        .in('user_id', peerIds)
        .gte('created_at', weekAgo);
      const totals = new Map<string, number>();
      for (const e of events ?? []) totals.set(e.user_id, (totals.get(e.user_id) ?? 0) + e.amount);
      ranked = [...totals.entries()].map(([user_id, xp]) => ({ user_id, xp }));
    } else {
      const { data: progress } = await db
        .from('user_progress')
        .select('user_id, xp')
        .in('user_id', peerIds);
      ranked = progress ?? [];
    }

    ranked.sort((a, b) => b.xp - a.xp);
    const top = ranked.slice(0, 50).map((r, i) => ({
      rank: i + 1, userId: r.user_id, name: nameById.get(r.user_id) ?? 'Student', xp: r.xp,
    }));
    const selfRank = ranked.findIndex((r) => r.user_id === g.userId) + 1 || null;

    return json({ entries: top, selfRank });
  } catch (err) {
    return safeError(err);
  }
}
