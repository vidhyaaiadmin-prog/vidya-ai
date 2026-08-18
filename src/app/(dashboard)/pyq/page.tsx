'use client';
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BookMarked, Clock, Zap, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { Button, Card, Badge, SectionHeader, ProgressBar } from '@/components/ui';
import { useUserStore } from '@/lib/stores';
import { XP_REWARDS, cn } from '@/lib/utils';
import { authFetch } from '@/lib/api-client';
import toast from 'react-hot-toast';
import type { QuizQuestion, Difficulty } from '@/types';

const EXAMS = [
  { id: 'gate_cs',  name: 'GATE CS',       icon: '💻', color: '#7C3AED', desc: 'Computer Science & IT' },
  { id: 'gate_ec',  name: 'GATE ECE',       icon: '📡', color: '#00D9C0', desc: 'Electronics & Comm Engg' },
  { id: 'cat',      name: 'CAT',            icon: '📊', color: '#FF6B2B', desc: 'Management entrance' },
  { id: 'upsc',     name: 'UPSC Prelims',   icon: '🏛️', color: '#F59E0B', desc: 'Civil Services' },
  { id: 'ibps',     name: 'IBPS PO',        icon: '🏦', color: '#10B981', desc: 'Banking & Finance' },
  { id: 'ssc_cgl',  name: 'SSC CGL',        icon: '📋', color: '#60A5FA', desc: 'Staff Selection' },
];

const LABEL_MAP = ['A', 'B', 'C', 'D'];

export default function PYQPage() {
  const { user, addXP } = useUserStore();
  const [phase, setPhase] = useState<'select' | 'loading' | 'quiz' | 'result'>('select');
  const [selectedExam, setSelectedExam] = useState<typeof EXAMS[0] | null>(null);
  const [year, setYear] = useState('2024');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showExp, setShowExp] = useState(false);

  const YEARS = ['2024', '2023', '2022', '2021', '2020'];

  const startPaper = async (exam: typeof EXAMS[0]) => {
    setSelectedExam(exam);
    setPhase('loading');
    try {
      const res = await authFetch('/api/ai/quiz', {
        subject: `${exam.name} ${year} Previous Year Questions — use typical exam style, topic distribution, and difficulty level of actual ${exam.name} papers`,
        difficulty: 'hard' as Difficulty,
        major: user?.major,
        language: user?.language,
        count: 10,
      });
      const data = await res.json();
      if (data.questions?.length) {
        setQuestions(data.questions);
        setCurrentIdx(0);
        setAnswers(new Array(data.questions.length).fill(null));
        setShowExp(false);
        setPhase('quiz');
      } else {
        toast.error('Could not load paper. Please try again.');
        setPhase('select');
      }
    } catch {
      toast.error('Network error. Please retry.');
      setPhase('select');
    }
  };

  const selectAnswer = useCallback(async (idx: number) => {
    if (answers[currentIdx] !== null) return;
    const newAnswers = [...answers];
    newAnswers[currentIdx] = idx;
    setAnswers(newAnswers);
    setShowExp(true);

    const correct = idx === questions[currentIdx].answer;
    await addXP(correct ? 'pyq_correct' : 'quiz_wrong');
    toast.success(
      `${correct ? '✓' : '✗'} +${correct ? XP_REWARDS.pyq_correct : XP_REWARDS.quiz_wrong} XP`,
      { duration: 1500 },
    );

    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(i => i + 1);
        setShowExp(false);
      } else {
        setPhase('result');
      }
    }, 2200);
  }, [answers, currentIdx, questions, addXP]);

  const score = answers.filter((a, i) => a === questions[i]?.answer).length;
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const q = questions[currentIdx];

  if (phase === 'select') return (
    <div className="max-w-2xl mx-auto space-y-6">
      <SectionHeader
        eyebrow="Previous Year Questions"
        title={<>Crack the exam with <span className="text-gradient-violet">real PYQs.</span></>}
        subtitle="AI-generated questions in the exact style and difficulty of actual competitive exam papers."
      />

      <Card>
        <p className="text-xs font-mono font-bold tracking-widest uppercase text-text-secondary mb-3">Year</p>
        <div className="flex gap-2">
          {YEARS.map(y => (
            <button key={y} onClick={() => setYear(y)}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-bold transition-all',
                year === y
                  ? 'bg-violet text-white shadow-violet-glow'
                  : 'bg-card-light border border-card-border text-text-secondary hover:border-white/20',
              )}>
              {y}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {EXAMS.map(exam => (
          <motion.button key={exam.id} whileHover={{ y: -2 }} onClick={() => startPaper(exam)}
            className="flex flex-col items-start gap-3 p-4 rounded-xl border border-card-border bg-card hover:border-white/20 text-left transition-all group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: `${exam.color}18`, border: `1px solid ${exam.color}30` }}>
              {exam.icon}
            </div>
            <div>
              <p className="font-display font-bold text-sm text-text-primary group-hover:text-white transition-colors">
                {exam.name}
              </p>
              <p className="text-[10px] text-text-tertiary mt-0.5">{exam.desc}</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono" style={{ color: exam.color }}>
              10 Q · {year} Style <ChevronRight className="w-3 h-3 ml-auto" />
            </div>
          </motion.button>
        ))}
      </div>

      <Card className="!py-3 !px-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet/10 flex items-center justify-center">
          <BookMarked className="w-4 h-4 text-violet-light" />
        </div>
        <div className="text-xs text-text-secondary leading-relaxed">
          Questions are AI-generated in the style of actual exam papers. For authentic PYQs, refer to official GATE, CAT, and UPSC websites.
        </div>
      </Card>
    </div>
  );

  if (phase === 'loading') return (
    <div className="flex flex-col items-center justify-center py-28 gap-4">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl animate-pulse"
        style={{ background: `${selectedExam?.color}18` }}>
        {selectedExam?.icon}
      </div>
      <div className="text-center">
        <p className="font-display font-bold text-lg text-text-primary mb-1">Loading {selectedExam?.name} {year}</p>
        <p className="text-sm text-text-tertiary">Generating 10 PYQ-style questions…</p>
      </div>
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full typing-dot" style={{ background: selectedExam?.color, animationDelay: `${i*0.2}s` }} />
        ))}
      </div>
    </div>
  );

  if (phase === 'result') return (
    <div className="max-w-2xl mx-auto space-y-5">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Card glow={pct >= 60 ? 'teal' : 'none'} className="text-center !py-8">
          <div className="text-5xl mb-3">{pct >= 80 ? '🏆' : pct >= 60 ? '📚' : '💪'}</div>
          <p className="text-xs font-mono text-text-tertiary uppercase tracking-widest mb-1">
            {selectedExam?.name} {year} · PYQ Mode
          </p>
          <div className="font-display font-bold text-4xl text-text-primary my-2">{score}/{questions.length}</div>
          <div className="flex items-center justify-center gap-2">
            <Badge color={pct >= 60 ? 'teal' : 'amber'}>{pct}% Score</Badge>
            <Badge color="orange">+{score * XP_REWARDS.pyq_correct + (questions.length - score) * XP_REWARDS.quiz_wrong} XP</Badge>
          </div>
          <ProgressBar value={pct} height={6} className="mt-4" color={pct >= 60 ? 'var(--teal)' : 'var(--amber)'} />
        </Card>
      </motion.div>

      <div className="space-y-2.5">
        {questions.map((q, i) => {
          const correct = answers[i] === q.answer;
          return (
            <Card key={i} className={cn('!p-4', correct ? 'border-l-2 border-l-mint' : 'border-l-2 border-l-danger')}>
              <div className="flex items-start gap-3">
                <div className={cn('mt-0.5 flex-shrink-0', correct ? 'text-mint' : 'text-danger')}>
                  {correct ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-text-tertiary mb-1">Q{i + 1}</p>
                  <p className="text-sm text-text-primary font-medium mb-2 leading-snug">{q.q}</p>
                  <p className="text-xs text-mint">✓ {q.options[q.answer]}</p>
                  {!correct && answers[i] !== null && (
                    <p className="text-xs text-danger mt-0.5">✗ Your answer: {q.options[answers[i]!]}</p>
                  )}
                  <p className="text-xs text-text-tertiary mt-2 leading-relaxed">{q.explanation}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" full onClick={() => setPhase('select')}>Change Exam</Button>
        <Button full onClick={() => { if (selectedExam) startPaper(selectedExam); }}>Try Again</Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ background: `${selectedExam?.color}18` }}>
            {selectedExam?.icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{selectedExam?.name} {year}</p>
            <p className="text-[10px] text-text-tertiary">Q{currentIdx + 1} of {questions.length}</p>
          </div>
        </div>
        <Badge color="violet" className="font-mono">PYQ Mode</Badge>
      </div>

      <div className="flex items-center gap-3">
        <ProgressBar value={((currentIdx) / questions.length) * 100} className="flex-1" />
        <span className="text-xs font-mono text-text-tertiary flex-shrink-0">{currentIdx}/{questions.length}</span>
      </div>

      <Card className="!p-6">
        <Badge color="grey" className="mb-4">Question {currentIdx + 1}</Badge>
        <p className="text-base font-semibold text-text-primary leading-relaxed">{q?.q}</p>
      </Card>

      <div className="space-y-2.5">
        {q?.options.map((opt, i) => {
          const isSelected = answers[currentIdx] === i;
          const isCorrect = i === q.answer;
          return (
            <motion.button key={i} whileHover={!showExp ? { x: 3 } : {}}
              onClick={() => selectAnswer(i)} disabled={showExp}
              className={cn('quiz-option w-full disabled:cursor-default',
                showExp && isCorrect ? 'correct' : '',
                showExp && isSelected && !isCorrect ? 'wrong' : '',
              )}>
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all',
                showExp && isCorrect ? 'bg-mint text-white' : '',
                showExp && isSelected && !isCorrect ? 'bg-danger text-white' : '',
                !showExp ? 'bg-card-light text-text-secondary' : '',
              )}>
                {showExp && isCorrect ? <CheckCircle className="w-4 h-4" /> :
                 showExp && isSelected ? <XCircle className="w-4 h-4" /> :
                 LABEL_MAP[i]}
              </div>
              <span className="text-sm leading-snug">{opt}</span>
            </motion.button>
          );
        })}
      </div>

      {showExp && q && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={cn('!p-4',
            answers[currentIdx] === q.answer ? 'border-mint/30 bg-mint/5' : 'border-amber/30 bg-amber/5',
          )}>
            <p className={cn('text-xs font-mono font-bold uppercase tracking-widest mb-2',
              answers[currentIdx] === q.answer ? 'text-mint' : 'text-amber',
            )}>
              {answers[currentIdx] === q.answer ? '✓ Correct!' : '✗ Incorrect'}
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">{q.explanation}</p>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
