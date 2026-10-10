'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, supabaseReady } from '@/lib/supabase';
import { useUserStore, useUIStore } from '@/lib/stores';
import type { User } from '@/types';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!supabaseReady) return;
    const db = createClient();
    if (!db) return;

    async function syncSession() {
      const { data: { user: authUser } } = await db!.auth.getUser();

      if (!authUser) {
        if (useUserStore.getState().user) {
          useUserStore.getState().clearUser();
          useUIStore.getState().setOnboardingDone(false);
          try { localStorage.removeItem('vidya-user'); localStorage.removeItem('vidya-ui'); } catch {}
        }
        return;
      }

      const storedUser = useUserStore.getState().user;
      if (storedUser?.email === authUser.email) return;

      const { data: row } = await db!
        .from('users')
        .select('*, institutions(name)')
        .eq('auth_id', authUser.id)
        .single();

      if (row) {
        const u: User = { ...(row as any), institution_name: (row as any).institutions?.name };
        useUserStore.getState().setUser(u);
        useUIStore.getState().setOnboardingDone(true);

        const { data: prog } = await db!
          .from('user_progress')
          .select('*')
          .eq('user_id', row.id)
          .single();
        if (prog) useUserStore.getState().setProgress(prog as any);
      } else {
        useUserStore.getState().clearUser();
        useUIStore.getState().setOnboardingDone(false);
      }
    }

    syncSession();

    const { data: { subscription } } = db.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        useUserStore.getState().clearUser();
        useUIStore.getState().setOnboardingDone(false);
        try { localStorage.removeItem('vidya-user'); localStorage.removeItem('vidya-ui'); } catch {}
        router.replace('/login');
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        syncSession();
      }
    });

    return () => { subscription.unsubscribe(); };
  }, [router]);

  return <>{children}</>;
}
