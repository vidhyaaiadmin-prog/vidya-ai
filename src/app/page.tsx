// src/app/page.tsx — root redirect
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore, useUIStore } from '@/lib/stores';
import { Zap } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { user } = useUserStore();
  const { onboardingDone } = useUIStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user && onboardingDone) {
        router.replace('/home');
      } else {
        router.replace('/onboarding');
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [user, onboardingDone, router]);

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange to-violet flex items-center justify-center shadow-orange-glow animate-pulse">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <div className="font-display font-bold text-3xl text-text-primary">
          Vidya<span className="text-orange">AI</span>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-orange typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
