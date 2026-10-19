'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, ArrowRight, Check, Mail, Lock } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useUserStore, useUIStore } from '@/lib/stores';
import { LANG_NAMES } from '@/lib/utils';
import { createClient, supabaseReady } from '@/lib/supabase';
import type { Major, Language, User } from '@/types';
import toast from 'react-hot-toast';

const MAJORS: Major[] = [
  'Computer Science', 'Electronics Engineering', 'Mechanical Engineering',
  'Civil Engineering', 'BBA / MBA', 'B.Com / M.Com',
  'BA / MA (Arts)', 'BCA / MCA', 'Pharmacy', 'Architecture', 'Other',
];

const GOALS = [
  { icon: '🏢', label: 'Get a great placement' },
  { icon: '🎯', label: 'Crack competitive exams' },
  { icon: '🚀', label: 'Build my own startup' },
  { icon: '📈', label: 'Improve my CGPA' },
  { icon: '💼', label: 'Get an internship' },
  { icon: '🌍', label: 'Study abroad (MS/MBA)' },
];

const LANGUAGES = Object.entries(LANG_NAMES).slice(0, 6) as [Language, string][];

const STEPS = ['code', 'account', 'name', 'major', 'goal', 'language'] as const;
type Step = typeof STEPS[number];

export default function OnboardingPage() {
  const router = useRouter();
  const { setUser, setProgress } = useUserStore();
  const { setOnboardingDone } = useUIStore();

  const [step, setStep] = useState<Step>('code');
  const [joinCode, setJoinCode] = useState('');
  const [checkingCode, setCheckingCode] = useState(false);
  const [institutionId, setInstitutionId] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [allowedEmailDomain, setAllowedEmailDomain] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [authId, setAuthId] = useState('');
  const [hasSession, setHasSession] = useState(false);

  const [name, setName] = useState('');
  const [major, setMajor] = useState<Major | ''>('');
  const [goal, setGoal] = useState<string[]>([]);
  const [language, setLanguage] = useState<Language>('en');
  const [loading, setLoading] = useState(false);

  const stepIdx = STEPS.indexOf(step);
  const stepNum = stepIdx + 1;
  const progress = (stepIdx / STEPS.length) * 100;

  const next = () => {
    const nextStep = STEPS[stepIdx + 1];
    if (nextStep) setStep(nextStep);
  };

  const back = () => {
    const prevStep = STEPS[stepIdx - 1];
    if (prevStep) setStep(prevStep);
  };

  const verifyCode = async () => {
    if (!joinCode.trim() || checkingCode) return;
    setCheckingCode(true);
    try {
      const res = await fetch('/api/auth/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode.trim() }),
      });
      const data = await res.json();
      if (!data.ok) {
        toast.error(data.error || 'Invalid institution code');
        return;
      }
      setInstitutionId(data.institutionId);
      setInstitutionName(data.institutionName);
      setAllowedEmailDomain(data.allowedEmailDomain ?? null);
      toast.success(`Verified: ${data.institutionName}`);
      next();
    } catch {
      toast.error('Network error. Please retry.');
    } finally {
      setCheckingCode(false);
    }
  };

  const emailMatchesDomain = !allowedEmailDomain || email.toLowerCase().trim().endsWith(allowedEmailDomain.toLowerCase());

  const createAccount = async () => {
    if (!email.trim() || password.length < 8 || !emailMatchesDomain || creatingAccount) return;
    setCreatingAccount(true);
    try {
      if (!supabaseReady) {
        // Local/dev mode — no backend configured, keep everything client-side.
        setAuthId(crypto.randomUUID());
        setHasSession(true);
        next();
        return;
      }

      const db = createClient()!;
      const { data, error } = await db.auth.signUp({ email: email.trim(), password });
      if (error || !data.user) {
        toast.error(error?.message || 'Could not create account.');
        return;
      }
      // Supabase returns a user with no identities (no error) when the email is
      // already registered and confirmed — its anti-enumeration behavior. Catch
      // it here instead of letting the student fill out the rest of onboarding
      // only to fail at the very last step.
      if (data.user.identities && data.user.identities.length === 0) {
        toast.error('An account already exists for this email. Please log in instead.');
        return;
      }
      setAuthId(data.user.id);
      setHasSession(!!data.session);
      toast.success('Account created!');
      next();
    } catch {
      toast.error('Network error. Please retry.');
    } finally {
      setCreatingAccount(false);
    }
  };

  const toggleGoal = (label: string) =>
    setGoal(prev => prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label]);

  const canNext = () => {
    if (step === 'name') return name.trim().length >= 2;
    if (step === 'major') return !!major;
    if (step === 'goal') return goal.length > 0;
    return true;
  };

  const finish = async () => {
    setLoading(true);
    try {
      if (!supabaseReady) {
        // Local/dev mode — no backend configured, keep everything client-side.
        const newUser: User = {
          id: crypto.randomUUID(), name: name.trim(), major: major as Major, goal, language,
          semester: 1, institution_id: institutionId, institution_name: institutionName,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        };
        setUser(newUser);
        setProgress({
          user_id: newUser.id, xp: 50, level: 1, streak: 1,
          last_active: new Date().toISOString(), total_doubts: 0,
          total_quizzes: 0, total_flashcards_reviewed: 0,
          quiz_accuracy: 0, study_minutes_today: 0, study_minutes_week: 0,
        });
        setOnboardingDone(true);
        toast.success('Welcome to Vidya AI! +50 XP for signing up 🎉');
        router.push('/home');
        return;
      }

      const db = createClient();
      let token: string | undefined;
      const { data: { session } } = await db!.auth.getSession();
      token = session?.access_token;

      if (!token) {
        const { data: signIn } = await db!.auth.signInWithPassword({
          email: email.trim(), password,
        });
        token = signIn?.session?.access_token;
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          authId, institutionId, email: email.trim(),
          name: name.trim(), major, goal, language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not finish setting up your profile.');
        return;
      }

      setUser({ ...data.user, institution_name: data.user.institutions?.name });
      setProgress(data.progress);

      if (!hasSession) {
        toast.success('Account created! Check your email to confirm, then sign in.');
        router.push('/login');
        return;
      }

      setOnboardingDone(true);
      toast.success('Welcome to Vidya AI! +50 XP for signing up 🎉');
      router.push('/home');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-dot-pattern opacity-40 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #FF6B2B, transparent)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #7C3AED, transparent)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange to-violet flex items-center justify-center shadow-orange-glow">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-text-primary">
              Vidya<span className="text-orange">AI</span>
            </span>
          </div>
          <p className="text-sm text-text-tertiary">The AI study companion built for Bharat</p>
        </motion.div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-all duration-500 ${
              i <= stepIdx ? 'bg-orange' : 'bg-card-light'
            }`} />
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            {/* Institution code */}
            {step === 'code' && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-mono font-bold tracking-widest uppercase text-orange mb-1">Step {stepNum} of {STEPS.length}</p>
                  <h2 className="font-display font-bold text-2xl text-text-primary">Your institution code</h2>
                  <p className="text-sm text-text-secondary mt-1">Vidya AI is licensed to your college — enter the code your institution shared with you.</p>
                </div>
                <input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && verifyCode()}
                  placeholder="e.g. DEMO-2026"
                  autoFocus
                  className="w-full bg-card-light border border-card-border rounded-xl px-4 py-4 text-base text-text-primary placeholder:text-text-tertiary outline-none focus:border-orange/50 focus:ring-2 focus:ring-orange/10 transition-all uppercase"
                />
                <Button full size="lg" onClick={verifyCode} loading={checkingCode} disabled={!joinCode.trim()} iconRight={<ArrowRight className="w-5 h-5" />}>
                  Verify Code
                </Button>
              </div>
            )}

            {/* Account — email + password, right after the institution is verified */}
            {step === 'account' && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-mono font-bold tracking-widest uppercase text-orange mb-1">Step {stepNum} of {STEPS.length}</p>
                  <h2 className="font-display font-bold text-2xl text-text-primary">Create your account</h2>
                  <p className="text-sm text-text-secondary mt-1">
                    {allowedEmailDomain
                      ? `Use your institution email (must end with ${allowedEmailDomain})`
                      : 'Use your institution email address'}
                  </p>
                </div>
                <Input
                  label="Email" type="email" icon={<Mail className="w-4 h-4" />}
                  value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createAccount()}
                  placeholder={`you${allowedEmailDomain || '@college.edu'}`}
                  error={email && !emailMatchesDomain ? `Must end with ${allowedEmailDomain}` : undefined}
                  autoFocus
                />
                <Input
                  label="Password" type="password" icon={<Lock className="w-4 h-4" />}
                  value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createAccount()}
                  placeholder="At least 8 characters"
                />
                <Button
                  full size="lg" onClick={createAccount} loading={creatingAccount}
                  disabled={!email.trim() || password.length < 8 || !emailMatchesDomain}
                  iconRight={<ArrowRight className="w-5 h-5" />}
                >
                  Create Account
                </Button>
                <p className="text-center text-sm text-text-tertiary">
                  Already have an account? <Link href="/login" className="text-orange font-semibold">Log in</Link>
                </p>
              </div>
            )}

            {/* Name */}
            {step === 'name' && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-mono font-bold tracking-widest uppercase text-orange mb-1">Step {stepNum} of {STEPS.length}</p>
                  <h2 className="font-display font-bold text-2xl text-text-primary">What should we call you?</h2>
                  <p className="text-sm text-text-secondary mt-1">{institutionName} · This is how we'll address you throughout the app</p>
                </div>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && canNext() && next()}
                  placeholder="Your name (e.g. Arjun, Priya, Rahul)"
                  autoFocus
                  className="w-full bg-card-light border border-card-border rounded-xl px-4 py-4 text-base text-text-primary placeholder:text-text-tertiary outline-none focus:border-orange/50 focus:ring-2 focus:ring-orange/10 transition-all"
                />
              </div>
            )}

            {/* Major */}
            {step === 'major' && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-mono font-bold tracking-widest uppercase text-orange mb-1">Step {stepNum} of {STEPS.length}</p>
                  <h2 className="font-display font-bold text-2xl text-text-primary">What are you studying?</h2>
                  <p className="text-sm text-text-secondary mt-1">Your AI tutor will personalise content to your field</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {MAJORS.map(m => (
                    <button key={m} onClick={() => setMajor(m)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                        major === m
                          ? 'bg-orange/10 border-orange/40 text-text-primary'
                          : 'bg-card-light border-card-border text-text-secondary hover:border-white/20'
                      }`}>
                      {major === m && <Check className="w-3.5 h-3.5 text-orange flex-shrink-0" />}
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Goal — multi-select */}
            {step === 'goal' && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-mono font-bold tracking-widest uppercase text-orange mb-1">Step {stepNum} of {STEPS.length}</p>
                  <h2 className="font-display font-bold text-2xl text-text-primary">What's your biggest goal?</h2>
                  <p className="text-sm text-text-secondary mt-1">Pick one or more — we'll prioritise features that help you get there</p>
                </div>
                <div className="space-y-2">
                  {GOALS.map(g => (
                    <button key={g.label} onClick={() => toggleGoal(g.label)}
                      className={`flex items-center gap-4 w-full px-4 py-3.5 rounded-xl border text-left transition-all ${
                        goal.includes(g.label)
                          ? 'bg-violet/10 border-violet/40 text-text-primary'
                          : 'bg-card-light border-card-border text-text-secondary hover:border-white/20'
                      }`}>
                      <span className="text-xl flex-shrink-0">{g.icon}</span>
                      <span className="text-sm font-medium">{g.label}</span>
                      {goal.includes(g.label) && <Check className="w-4 h-4 text-violet-light ml-auto flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Language */}
            {step === 'language' && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-mono font-bold tracking-widest uppercase text-orange mb-1">Step {stepNum} of {STEPS.length}</p>
                  <h2 className="font-display font-bold text-2xl text-text-primary">Preferred language?</h2>
                  <p className="text-sm text-text-secondary mt-1">AI will respond and explain in your language</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGES.map(([code, label]) => (
                    <button key={code} onClick={() => setLanguage(code)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                        language === code
                          ? 'bg-teal/10 border-teal/40 text-text-primary'
                          : 'bg-card-light border-card-border text-text-secondary hover:border-white/20'
                      }`}>
                      <span className="text-sm font-medium">{label}</span>
                      {language === code && <Check className="w-4 h-4 text-teal ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        {step !== 'code' && step !== 'account' && (
          <div className="mt-6 space-y-3">
            {step !== 'language' ? (
              <Button
                full size="lg"
                onClick={next}
                disabled={!canNext()}
                iconRight={<ArrowRight className="w-5 h-5" />}
              >
                Continue
              </Button>
            ) : (
              <Button
                full size="lg"
                onClick={finish}
                loading={loading}
                icon={<Zap className="w-5 h-5" />}
              >
                Start Learning · +50 XP
              </Button>
            )}
          </div>
        )}

        {stepIdx > 0 && (
          <button onClick={back}
            className="w-full text-sm text-text-tertiary hover:text-text-secondary transition-colors py-2 mt-3">
            ← Go back
          </button>
        )}
      </div>
    </div>
  );
}
