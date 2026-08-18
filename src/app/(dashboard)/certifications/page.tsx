'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, CheckCircle, XCircle, Sparkles, ExternalLink, Trophy } from 'lucide-react';
import { Button, Card, Badge, Input, SectionHeader, EmptyState, ProgressBar } from '@/components/ui';
import { useUserStore } from '@/lib/stores';
import { XP_REWARDS, cn, celebrate } from '@/lib/utils';
import { authFetch } from '@/lib/api-client';
import { createClient } from '@/lib/supabase';
import type { CertificationSuggestion, UserCertification, QuizQuestion, Difficulty } from '@/types';
import toast from 'react-hot-toast';

const COMPLEXITY_COLOR: Record<Difficulty, 'mint' | 'amber' | 'danger'> = {
  easy: 'mint', medium: 'amber', hard: 'danger',
};

// ─── Suggestion Card ───────────────────────────────────────
function SuggestionCard({ sugg, saved, onSave, saving }: {
  sugg: CertificationSuggestion; saved: boolean; onSave: () => void; saving: boolean;
}) {
  return (
    <Card className="!p-4 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary leading-snug">{sugg.title}</p>
          <p className="text-xs text-text-tertiary mt-0.5">{sugg.provider}</p>
        </div>
        <Badge color={sugg.cost_type === 'free' ? 'mint' : 'amber'} size="sm">{sugg.cost_type}</Badge>
      </div>
      <p className="text-xs text-text-secondary leading-relaxed">{sugg.why}</p>
      <div className="flex items-center justify-between gap-2 pt-1">
        <Badge color={COMPLEXITY_COLOR[sugg.complexity]} size="sm">{sugg.complexity}</Badge>
        <div className="flex items-center gap-2">
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(sugg.search_query)}`}
            target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-text-tertiary hover:text-text-primary flex items-center gap-1 transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> Search
          </a>
          <Button size="xs" variant={saved ? 'secondary' : 'outline'} disabled={saved || saving} onClick={onSave}>
            {saved ? 'Saved' : `Save +${XP_REWARDS.cert_saved} XP`}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ─── My Certification Row ───────────────────────────────────
function MyCertRow({ cert, onStartQuiz, busy }: {
  cert: UserCertification; onStartQuiz: () => void; busy: boolean;
}) {
  return (
    <Card className="!p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary leading-snug">{cert.title}</p>
          <p className="text-xs text-text-tertiary mt-0.5">{cert.provider}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge color={cert.cost_type === 'free' ? 'mint' : 'amber'} size="sm">{cert.cost_type}</Badge>
            <Badge color={COMPLEXITY_COLOR[cert.complexity]} size="sm">{cert.complexity}</Badge>
            {cert.status === 'completed' && (
              <Badge color="violet" size="sm">
                {cert.quiz_score}/{cert.quiz_total} on quiz
              </Badge>
            )}
          </div>
        </div>
        {cert.status === 'saved' ? (
          <Button size="xs" variant="violet" disabled={busy} onClick={onStartQuiz} icon={<Sparkles className="w-3.5 h-3.5" />}>
            Mark Complete
          </Button>
        ) : (
          <div className="flex items-center gap-1 text-mint text-xs font-semibold flex-shrink-0">
            <CheckCircle className="w-4 h-4" /> Done
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function CertificationsPage() {
  const { user, addXP } = useUserStore();
  const [specialization, setSpecialization] = useState('');
  const [suggestions, setSuggestions] = useState<CertificationSuggestion[]>([]);
  const [generating, setGenerating] = useState(false);
  const [savingTitle, setSavingTitle] = useState<string | null>(null);

  const [myCerts, setMyCerts] = useState<UserCertification[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(true);

  // Quiz-taking sub-flow, triggered when marking a saved certification complete
  const [phase, setPhase] = useState<'browse' | 'quiz-loading' | 'quiz' | 'quiz-result'>('browse');
  const [activeCert, setActiveCert] = useState<UserCertification | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);

  const fetchMyCertifications = useCallback(async () => {
    const db = createClient();
    if (!db || !user) { setLoadingCerts(false); return; }
    try {
      const { data } = await db
        .from('user_certifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setMyCerts((data ?? []) as unknown as UserCertification[]);
    } finally {
      setLoadingCerts(false);
    }
  }, [user]);

  useEffect(() => { fetchMyCertifications(); }, [fetchMyCertifications]);

  const generateSuggestions = async () => {
    if (!specialization.trim()) return;
    setGenerating(true);
    try {
      const res = await authFetch('/api/ai/certifications', {
        specialization: specialization.trim(), major: user?.major, language: user?.language,
      });
      const data = await res.json();
      if (data.certifications?.length) {
        setSuggestions(data.certifications);
      } else {
        toast.error(data.error || 'Could not generate suggestions. Try a different specialization.');
      }
    } catch {
      toast.error('Network error. Please retry.');
    } finally {
      setGenerating(false);
    }
  };

  const saveSuggestion = async (sugg: CertificationSuggestion) => {
    const db = createClient();
    if (!db || !user) return;
    setSavingTitle(sugg.title);
    try {
      const { data, error } = await db.from('user_certifications').insert({
        user_id: user.id,
        title: sugg.title,
        provider: sugg.provider,
        cost_type: sugg.cost_type,
        complexity: sugg.complexity,
        specialization: specialization.trim(),
        why: sugg.why,
        status: 'saved',
      }).select().single();
      if (error || !data) { toast.error('Could not save this certification.'); return; }
      setMyCerts(prev => [data as unknown as UserCertification, ...prev]);
      await addXP('cert_saved');
      toast.success(`Saved! +${XP_REWARDS.cert_saved} XP`);
    } finally {
      setSavingTitle(null);
    }
  };

  const startCompletionQuiz = async (cert: UserCertification) => {
    setActiveCert(cert);
    setPhase('quiz-loading');
    try {
      const res = await authFetch('/api/ai/quiz', {
        subject: `"${cert.title}" by ${cert.provider} — a ${cert.complexity}-level certification${cert.specialization ? ` in ${cert.specialization}` : ''}. ${cert.why ?? ''}`,
        difficulty: cert.complexity,
        major: user?.major,
        language: user?.language,
        count: 5,
      });
      const data = await res.json();
      if (data.questions?.length) {
        setQuestions(data.questions);
        setCurrentIdx(0);
        setAnswers(new Array(data.questions.length).fill(null));
        setShowExplanation(false);
        setPhase('quiz');
      } else {
        toast.error('Could not generate a quiz for this certification. Please retry.');
        setPhase('browse');
      }
    } catch {
      toast.error('Network error. Please retry.');
      setPhase('browse');
    }
  };

  const selectAnswer = useCallback((idx: number) => {
    if (answers[currentIdx] !== null) return;
    const next = [...answers];
    next[currentIdx] = idx;
    setAnswers(next);
    setShowExplanation(true);

    setTimeout(async () => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(i => i + 1);
        setShowExplanation(false);
        return;
      }
      // Last question — finish, persist, and award XP
      const score = next.filter((a, i) => a === questions[i]?.answer).length;
      const db = createClient();
      if (db && activeCert) {
        await db.from('user_certifications').update({
          status: 'completed',
          quiz_score: score,
          quiz_total: questions.length,
          xp_earned: XP_REWARDS.cert_completed,
          completed_at: new Date().toISOString(),
        }).eq('id', activeCert.id);
      }
      await addXP('cert_completed');
      celebrate();
      toast.success(`Certification complete! +${XP_REWARDS.cert_completed} XP`);
      setPhase('quiz-result');
    }, 1800);
  }, [answers, currentIdx, questions, activeCert, addXP]);

  const backToBrowse = () => {
    setPhase('browse');
    setActiveCert(null);
    setQuestions([]);
    fetchMyCertifications();
  };

  const savedTitles = new Set(myCerts.map(c => c.title));
  const score = answers.filter((a, i) => a === questions[i]?.answer).length;

  // ─── Quiz sub-flow ─────────────────────────────────────────
  if (phase === 'quiz-loading') return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet to-orange flex items-center justify-center animate-pulse">
        <Sparkles className="w-7 h-7 text-white" />
      </div>
      <p className="font-display font-bold text-lg text-text-primary">Building your completion quiz…</p>
      <p className="text-sm text-text-tertiary">Based on {activeCert?.title}</p>
    </div>
  );

  if (phase === 'quiz' && questions[currentIdx]) {
    const q = questions[currentIdx];
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <ProgressBar value={(currentIdx / questions.length) * 100} className="flex-1" />
          <span className="text-xs font-mono text-text-tertiary flex-shrink-0">{currentIdx + 1}/{questions.length}</span>
        </div>
        <Card className="!p-6">
          <Badge color="violet" className="mb-3">{activeCert?.title}</Badge>
          <p className="text-base font-semibold text-text-primary leading-relaxed">{q.q}</p>
        </Card>
        <div className="space-y-2.5">
          {q.options.map((opt, i) => {
            const isSelected = answers[currentIdx] === i;
            const isCorrect = i === q.answer;
            return (
              <button key={i} disabled={showExplanation} onClick={() => selectAnswer(i)}
                className={cn('quiz-option w-full disabled:cursor-default',
                  showExplanation && isCorrect ? 'correct' : '',
                  showExplanation && isSelected && !isCorrect ? 'wrong' : '',
                )}>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                  showExplanation && isCorrect ? 'bg-mint text-white' : '',
                  showExplanation && isSelected && !isCorrect ? 'bg-danger text-white' : '',
                  !showExplanation ? 'bg-card-light text-text-secondary' : '')}>
                  {showExplanation && isCorrect ? <CheckCircle className="w-4 h-4" /> :
                   showExplanation && isSelected ? <XCircle className="w-4 h-4" /> : String.fromCharCode(65 + i)}
                </div>
                <span className="text-sm leading-snug">{opt}</span>
              </button>
            );
          })}
        </div>
        {showExplanation && (
          <Card className={cn('!p-4', answers[currentIdx] === q.answer ? 'border-mint/30 bg-mint/5' : 'border-amber/30 bg-amber/5')}>
            <p className="text-sm text-text-secondary leading-relaxed">{q.explanation}</p>
          </Card>
        )}
      </div>
    );
  }

  if (phase === 'quiz-result') return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Card glow="violet" className="text-center !py-10">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-orange" />
          <h2 className="font-display font-bold text-2xl text-text-primary mb-1">Certification Complete!</h2>
          <p className="text-text-secondary mb-4">{activeCert?.title}</p>
          <div className="font-display font-bold text-4xl text-gradient-orange mb-4">{score}/{questions.length}</div>
          <Badge color="orange">+{XP_REWARDS.cert_completed} XP</Badge>
        </Card>
      </motion.div>
      <Button full size="lg" className="mt-5" onClick={backToBrowse}>Back to Certifications</Button>
    </div>
  );

  // ─── Browse / suggest ──────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SectionHeader
        eyebrow="Certification Suggester"
        title={<>Certs that actually <span className="text-gradient-brand">move the needle.</span></>}
        subtitle="Tell me your specialisation — I'll suggest free and paid certifications relevant to the current market, then quiz you once you've finished one."
      />

      <Card glow="violet">
        <div className="space-y-3">
          <Input
            label="Specialisation / interest area"
            value={specialization}
            onChange={e => setSpecialization(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generateSuggestions()}
            placeholder="e.g. Cloud Computing, Data Analytics, Digital Marketing"
            icon={<Award className="w-4 h-4" />}
          />
          <Button full size="lg" onClick={generateSuggestions} loading={generating} disabled={!specialization.trim()}>
            Suggest Certifications
          </Button>
        </div>
      </Card>

      {suggestions.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-mono text-text-tertiary uppercase tracking-widest">Suggestions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map(sugg => (
              <SuggestionCard
                key={sugg.title}
                sugg={sugg}
                saved={savedTitles.has(sugg.title)}
                saving={savingTitle === sugg.title}
                onSave={() => saveSuggestion(sugg)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        <p className="text-xs font-mono text-text-tertiary uppercase tracking-widest">
          My Certifications ({myCerts.length})
        </p>
        {loadingCerts ? null : myCerts.length === 0 ? (
          <EmptyState icon="🎓" title="No certifications saved yet"
            description="Generate suggestions above and save the ones you're planning to take." />
        ) : (
          <AnimatePresence>
            {myCerts.map(cert => (
              <motion.div key={cert.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <MyCertRow cert={cert} busy={phase !== 'browse'} onStartQuiz={() => startCompletionQuiz(cert)} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
