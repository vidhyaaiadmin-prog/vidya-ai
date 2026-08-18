import { NextRequest } from 'next/server';
import { guard, json, safeError, requireInstitutionAdmin } from '@/lib/security';
import { createAdminClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const g = await guard(req, { bucket: 'default', requireUser: true });
  if (!g.ok) return g.response;

  const admin = await requireInstitutionAdmin(g.userId!);
  if (!admin.ok) return admin.response;

  try {
    const db = createAdminClient();
    if (!db) return json({ institution: null, seatsUsed: 0 });

    const { data: institution } = await db.from('institutions').select('*').eq('id', admin.institutionId).single();
    const { count: seatsUsed } = await db.from('users').select('id', { count: 'exact', head: true }).eq('institution_id', admin.institutionId);
    const { data: progress } = await db.from('user_progress').select('xp, streak, study_minutes_week').in(
      'user_id',
      (await db.from('users').select('id').eq('institution_id', admin.institutionId)).data?.map(u => u.id) ?? [],
    );

    const avgXp = progress?.length ? Math.round(progress.reduce((s, p) => s + p.xp, 0) / progress.length) : 0;
    const activeWeek = progress?.filter(p => (p.study_minutes_week ?? 0) > 0).length ?? 0;

    return json({ institution, seatsUsed: seatsUsed ?? 0, avgXp, activeWeek });
  } catch (err) { return safeError(err); }
}
