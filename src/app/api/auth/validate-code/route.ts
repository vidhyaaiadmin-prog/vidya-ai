import { NextRequest } from 'next/server';
import { guard, json, safeError } from '@/lib/security';
import { createAdminClient } from '@/lib/supabase';

// Validates an institution join code BEFORE an account is created.
// Runs server-side with the admin client so join codes are never exposed
// to anon/public queries — only this endpoint can look them up.
export async function POST(req: NextRequest) {
  const g = await guard(req, {
    bucket: 'auth',
    schema: { code: { type: 'string', required: true, maxLen: 30 } },
  });
  if (!g.ok) return g.response;

  try {
    const { code } = g.data as { code: string };
    const db = createAdminClient();
    if (!db) return json({ ok: true, institutionId: 'local-dev', institutionName: 'Local Dev Mode', allowedEmailDomain: null });

    const { data: institution } = await db
      .from('institutions')
      .select('id, name, allowed_email_domain, seats_limit, is_active')
      .ilike('join_code', code.trim())
      .single();

    if (!institution || !institution.is_active) {
      return json({ ok: false, error: 'Invalid or inactive institution code' }, 404);
    }

    const { count } = await db
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('institution_id', institution.id);

    if ((count ?? 0) >= institution.seats_limit) {
      return json({ ok: false, error: 'This institution has reached its licensed seat limit. Contact your admin.' }, 409);
    }

    return json({
      ok: true,
      institutionId: institution.id,
      institutionName: institution.name,
      allowedEmailDomain: institution.allowed_email_domain,
    });
  } catch (err) {
    return safeError(err);
  }
}
