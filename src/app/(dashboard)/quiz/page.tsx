'use client';
import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, RotateCcw, Trophy, Target, Zap, ChevronRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button, Card, Badge, ProgressBar, SectionHeader, EmptyState, ChipGroup } from '@/components/ui';
import { useUserStore } from '@/lib/stores';
import { XP_REWARDS, cn, celebrate, shuffle } from '@/lib/utils';
import { authFetch } from '@/lib/api-client';
import { useVaultMode } from '@/lib/useVaultMode';
import { createClient } from '@/lib/supabase';
import type { QuizQuestion, Difficulty } from '@/types';
import toast from 'react-hot-toast';

const DIFFICULTY_OPTIONS = [
  { value: 'easy' as Difficulty,   label: 'Easy',   icon: '🟢' },
  { value: 'medium' as Difficulty, label: 'Medium', icon: '🟡' },
  { value: 'hard' as Difficulty,   label: 'Hard',   icon: '🔴' },
];

const QUICK_TOPICS = [
  'Binary Trees', 'SQL Joins', 'Time Value of Money', 'Supply & Demand',
  'Newton\'s Laws', 'Porter\'s Five Forces', 'HTTP Methods', 'Thermodynamics',
  'Marketing Mix 4P', 'Linked Lists', 'Balance Sheet', 'Electromagnetic Induction',
];

// ─── Adaptive difficulty engine ─────────────────────────────
// Ability rises after a correct answer, falls after a wrong one, and each
// next question is picked from the unanswered pool closest to that level —
// no extra AI calls, just smarter ordering of the batch already generated.
const DIFF_RANK: Record<string, number> = { easy: 0, medium: 1, hard: 2 };

function pickNextIndex(questions: QuizQuestion[], answeredIdxs: number[], ability: number): number | null {
  const answered = new Set(answeredIdxs);
  const remaining = questions.map((_, i) => i).filter(i => !answered.has(i));
  if (!remaining.length) return null;
  remaining.sort((a, b) => {
    const da = Math.abs(DIFF_RANK[questions[a].difficulty ?? 'medium'] - ability);
    const db = Math.abs(DIFF_RANK[questions[b].difficulty ?? 'medium'] - ability);
    return da - db;
  });
  return remaining[0];
}

// ─── Setup Screen ──────────────────────────────────────────
function QuizSetup({ onGenerate }: { onGenerate: (subject: string, diff: Difficulty, vault: boolean) => void }) {
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [vault, setVault] = useState(false);
  const { user } = useUserStore();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <SectionHeader
        eyebrow="AI Quiz Generator"
        title={<>Test your <span className="text-gradient-orange">knowledge instantly</span></>}
        subtitle="Enter any topic and I'll generate 5 tailored MCQ questions. New questions every time."
      />

      <Card glow="orange">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono font-bold tracking-widest uppercase text-text-secondary mb-2 block">
              Topic / Subject
            </label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && subject.trim() && onGenerate(subject, difficulty, vault)}
              placeholder={`e.g. "Binary Trees", "Porter's Five Forces", "Thermodynamics"`}
              className="w-full bg-navy-2 border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-orange/50 focus:ring-2 focus:ring-orange/10 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-mono font-bold tracking-widest uppercase text-text-secondary mb-2 block">
              Difficulty
            </label>
            <ChipGroup options={DIFFICULTY_OPTIONS} value={difficulty} onChange={setDifficulty} />
          </div>

          <button
            onClick={() => setVault(v => !v)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all',
              vault ? 'bg-violet/10 border-violet/40' : 'bg-card-light border-card-border hover:border-white/20',
            )}>
            <ShieldCheck className={cn('w-4 h-4 flex-shrink-0', vault ? 'text-violet-light' : 'text-text-tertiary')} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary">Vault Mode</p>
              <p className="text-[10px] text-text-tertiary">Camera + tab-focus proctoring for exam integrity</p>
            </div>
            <div className={cn('w-9 h-5 rounded-full flex-shrink-0 relative transition-all', vault ? 'bg-violet' : 'bg-card-border')}>
              <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all', vault ? 'left-4' : 'left-0.5')} />
            </div>
          </button>

          <Button
            full size="lg"
            onClick={() => subject.trim() && onGenerate(subject, difficulty, vault)}
            disabled={!subject.trim()}
            icon={<Zap className="w-4 h-4" />}
          >
            Generate Quiz
          </Button>
        </div>
      </Card>

      {/* XP info */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: '✅', val: `+${XP_REWARDS.quiz_correct} XP`, label: 'Correct answer' },
          { icon: '📚', val: `+${XP_REWARDS.quiz_wrong} XP`,   label: 'Wrong answer' },
          { icon: '🏆', val: `+${XP_REWARDS.quiz_completed} XP`, label: 'Quiz completed' },
        ].map(s => (
          <Card key={s.label} className="text-center !py-3">
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="font-display font-bold text-sm text-orange">{s.val}</div>
            <div className="text-[10px] text-text-tertiary mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Quick picks */}
      <div>
        <p className="text-xs font-mono text-text-tertiary uppercase tracking-widest mb-3">Quick pick</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_TOPICS.map(t => (
            <button key={t} onClick={() => setSubject(t)}
              className="text-xs px-3 py-1.5 rounded-lg bg-card-light border border-card-border text-text-secondary hover:border-white/20 hover:text-text-primary transition-all">
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Question Card ─────────────────────────────────────────
function QuestionCard({
  question, questionNum, total, selected, onSelect, showAnswer,
}: {
  question: QuizQuestion;
  questionNum: number;
  total: number;
  selected: number | null;
  onSelect: (i: number) => void;
  showAnswer: boolean;
}) {
  const LABELS = ['A', 'B', 'C', 'D'];

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <ProgressBar value={(questionNum / total) * 100} className="flex-1" />
        <span className="text-xs font-mono text-text-tertiary flex-shrink-0">
          {questionNum}/{total}
        </span>
      </div>

      {/* Question */}
      <Card glow="none" className="!p-6">
        <div className="flex items-center gap-2 mb-4">
          <Badge color="grey">Question {questionNum}</Badge>
          {question.difficulty && (
            <Badge color={question.difficulty === 'hard' ? 'danger' : question.difficulty === 'easy' ? 'mint' : 'amber'}>
              {question.difficulty}
            </Badge>
          )}
        </div>
        <p className="text-base font-semibold text-text-primary leading-relaxed">
          {question.q}
        </p>
      </Card>

      {/* Options */}
      <div className="space-y-2.5">
        {question.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === question.answer;
          let stateClass = '';
          if (showAnswer) {
            if (isCorrect) stateClass = 'quiz-option correct';
            else if (isSelected && !isCorrect) stateClass = 'quiz-option wrong';
            else stateClass = 'quiz-option opacity-50';
          } else if (isSelected) {
            stateClass = 'quiz-option selected';
          } else {
            stateClass = 'quiz-option';
          }

          return (
            <motion.button
              key={i}
              onClick={() => !showAnswer && onSelect(i)}
              disabled={showAnswer}
              whileHover={!showAnswer ? { x: 3 } : {}}
              className={cn(stateClass, 'w-full cursor-pointer disabled:cursor-default')}
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all',
                showAnswer && isCorrect ? 'bg-mint text-white' : '',
                showAnswer && isSelected && !isCorrect ? 'bg-danger text-white' : '',
                !showAnswer ? 'bg-card-light text-text-secondary' : '',
              )}>
                {showAnswer && isCorrect ? <CheckCircle className="w-4 h-4" /> :
                 showAnswer && isSelected ? <XCircle className="w-4 h-4" /> :
                 LABELS[i]}
              </div>
              <span className="text-sm leading-snug">{opt}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {showAnswer && (
          <motion.div
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={cn(
              '!p-4',
              selected === question.answer
                ? 'border-mint/30 bg-mint/5' : 'border-amber/30 bg-amber/5',
            )}>
              <p className={cn(
                'text-xs font-mono font-bold uppercase tracking-widest mb-2',
                selected === question.answer ? 'text-mint' : 'text-amber',
              )}>
                {selected === question.answer ? '✓ Correct!' : '✗ Not quite'}
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">{question.explanation}</p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Result Screen ─────────────────────────────────────────
function ResultScreen({
  questions, answers, subject, difficulty, timeTaken,
  onReset, onRetry, vaultUsed, violations, flags,
}: {
  questions: QuizQuestion[];
  answers: (number | null)[];
  subject: string;
  difficulty: Difficulty;
  timeTaken: number;
  onReset: () => void;
  onRetry: () => void;
  vaultUsed?: boolean;
  violations?: string[];
  flags?: string[];
}) {
  const score = answers.filter((a, i) => a === questions[i]?.answer).length;
  const pct = Math.round((score / questions.length) * 100);
  const emoji = pct === 100 ? '🏆' : pct >= 80 ? '🎯' : pct >= 60 ? '📚' : '💪';
  const label = pct === 100 ? 'Perfect Score!' : pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good Effort!' : 'Keep Practicing!';
  const xpEarned = answers.reduce<number>((sum, a, i) =>
    sum + (a === questions[i]?.answer ? XP_REWARDS.quiz_correct : XP_REWARDS.quiz_wrong), 0,
  ) + XP_REWARDS.quiz_completed;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Score card */}
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Card glow={pct >= 60 ? 'teal' : 'none'} className="text-center !py-8">
          <div className="text-6xl mb-3 animate-float">{emoji}</div>
          <h2 className="font-display font-bold text-2xl text-text-primary mb-1">{label}</h2>
          <div className="font-display font-bold text-5xl text-gradient-orange my-3">
            {score}/{questions.length}
          </div>
          <div className="flex items-center justify-center gap-3 mt-2">
            <Badge color={pct >= 60 ? 'teal' : 'amber'}>{pct}% Score</Badge>
            <Badge color="orange">+{xpEarned} XP</Badge>
            <Badge color="grey">{Math.round(timeTaken / 60)}m {timeTaken % 60}s</Badge>
          </div>
        </Card>
      </motion.div>

      {/* Vault Mode integrity summary */}
      {vaultUsed && (
        <Card className="!p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-violet-light" />
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-text-tertiary">Vault Mode Summary</span>
          </div>
          {(violations?.length ?? 0) === 0 && (flags?.length ?? 0) === 0 ? (
            <p className="text-xs text-mint flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> No integrity concerns detected.</p>
          ) : (
            <div className="space-y-1">
              {violations?.map((v, i) => (
                <p key={`v${i}`} className="text-xs text-amber flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{v}</p>
              ))}
              {flags?.map((f, i) => (
                <p key={`f${i}`} className="text-xs text-danger flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{f}</p>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Review */}
      <div className="space-y-2.5">
        <p className="text-xs font-mono font-bold tracking-widest uppercase text-text-tertiary">Review</p>
        {questions.map((q, i) => {
          const correct = answers[i] === q.answer;
          return (
            <Card key={i} className={cn('!p-4', correct ? 'border-l-2 border-l-mint' : 'border-l-2 border-l-danger')}>
              <div className="flex items-start gap-3">
                <div className={cn('mt-0.5 flex-shrink-0', correct ? 'text-mint' : 'text-danger')}>
                  {correct ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-text-secondary mb-1">Q{i + 1}</p>
                  <p className="text-sm text-text-primary font-medium mb-2 leading-snug">{q.q}</p>
                  <p className="text-xs text-mint">✓ {q.options[q.answer]}</p>
                  {!correct && answers[i] !== null && (
                    <p className="text-xs text-danger mt-0.5">✗ You: {q.options[answers[i]!]}</p>
                  )}
                  <p className="text-xs text-text-tertiary mt-2 leading-relaxed">{q.explanation}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button full variant="secondary" icon={<RotateCcw className="w-4 h-4" />} onClick={onRetry}>
          Retry
        </Button>
        <Button full onClick={onReset}>
          New Quiz
        </Button>
      </div>
    </div>
  );
}

// ─── Main Quiz Page ────────────────────────────────────────
export default function QuizPage() {
  const { user, addXP } = useUserStore();
  const [phase, setPhase] = useState<'setup' | 'loading' | 'quiz' | 'result'>('setup');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answeredIdxs, setAnsweredIdxs] = useState<number[]>([]);
  const [ability, setAbility] = useState(1);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [vaultEnabled, setVaultEnabled] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);
  const vault = useVaultMode(vaultEnabled);

  // Camera can only attach once the (hidden) <video> element in the quiz-phase
  // JSX has actually mounted, so start it here rather than inside generate().
  useEffect(() => {
    if (phase !== 'quiz' || !vaultEnabled) return;
    vault.startCamera().then(ok => {
      if (!ok) { toast.error('Camera access denied — continuing without Vault Mode.'); setVaultEnabled(false); }
    });
    const id = setInterval(() => vault.snapshotCheck(), 30_000);
    return () => { clearInterval(id); vault.stopCamera(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, vaultEnabled]);

  const generate = useCallback(async (s: string, d: Difficulty, useVault: boolean) => {
    setSubject(s); setDifficulty(d);
    setVaultEnabled(useVault);
    setPhase('loading');

    try {
      const res = await authFetch('/api/ai/quiz', { subject: s, difficulty: d, major: user?.major, language: user?.language, count: 5 });
      const data = await res.json();
      if (data.questions?.length) {
        const qs: QuizQuestion[] = data.questions;
        const initialAbility = DIFF_RANK[d] ?? 1;
        setQuestions(qs);
        setAbility(initialAbility);
        setAnsweredIdxs([]);
        setCurrentIdx(pickNextIndex(qs, [], initialAbility) ?? 0);
        setAnswers(new Array(qs.length).fill(null));
        setShowExplanation(false);
        setStartTime(Math.floor(Date.now() / 1000));
        setPhase('quiz');

        const db = createClient();
        if (db && user) {
          const { data: row } = await db.from('quizzes').insert({
            user_id: user.id,
            subject: s,
            difficulty: d,
            questions: qs,
          }).select('id').single();
          if (row) setQuizId(row.id);
        }
      } else {
        toast.error('Could not generate quiz. Try a different topic.');
        setPhase('setup');
      }
    } catch {
      toast.error('Network error. Please try again.');
      setPhase('setup');
    }
  }, [user]);

  const selectAnswer = useCallback(async (idx: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIdx] = idx;
    setAnswers(newAnswers);
    setShowExplanation(true);

    const correct = idx === questions[currentIdx].answer;
    const newAbility = Math.min(2, Math.max(0, ability + (correct ? 1 : -1)));
    const newAnsweredIdxs = [...answeredIdxs, currentIdx];
    setAbility(newAbility);
    setAnsweredIdxs(newAnsweredIdxs);

    await addXP(correct ? 'quiz_correct' : 'quiz_wrong');
    toast.success(`${correct ? '✓ Correct' : '✗ Wrong'} · +${correct ? XP_REWARDS.quiz_correct : XP_REWARDS.quiz_wrong} XP`, {
      duration: 1800,
    });

    // Auto-advance after 2s — next question picked by adaptive difficulty, not just next in list
    setTimeout(async () => {
      const next = pickNextIndex(questions, newAnsweredIdxs, newAbility);
      if (next !== null) {
        setCurrentIdx(next);
        setShowExplanation(false);
      } else {
        const elapsed = Math.floor(Date.now() / 1000) - startTime;
        setTimeTaken(elapsed);
        await addXP('quiz_completed');
        celebrate();
        setPhase('result');

        const finalAnswers = [...newAnswers];
        const finalScore = finalAnswers.filter((a, i) => a === questions[i]?.answer).length;
        const totalXP = finalAnswers.reduce<number>((sum, a, i) =>
          sum + (a === questions[i]?.answer ? XP_REWARDS.quiz_correct : XP_REWARDS.quiz_wrong), 0,
        ) + XP_REWARDS.quiz_completed;
        const db = createClient();
        if (db && quizId) {
          await db.from('quizzes').update({
            answers: finalAnswers,
            score: finalScore,
            time_taken: elapsed,
            xp_earned: totalXP,
            completed_at: new Date().toISOString(),
          }).eq('id', quizId);
        }
      }
    }, 2000);
  }, [answers, currentIdx, questions, addXP, startTime, ability, answeredIdxs, quizId]);

  if (phase === 'setup') return <QuizSetup onGenerate={generate} />;

  if (phase === 'loading') return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange to-violet flex items-center justify-center animate-pulse">
        <Zap className="w-7 h-7 text-white" />
      </div>
      <div className="text-center">
        <p className="font-display font-bold text-lg text-text-primary mb-1">Generating your quiz…</p>
        <p className="text-sm text-text-tertiary">Creating 5 {difficulty} questions on <span className="text-orange">{subject}</span></p>
      </div>
      <div className="flex gap-1.5 mt-2">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-orange typing-dot" style={{ animationDelay: `${i*0.2}s` }} />
        ))}
      </div>
    </div>
  );

  if (phase === 'result') return (
    <ResultScreen
      questions={questions} answers={answers} subject={subject}
      difficulty={difficulty} timeTaken={timeTaken}
      vaultUsed={vaultEnabled} violations={vault.violations} flags={vault.flags}
      onReset={() => setPhase('setup')}
      onRetry={() => {
        const initialAbility = DIFF_RANK[difficulty] ?? 1;
        setAbility(initialAbility);
        setAnsweredIdxs([]);
        setCurrentIdx(pickNextIndex(questions, [], initialAbility) ?? 0);
        setAnswers(new Array(questions.length).fill(null));
        setShowExplanation(false); setStartTime(Math.floor(Date.now() / 1000));
        setPhase('quiz');
      }}
    />
  );

  return (
    <>
      {vaultEnabled && (
        <div className="max-w-2xl mx-auto mb-3 flex items-center gap-2">
          <Badge color="violet">
            <ShieldCheck className="w-3 h-3 mr-1 inline" /> Vault Mode Active
          </Badge>
          <video ref={vault.videoRef} muted playsInline className="w-0 h-0 opacity-0 absolute" />
        </div>
      )}
      <QuestionCard
        question={questions[currentIdx]}
        questionNum={answeredIdxs.length + 1}
        total={questions.length}
        selected={answers[currentIdx]}
        onSelect={selectAnswer}
        showAnswer={showExplanation}
      />
    </>
  );
}
