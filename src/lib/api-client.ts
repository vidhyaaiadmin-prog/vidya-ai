import { createClient } from './supabase';

// Wraps fetch for authenticated API calls — attaches the current Supabase
// session's access token so server routes can identify the real student
// (instead of accepting anonymous requests, which have no cost control).
export async function authFetch(url: string, body: unknown): Promise<Response> {
  const db = createClient();
  const session = db ? (await db.auth.getSession()).data.session : null;

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}
