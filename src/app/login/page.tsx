'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Zap, Mail, Lock } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { createClient, supabaseReady } from '@/lib/supabase';
import { useUserStore, useUIStore } from '@/lib/stores';
import type { User } from '@/types';
import toast from 'react-hot-toast';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser, fetchProgress } = useUserStore();
  const { setOnboardingDone } = useUIStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.get('verified') === '1') {
      toast.success('Email verified! You can now sign in.');
      router.replace('/login');
    } else if (params.get('error')) {
      const err = params.get('error');
      toast.error(err === 'missing_code' ? 'Invalid verification link.' : 'Email verification failed. Please try again.');
      router.replace('/login');
    }
  }, [params, router]);

  const login = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const db = createClient();
      if (!db) {
        toast.error('No backend configured — use onboarding for local mode.');
        return;
      }

      const { data: authData, error: authError } = await db.auth.signInWithPassword({
        email: email.trim(), password,
      });
      if (authError || !authData.user) {
        toast.error(authError?.message === 'Email not confirmed'
          ? 'Please confirm your email before signing in.'
          : 'Invalid email or password.');
        return;
      }

      const { data: row, error: rowError } = await db
        .from('users')
        .select('*, institutions(name)')
        .eq('auth_id', authData.user.id)
        .single();
      if (rowError || !row) {
        toast.error('Could not load your profile. Contact your institution admin.');
        return;
      }

      const user: User = {
        ...(row as any),
        institution_name: (row as any).institutions?.name,
      };
      setUser(user);
      await fetchProgress();
      setOnboardingDone(true);
      router.push('/home');
    } catch {
      toast.error('Network error. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange to-violet flex items-center justify-center shadow-orange-glow">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-text-primary">
              Vidya<span className="text-orange">AI</span>
            </span>
          </div>
          <p className="text-sm text-text-tertiary">Sign in with your institution account</p>
        </div>

        {!supabaseReady && (
          <p className="text-xs text-amber text-center bg-amber/10 border border-amber/20 rounded-xl p-3">
            No backend configured in this environment — use "Get started" below for local/dev mode.
          </p>
        )}

        <div className="space-y-3">
          <Input
            label="Email" type="email" icon={<Mail className="w-4 h-4" />}
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@college.edu" autoFocus
          />
          <Input
            label="Password" type="password" icon={<Lock className="w-4 h-4" />}
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="••••••••"
          />
        </div>

        <Button full size="lg" onClick={login} loading={loading} disabled={!email.trim() || !password}>
          Sign In
        </Button>

        <p className="text-center text-sm text-text-tertiary">
          New here? <Link href="/onboarding" className="text-orange font-semibold">Get started</Link>
        </p>

        <p className="text-center text-xs text-text-tertiary/60">
          <Link href="/privacy" className="hover:text-text-tertiary transition">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
