import { NextRequest } from 'next/server';
import { guard, json, safeError, requireInstitutionAdmin } from '@/lib/security';
import { createAdminClient } from '@/lib/supabase';

// Data portability guarantee — an institution can always pull a full export
// of its own students' data, no support ticket required. Answers procurement's
// biggest fear post-DPDPA: getting locked out of their own academic records.
export async function POST(req: NextRequest) {
  const g = await guard(req, { bucket: 'default', requireUser: true });
  if (!g.ok) return g.response;

  const admin = await requireInstitutionAdmin(g.userId!);
  if (!admin.ok) return admin.response;

  try {
    const db = createAdminClient();
    if (!db) return json({ users: [], progress: [] });

    const { data: users } = await db
      .from('users')
      .select('id, name, email, major, semester, goal, language, created_at')
      .eq('institution_id', admin.institutionId);
    const userIds = (users ?? []).map(u => u.id);
    const { data: progress } = await db.from('user_progress').select('*').in('user_id', userIds);

    return json({ exported_at: new Date().toISOString(), users: users ?? [], progress: progress ?? [] });
  } catch (err) { return safeError(err); }
}
