'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Award, RotateCcw, Sparkles, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button, Card, Badge, SectionHeader, LoadingDots } from '@/components/ui';
import { useUserStore } from '@/lib/stores';
import { XP_REWARDS, cn } from '@/lib/utils';
import { authFetch } from '@/lib/api-client';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface Message { role: 'user' | 'assistant'; content: string; }

const ROLES = [
  { id: 'sde', label: 'Software Engineer (SDE-1)', icon: '💻', color: '#7C3AED', domain: 'Technical' },
  { id: 'data', label: 'Data Analyst', icon: '📊', color: '#00D9C0', domain: 'Analytical' },
  { id: 'pm', label: 'Product Manager', icon: '🎯', color: '#FF6B2B', domain: 'Strategy' },
  { id: 'finance', label: 'Finance Analyst', icon: '📈', color: '#10B981', domain: 'Finance' },
  { id: 'marketing', label: 'Marketing Executive', icon: '📣', color: '#F59E0B', domain: 'Marketing' },
  { id: 'consult', label: 'Management Consultant', icon: '🏢', color: '#60A5FA', domain: 'Consulting' },
  { id: 'bizdev', label: 'Business Development', icon: '🤝', color: '#EF4444', domain: 'Sales' },
  { id: 'hr', label: 'HR Manager', icon: '👥', color: '#C084FC', domain: 'People' },
];

const TOTAL_QUESTIONS = 6;

function InterviewMessage({ msg }: { msg: Message }) {
  const isAI = msg.role === 'assistant';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={cn('flex gap-3', isAI ? 'justify-start' : 'justify-end')}
    >
      {isAI && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-orange flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
          <Award className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={isAI ? 'msg-ai max-w-[85%]' : 'msg-user max-w-[80%]'}>
        {isAI && (
          <p className="text-[10px] font-mono font-bold text-red-400 mb-2 tracking-widest uppercase">
            Interviewer
          </p>
        )}
        {isAI ? (
          <div className="prose-ai">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{msg.content}</p>
        )}
      </div>
      {!isAI && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet to-violet-light flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  );
}

export default function InterviewPage() {
  const { user, addXP } = useUserStore();
  const [phase, setPhase] = useState<'setup' | 'interview' | 'done'>('setup');
  const [selectedRole, setSelectedRole] = useState<typeof ROLES[0] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [sessionDbId, setSessionDbId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const startInterview = async (role: typeof ROLES[0]) => {
    setSelectedRole(role);
    setPhase('interview');
    setLoading(true);

    try {
      const initMsg: Message = { role: 'user', content: 'Please start the interview.' };
      const res = await authFetch('/api/ai/interview', { messages: [initMsg], role: role.label, major: user?.major, language: user?.language, turnCount: 0 });
      const data = await res.json();
      if (data.reply) {
        const allMsgs: Message[] = [{ role: 'assistant', content: data.reply }];
        setMessages(allMsgs);

        const db = createClient();
        if (db && user) {
          const { data: row } = await db.from('interview_sessions').insert({
            user_id: user.id,
            role: role.label,
            messages: allMsgs.map(m => ({ role: m.role, content: m.content })),
            turn_count: 0,
          }).select('id').single();
          if (row) setSessionDbId(row.id);
        }
      }
    } catch {
      toast.error('Failed to start interview. Please retry.');
      setPhase('setup');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  };

  const sendAnswer = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const newTurn = turnCount + 1;
    setTurnCount(newTurn);

    try {
      const res = await authFetch('/api/ai/interview', {
        messages: newMessages,
        role: selectedRole?.label,
        major: user?.major,
        language: user?.language,
        turnCount: newTurn,
      });
      const data = await res.json();
      if (data.reply) {
        const updatedMsgs = [...newMessages, { role: 'assistant' as const, content: data.reply }];
        setMessages(updatedMsgs);
        await addXP('interview_reply');
        toast.success(`+${XP_REWARDS.interview_reply} XP`, { duration: 1200 });

        const db = createClient();
        if (db && sessionDbId) {
          await db.from('interview_sessions').update({
            messages: updatedMsgs.map(m => ({ role: m.role, content: m.content })),
            turn_count: newTurn,
          }).eq('id', sessionDbId);
        }

        if (newTurn >= TOTAL_QUESTIONS) {
          await addXP('interview_done');
          toast.success(`Interview complete! +${XP_REWARDS.interview_done} XP`);
          const totalXP = XP_REWARDS.interview_done + (newTurn * XP_REWARDS.interview_reply);
          if (db && sessionDbId) {
            await db.from('interview_sessions').update({
              completed_at: new Date().toISOString(),
              xp_earned: totalXP,
              feedback: data.reply,
            }).eq('id', sessionDbId);
          }
          setTimeout(() => setPhase('done'), 3000);
        }
      }
    } catch {
      toast.error('Network error. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, turnCount, selectedRole, user, addXP, sessionDbId]);

  if (phase === 'setup') return (
    <div className="max-w-2xl mx-auto space-y-6">
      <SectionHeader
        eyebrow="AI Mock Interview"
        title={<>Practice until <span className="text-gradient-brand">it feels natural.</span></>}
        subtitle={`${TOTAL_QUESTIONS} questions — HR + technical. Feedback after every answer. Score out of 10 at the end.`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ROLES.map(role => (
          <button key={role.id} onClick={() => startInterview(role)}
            className="flex items-start gap-4 p-4 rounded-xl border border-card-border bg-card hover:border-white/20 text-left transition-all group hover:-translate-y-0.5 hover:shadow-lg">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: `${role.color}18`, border: `1px solid ${role.color}30` }}>
              {role.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary group-hover:text-white transition-colors">
                {role.label}
              </p>
              <Badge color="grey" className="mt-1.5">{role.domain}</Badge>
            </div>
          </button>
        ))}
      </div>

      <Card className="!p-4">
        <p className="text-xs font-mono font-bold tracking-widest uppercase text-orange mb-3">What to expect</p>
        <div className="space-y-2">
          {[
            `${TOTAL_QUESTIONS} questions total: 2 HR + 4 role-specific`,
            `Feedback after every single answer`,
            `Final score out of 10 with detailed improvement tips`,
            `+${XP_REWARDS.interview_reply} XP per answer · +${XP_REWARDS.interview_done} XP on completion`,
          ].map((tip, i) => (
            <div key={i} className="flex items-center gap-2.5 text-xs text-text-secondary">
              <div className="w-1.5 h-1.5 rounded-full bg-orange flex-shrink-0" />
              {tip}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  if (phase === 'done') return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4">
        <Card glow="orange" className="text-center !py-8">
          <div className="text-5xl mb-4 animate-float">🎤</div>
          <h2 className="font-display font-bold text-2xl text-text-primary mb-2">Interview Complete!</h2>
          <p className="text-text-secondary text-sm mb-5">
            Check the last message above for your detailed score and feedback.
          </p>
          <div className="flex justify-center gap-2 mb-5">
            <Badge color="orange">+{XP_REWARDS.interview_done + (turnCount * XP_REWARDS.interview_reply)} XP Total</Badge>
            <Badge color="grey">{turnCount} answers</Badge>
          </div>
          <Button icon={<RotateCcw className="w-4 h-4" />}
            onClick={() => { setPhase('setup'); setMessages([]); setTurnCount(0); setSessionDbId(null); }}>
            Practice Again
          </Button>
        </Card>

        {/* Show last AI message (feedback) */}
        {messages.slice(-1).map((m, i) => (
          <Card key={i}>
            <p className="text-[10px] font-mono font-bold text-red-400 mb-3 tracking-widest uppercase">
              Interview Feedback
            </p>
            <div className="prose-ai"><ReactMarkdown>{m.content}</ReactMarkdown></div>
          </Card>
        ))}
      </motion.div>
    </div>
  );

  // Interview phase
  const progressPct = (turnCount / TOTAL_QUESTIONS) * 100;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: `${selectedRole?.color}18` }}>
            {selectedRole?.icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{selectedRole?.label}</p>
            <p className="text-[10px] text-text-tertiary">Question {Math.min(turnCount + 1, TOTAL_QUESTIONS)} of {TOTAL_QUESTIONS}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-24 h-1.5 rounded-full bg-card-light overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, background: selectedRole?.color }} />
            </div>
            <span className="text-xs text-text-tertiary font-mono">{Math.round(progressPct)}%</span>
          </div>
          <Badge color="danger">Live</Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
        <AnimatePresence>
          {messages.map((msg, i) => <InterviewMessage key={i} msg={msg} />)}
        </AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-orange flex items-center justify-center flex-shrink-0">
              <Award className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="msg-ai"><LoadingDots /></div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pt-3 border-t border-card-border mt-3 space-y-2">
        <div className="flex gap-2.5">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAnswer(); } }}
            placeholder="Type your answer to the interviewer's question…"
            disabled={loading || turnCount >= TOTAL_QUESTIONS}
            className="flex-1 bg-card-light border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-red-400/50 focus:ring-2 focus:ring-red-400/10 transition-all disabled:opacity-50"
          />
          <Button onClick={sendAnswer} disabled={loading || !input.trim() || turnCount >= TOTAL_QUESTIONS}
            style={{ background: selectedRole?.color }} className="flex-shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-text-tertiary text-center">
          +{XP_REWARDS.interview_reply} XP per answer · Press Enter to send · {TOTAL_QUESTIONS - turnCount} questions remaining
        </p>
      </div>
    </div>
  );
}
