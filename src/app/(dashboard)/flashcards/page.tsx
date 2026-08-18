'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Cpu, RotateCcw, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Button, Card, Badge, SectionHeader, EmptyState, Input, Textarea, Skeleton } from '@/components/ui';
import { useUserStore } from '@/lib/stores';
import { XP_REWARDS, sm2, randomId, cn } from '@/lib/utils';
import { authFetch } from '@/lib/api-client';
import { createClient } from '@/lib/supabase';
import type { Flashcard, SRSGrade } from '@/types';
import toast from 'react-hot-toast';

const SEED_CARDS: Flashcard[] = [
  { id: '1', user_id: '', front: 'What is the time complexity of Binary Search?', back: 'O(log n) — it halves the search space with each step, like splitting a phone book in half.', subject: 'DSA', deck: 'Algorithms', ease_factor: 2.5, interval: 1, repetitions: 0, next_review: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: '2', user_id: '', front: 'Explain the ACID properties in databases.', back: 'Atomicity (all-or-nothing), Consistency (valid state always), Isolation (transactions independent), Durability (committed = permanent).', subject: 'DBMS', deck: 'Database', ease_factor: 2.5, interval: 1, repetitions: 0, next_review: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: '3', user_id: '', front: 'What is Opportunity Cost?', back: 'The value of the next-best alternative forgone when making a decision. Core concept in Economics and management decisions.', subject: 'Economics', deck: 'Management', ease_factor: 2.5, interval: 1, repetitions: 0, next_review: new Date().toISOString(), created_at: new Date().toISOString() },
];

// ─── Flip Card ─────────────────────────────────────────────
function FlipCard({ card, flipped, onClick }: { card: Flashcard; flipped: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer select-none"
      style={{ perspective: '1000px', minHeight: 200 }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformStyle: 'preserve-3d', position: 'relative', minHeight: 200 }}
      >
        {/* Front */}
        <div style={{ backfaceVisibility: 'hidden' }}
          className="absolute inset-0 rounded-2xl border border-card-border bg-gradient-to-br from-card to-navy-2 p-6 flex flex-col justify-between shadow-card-glow">
          <div>
            <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-orange mb-3">
              QUESTION — TAP TO REVEAL
            </p>
            <p className="text-base font-semibold text-text-primary leading-relaxed">{card.front}</p>
          </div>
          {card.subject && <Badge color="grey" className="self-start">{card.subject}</Badge>}
        </div>

        {/* Back */}
        <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          className="absolute inset-0 rounded-2xl border border-teal/30 bg-gradient-to-br from-teal/5 to-card p-6 flex flex-col justify-between shadow-[0_0_30px_rgba(0,217,192,0.1)]">
          <div>
            <p className="text-[10px] font-mono font-bold tracking-widest uppercase text-teal mb-3">
              ANSWER — TAP TO FLIP BACK
            </p>
            <p className="text-sm text-text-primary leading-relaxed">{card.back}</p>
          </div>
          {card.subject && <Badge color="teal" className="self-start">{card.subject}</Badge>}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Add Card Form ─────────────────────────────────────────
function AddCardForm({ onAdd, onCancel }: {
  onAdd: (front: string, back: string, subject: string) => void;
  onCancel: () => void;
}) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [subject, setSubject] = useState('');

  return (
    <Card className="space-y-4">
      <h3 className="font-display font-bold text-base text-text-primary">Add New Card</h3>
      <Textarea
        label="Front (Question)"
        value={front}
        onChange={e => setFront(e.target.value)}
        placeholder="Enter the question or concept..."
        rows={3}
      />
      <Textarea
        label="Back (Answer)"
        value={back}
        onChange={e => setBack(e.target.value)}
        placeholder="Enter the answer or explanation..."
        rows={3}
      />
      <Input
        label="Subject (optional)"
        value={subject}
        onChange={e => setSubject(e.target.value)}
        placeholder="e.g. Data Structures, Economics"
      />
      <div className="flex gap-2">
        <Button variant="secondary" full onClick={onCancel}>Cancel</Button>
        <Button full onClick={() => { if (front.trim() && back.trim()) onAdd(front, back, subject); }}
          disabled={!front.trim() || !back.trim()}>
          Add Card +{XP_REWARDS.flashcard_added} XP
        </Button>
      </div>
    </Card>
  );
}

// ─── AI Generate Form ──────────────────────────────────────
function AIGenerateForm({ onGenerate, onCancel }: {
  onGenerate: (topic: string) => void;
  onCancel: () => void;
}) {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    await onGenerate(topic);
    setLoading(false);
  };

  return (
    <Card glow="violet" className="space-y-4">
      <div>
        <h3 className="font-display font-bold text-base text-text-primary">🤖 Generate with AI</h3>
        <p className="text-xs text-text-tertiary mt-1">I'll create 5 high-quality flashcards on any topic instantly</p>
      </div>
      <Input
        label="Topic"
        value={topic}
        onChange={e => setTopic(e.target.value)}
        placeholder="e.g. Sorting algorithms, Marketing mix 4P, Kirchhoff's laws"
        onKeyDown={e => e.key === 'Enter' && handleGenerate()}
      />
      <div className="flex gap-2">
        <Button variant="secondary" full onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button variant="violet" full onClick={handleGenerate}
          loading={loading} disabled={!topic.trim()}>
          Generate 5 Cards +{XP_REWARDS.quiz_completed} XP
        </Button>
      </div>
    </Card>
  );
}

// ─── Main Flashcards Page ──────────────────────────────────
export default function FlashcardsPage() {
  const { user, addXP } = useUserStore();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'review' | 'add' | 'generate' | 'done'>('review');
  const [grading, setGrading] = useState(false);
  const [dbLoaded, setDbLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const db = createClient();
    if (!db) { setCards(SEED_CARDS); setDbLoaded(true); return; }
    db.from('flashcards')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data?.length) {
          setCards(data.map((r: any) => ({
            id: r.id, user_id: r.user_id, front: r.front, back: r.back,
            subject: r.subject, deck: r.deck, ease_factor: Number(r.ease_factor),
            interval: r.interval, repetitions: r.repetitions,
            next_review: r.next_review, last_reviewed: r.last_reviewed,
            created_at: r.created_at,
          })));
        } else {
          setCards(SEED_CARDS);
        }
        setDbLoaded(true);
      });
  }, [user]);

  const dueCards = cards.filter(c => !known.has(c.id));
  const card = dueCards[idx];

  const markCard = useCallback(async (grade: SRSGrade) => {
    if (!card || grading) return;
    setGrading(true);

    const passed = grade >= 3;
    if (passed) {
      const newKnown = new Set(known);
      newKnown.add(card.id);
      setKnown(newKnown);
      await addXP('flashcard_known');
      toast.success(`✓ Got it! +${XP_REWARDS.flashcard_known} XP`, { duration: 1500 });

      if (idx >= dueCards.length - 1 || newKnown.size >= cards.length) {
        setView('done');
      } else {
        setIdx(i => Math.min(i, dueCards.length - 2));
      }
    } else {
      const updatedCard = { ...card, ...sm2(card, grade) };
      setCards(prev => prev.map(c => c.id === card.id ? updatedCard : c));
      setIdx(i => (i + 1) % dueCards.length);
    }

    const srsUpdate = sm2(card, grade);
    const db = createClient();
    if (db && user && card.user_id) {
      db.from('flashcards').update({
        ease_factor: srsUpdate.ease_factor,
        interval: srsUpdate.interval,
        repetitions: srsUpdate.repetitions,
        next_review: srsUpdate.next_review,
        last_reviewed: new Date().toISOString(),
      }).eq('id', card.id).then(() => {});

      db.from('flashcard_reviews').insert({
        flashcard_id: card.id,
        user_id: user.id,
        grade: String(grade),
      }).then(() => {});
    }

    setFlipped(false);
    setGrading(false);
  }, [card, grading, known, dueCards, idx, cards, addXP, user]);

  const addManualCard = async (front: string, back: string, subject: string) => {
    const db = createClient();
    if (db && user) {
      const { data: row } = await db.from('flashcards').insert({
        user_id: user.id, front, back, subject: subject || null,
      }).select().single();
      if (row) {
        setCards(prev => [...prev, {
          id: row.id, user_id: row.user_id, front: row.front, back: row.back,
          subject: row.subject, ease_factor: Number(row.ease_factor),
          interval: row.interval, repetitions: row.repetitions,
          next_review: row.next_review, created_at: row.created_at,
        }]);
        setView('review');
        addXP('flashcard_added');
        toast.success(`Card added! +${XP_REWARDS.flashcard_added} XP`);
        return;
      }
    }
    const newCard: Flashcard = {
      id: randomId(), user_id: user?.id || '',
      front, back, subject: subject || undefined,
      ease_factor: 2.5, interval: 1, repetitions: 0,
      next_review: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    setCards(prev => [...prev, newCard]);
    setView('review');
    addXP('flashcard_added');
    toast.success(`Card added! +${XP_REWARDS.flashcard_added} XP`);
  };

  const generateCards = useCallback(async (topic: string) => {
    try {
      const res = await authFetch('/api/ai/flashcards', { topic, major: user?.major, language: user?.language, count: 5 });
      const data = await res.json();
      if (data.cards?.length) {
        const db = createClient();
        if (db && user) {
          const rows = data.cards.map((c: any) => ({
            user_id: user.id, front: c.front, back: c.back, subject: c.subject || topic,
          }));
          const { data: inserted } = await db.from('flashcards').insert(rows).select();
          if (inserted?.length) {
            setCards(prev => [...prev, ...inserted.map((r: any) => ({
              id: r.id, user_id: r.user_id, front: r.front, back: r.back,
              subject: r.subject, ease_factor: Number(r.ease_factor),
              interval: r.interval, repetitions: r.repetitions,
              next_review: r.next_review, created_at: r.created_at,
            }))]);
          } else {
            setCards(prev => [...prev, ...data.cards.map((c: any) => ({ ...c, id: randomId(), user_id: user.id }))]);
          }
        } else {
          setCards(prev => [...prev, ...data.cards.map((c: any) => ({ ...c, id: randomId(), user_id: user?.id || '' }))]);
        }
        setView('review');
        addXP('quiz_completed');
        toast.success(`${data.cards.length} cards added! +${XP_REWARDS.quiz_completed} XP`);
      }
    } catch {
      toast.error('Failed to generate cards. Please try again.');
    }
  }, [user, addXP]);

  const deleteCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
    if (idx >= dueCards.length - 1) setIdx(0);
    const db = createClient();
    if (db) db.from('flashcards').update({ is_active: false }).eq('id', id).then(() => {});
    toast.success('Card deleted');
  };

  if (!dbLoaded) return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-3 gap-2.5">
        <Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" />
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <SectionHeader
            eyebrow="Spaced Repetition · SM-2"
            title={<>Study smarter, <span className="text-gradient-teal">remember longer</span></>}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Cpu className="w-4 h-4" />}
            onClick={() => setView('generate')}>AI Generate</Button>
          <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4" />}
            onClick={() => setView('add')}>Add Card</Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="stat-card">
          <div className="font-display font-bold text-lg text-orange">{cards.length}</div>
          <div className="text-xs text-text-secondary">Total Cards</div>
        </div>
        <div className="stat-card">
          <div className="font-display font-bold text-lg text-mint">{known.size}</div>
          <div className="text-xs text-text-secondary">Known</div>
        </div>
        <div className="stat-card">
          <div className="font-display font-bold text-lg text-amber">{dueCards.length - idx}</div>
          <div className="text-xs text-text-secondary">Remaining</div>
        </div>
      </div>

      {/* Forms */}
      <AnimatePresence mode="wait">
        {view === 'add' && (
          <motion.div key="add" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <AddCardForm onAdd={addManualCard} onCancel={() => setView('review')} />
          </motion.div>
        )}
        {view === 'generate' && (
          <motion.div key="gen" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <AIGenerateForm onGenerate={generateCards} onCancel={() => setView('review')} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review */}
      {view === 'review' && dueCards.length === 0 && (
        <EmptyState icon="🃏" title="No cards yet"
          description="Add cards manually or generate them with AI"
          action={<Button onClick={() => setView('generate')} icon={<Cpu className="w-4 h-4" />}>Generate with AI</Button>}
        />
      )}

      {view === 'review' && card && (
        <>
          {/* Progress */}
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <span className="font-mono">{idx + 1} of {dueCards.length}</span>
            <div className="flex-1 h-1 rounded-full bg-card-light overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-orange to-amber transition-all duration-500"
                style={{ width: `${((idx) / dueCards.length) * 100}%` }} />
            </div>
          </div>

          {/* Card */}
          <FlipCard card={card} flipped={flipped} onClick={() => setFlipped(f => !f)} />

          {/* Navigation + grading */}
          <div className="space-y-3">
            {!flipped ? (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" icon={<ChevronLeft className="w-4 h-4" />}
                  onClick={() => { setIdx(i => Math.max(0, i-1)); setFlipped(false); }}>
                  Prev
                </Button>
                <Button full variant="secondary" onClick={() => setFlipped(true)}>
                  Tap to reveal answer
                </Button>
                <Button variant="secondary" size="sm" iconRight={<ChevronRight className="w-4 h-4" />}
                  onClick={() => { setIdx(i => Math.min(dueCards.length-1, i+1)); setFlipped(false); }}>
                  Skip
                </Button>
              </div>
            ) : (
              <>
                <p className="text-center text-xs text-text-tertiary font-mono uppercase tracking-widest">
                  How well did you know this?
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button onClick={() => markCard(1)}
                    disabled={grading}
                    className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-danger/30 bg-danger/5 text-danger text-sm font-bold hover:bg-danger/10 transition-all disabled:opacity-50">
                    😅 Still Learning
                  </button>
                  <button onClick={() => markCard(3)}
                    disabled={grading}
                    className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-mint/30 bg-mint/5 text-mint text-sm font-bold hover:bg-mint/10 transition-all disabled:opacity-50">
                    ✓ Got It +{XP_REWARDS.flashcard_known} XP
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 px-8">
                  <button onClick={() => markCard(0)} disabled={grading}
                    className="text-xs text-danger/60 hover:text-danger transition-colors py-1 text-center">
                    Blackout (no idea)
                  </button>
                  <button onClick={() => markCard(5)} disabled={grading}
                    className="text-xs text-mint/60 hover:text-mint transition-colors py-1 text-center">
                    Perfect recall
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Delete */}
          <div className="flex justify-end">
            <button onClick={() => deleteCard(card.id)}
              className="text-xs text-text-tertiary hover:text-danger flex items-center gap-1 transition-colors">
              <Trash2 className="w-3 h-3" /> Delete card
            </button>
          </div>
        </>
      )}

      {/* Done state */}
      {view === 'done' && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Card glow="teal" className="text-center py-10">
            <div className="text-5xl mb-4 animate-float">🎉</div>
            <h2 className="font-display font-bold text-2xl text-text-primary mb-2">Session Complete!</h2>
            <p className="text-text-secondary mb-6">
              You reviewed {known.size} cards this session. Come back tomorrow for the next batch.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" icon={<RotateCcw className="w-4 h-4" />}
                onClick={() => { setKnown(new Set()); setIdx(0); setFlipped(false); setView('review'); }}>
                Start Over
              </Button>
              <Button icon={<Plus className="w-4 h-4" />} onClick={() => setView('generate')}>
                Add More Cards
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
