import { NextRequest } from 'next/server';
import { guard, json, safeError, requireInstitutionAdmin } from '@/lib/security';
import { createAdminClient } from '@/lib/supabase';

// IQAC evidence vault — the coordinator's workspace feeding future NAAC/NBA
// reports. List-or-add in one route since both are low-volume, low-cost ops.
export async function POST(req: NextRequest) {
  const g = await guard(req, {
    bucket: 'default',
    requireUser: true,
    schema: {
      action:    { type: 'string', enum: ['list', 'add'] as const, required: true },
      criterion: { type: 'string', maxLen: 200 },
      note:      { type: 'string', maxLen: 2000 },
    },
  });
  if (!g.ok) return g.response;

  const admin = await requireInstitutionAdmin(g.userId!);
  if (!admin.ok) return admin.response;

  try {
    const db = createAdminClient();
    if (!db) return json({ entries: [] });
    const { action, criterion, note } = g.data as any;

    if (action === 'add') {
      if (!criterion || !note) return json({ error: 'Criterion and note are required' }, 400);
      await db.from('iqac_evidence').insert({ institution_id: admin.institutionId, criterion, note, created_by: g.userId });
    }

    const { data: entries } = await db
      .from('iqac_evidence')
      .select('*')
      .eq('institution_id', admin.institutionId)
      .order('created_at', { ascending: false });

    return json({ entries: entries ?? [] });
  } catch (err) { return safeError(err); }
}
