import { NextRequest } from 'next/server';
import { guard, json, safeError } from '@/lib/security';
import { createAdminClient } from '@/lib/supabase';

// Creates the public.users profile row right after Supabase Auth signUp.
// Runs via the admin client so it doesn't depend on session/email-confirmation
// timing — authId is valid immediately from signUp's response either way.
export async function POST(req: NextRequest) {
  const g = await guard(req, {
    bucket: 'auth',
    schema: {
      authId:        { type: 'string', required: true, maxLen: 100 },
      institutionId: { type: 'string', required: true, maxLen: 100 },
      email:         { type: 'string', required: true, maxLen: 200 },
      name:          { type: 'string', required: true, maxLen: 100 },
      major:         { type: 'string', required: true, maxLen: 100 },
      goal:          { type: 'array', required: true, maxLen: 10 },
      language:      { type: 'string', required: true, maxLen: 10 },
    },
  });
  if (!g.ok) return g.response;

  try {
    const { authId, institutionId, email, name, major, language } = g.data as Record<string, string>;
    const goal = g.data.goal as string[];
    const db = createAdminClient();
    if (!db) return json({ error: 'Backend not configured' }, 500);

    // Verify the caller owns this authId.  Prefer a session token when
    // available; fall back to admin-verified lookup for the onboarding
    // case where email confirmation is still pending (no session yet).
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (token) {
      const { data: { user: authUser }, error: authError } = await db.auth.getUser(token);
      if (authError || !authUser) return json({ error: 'Invalid or expired session' }, 401);
      if (authUser.id !== authId) return json({ error: 'Auth ID mismatch' }, 403);
    } else {
      const { data: { user: adminUser }, error: adminErr } = await db.auth.admin.getUserById(authId);
      if (adminErr || !adminUser) return json({ error: 'Invalid auth ID' }, 401);
      if (adminUser.email !== email) return json({ error: 'Email does not match auth record' }, 403);
      const createdAt = new Date(adminUser.created_at).getTime();
      if (Date.now() - createdAt > 3600_000) return json({ error: 'Onboarding window expired' }, 403);
    }

    // Defense in depth: re-verify the email matches the institution's registered
    // domain server-side, even though the client already checked this.
    const { data: institution } = await db
      .from('institutions')
      .select('allowed_email_domain')
      .eq('id', institutionId)
      .single();
    if (institution?.allowed_email_domain && !email.toLowerCase().endsWith(institution.allowed_email_domain.toLowerCase())) {
      await db.auth.admin.deleteUser(authId).catch(() => {});
      return json({ error: `Email must be a ${institution.allowed_email_domain} address for this institution.` }, 400);
    }

    const { data: user, error } = await db
      .from('users')
      .insert({ auth_id: authId, institution_id: institutionId, email, name, major, goal, language })
      .select('*, institutions(name)')
      .single();

    if (error || !user) return json({ error: 'Could not create profile. Contact your institution admin.' }, 400);

    const { data: progress } = await db
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return json({ user, progress });
  } catch (err) {
    return safeError(err);
  }
}
