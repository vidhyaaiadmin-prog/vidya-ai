import { createClient } from './supabase';
import { useUserStore, useUIStore } from './stores';

export async function performLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {}

  const db = createClient();
  if (db) {
    try { await db.auth.signOut({ scope: 'local' }); } catch {}
  }

  // Manually clear Supabase cookies — workaround for auth-js silently
  // skipping cookie removal when the session token is already expired.
  try {
    document.cookie.split(';').forEach(c => {
      const name = c.split('=')[0].trim();
      if (name.startsWith('sb-') || name.includes('-auth-token')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });
  } catch {}

  useUserStore.getState().clearUser();
  useUIStore.getState().setOnboardingDone(false);
  try {
    localStorage.removeItem('vidya-user');
    localStorage.removeItem('vidya-ui');
  } catch {}

  window.location.href = '/login';
}
