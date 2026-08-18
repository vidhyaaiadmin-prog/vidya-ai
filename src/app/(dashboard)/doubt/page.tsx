'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, RefreshCw, Lightbulb, BookOpen, Sparkles, Mic } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button, Card, Badge, Input, SectionHeader, LoadingDots, EmptyState } from '@/components/ui';
import { useUserStore } from '@/lib/stores';
import { XP_REWARDS, cn } from '@/lib/utils';
import { authFetch } from '@/lib/api-client';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface Message { role: 'user' | 'assistant'; content: string; ts: number; }

const SUBJECT_SUGGESTIONS = [
  'Data Structures & Algorithms', 'Database Management', 'Operating Systems',
  'Engineering Mathematics', 'Marketing Management', 'Financial Accounting',
  'Microeconomics', 'Business Law', 'Digital Electronics', 'Thermodynamics',
];

// ─── Message Bubble ────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isAI = msg.role === 'assistant';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn('flex', isAI ? 'justify-start' : 'justify-end')}
    >
      {isAI && (
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange to-violet flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={isAI ? 'msg-ai max-w-[85%]' : 'msg-user max-w-[80%]'}>
        {isAI && (
          <p className="text-[10px] font-mono font-bold text-orange mb-2 tracking-widest uppercase">
            Vidya AI
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
    </motion.div>
  );
}

// ─── Setup Screen ──────────────────────────────────────────
function SetupScreen({ onStart }: { onStart: (topic: string) => void }) {
  const [topic, setTopic] = useState('');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <SectionHeader
        eyebrow="Socratic AI"
        title={<>Solve doubts, <span className="text-gradient-orange">build understanding</span></>}
        subtitle="I won't just give you the answer. I'll ask guiding questions so you actually learn it — and never forget it."
      />

      {/* How it works */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: '🤔', step: '1', title: 'Ask your doubt', desc: 'Any concept, any subject' },
          { icon: '💭', step: '2', title: 'I ask back', desc: 'Guiding questions that lead you' },
          { icon: '💡', step: '3', title: 'You get it', desc: 'Real understanding, not just answers' },
        ].map(s => (
          <Card key={s.step} className="text-center !py-4">
            <div className="text-2xl mb-2">{s.icon}</div>
            <Badge color="orange" className="mb-2">{s.step}</Badge>
            <p className="text-xs font-semibold text-text-primary mb-1">{s.title}</p>
            <p className="text-[10px] text-text-tertiary leading-relaxed">{s.desc}</p>
          </Card>
        ))}
      </div>

      <Card glow="violet">
        <label className="text-xs font-mono font-bold tracking-widest uppercase text-violet-light mb-3 block">
          What's your doubt?
        </label>
        <textarea
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder={'e.g. "I don\'t understand how quicksort works" or "What\'s the difference between NPV and IRR?"'}
          rows={4}
          className="w-full bg-navy-2 border border-card-border rounded-xl p-3.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none resize-none focus:border-violet/50 focus:ring-2 focus:ring-violet/10 transition-all"
        />
        <div className="mt-3">
          <Button full onClick={() => topic.trim() && onStart(topic)} disabled={!topic.trim()} size="lg">
            <Lightbulb className="w-4 h-4" />
            Start Solving · +{XP_REWARDS.doubt_started} XP
          </Button>
        </div>
      </Card>

      {/* Subject quick picks */}
      <div>
        <p className="text-xs font-mono text-text-tertiary uppercase tracking-widest mb-3">Popular subjects</p>
        <div className="flex flex-wrap gap-2">
          {SUBJECT_SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => setTopic(`I need help understanding a concept in ${s}`)}
              className="text-xs px-3 py-1.5 rounded-lg bg-card-light border border-card-border text-text-secondary hover:border-white/20 hover:text-text-primary transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function DoubtPage() {
  const { user, progress, addXP } = useUserStore();
  const [phase, setPhase] = useState<'setup' | 'chat'>('setup');
  const [topic, setTopic] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error('Voice input not supported in this browser.'); return; }
    const LOCALES: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN', mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN' };
    const recognition = new SR();
    recognition.lang = LOCALES[user?.language || 'en'] || 'en-IN';
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (e: any) => setInput(prev => (prev ? prev + ' ' : '') + e.results[0][0].transcript);
    recognition.start();
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!user) return;
    const db = createClient();
    if (!db) return;
    db.from('doubt_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) {
          const s = data[0];
          setSessionId(s.id);
          setTopic(s.topic);
          setMessages((s.messages as any[]).map(m => ({ role: m.role, content: m.content, ts: Date.now() })));
          setPhase('chat');
        }
      });
  }, [user]);

  const startSession = useCallback(async (t: string) => {
    setTopic(t);
    setPhase('chat');
    setLoading(true);

    const openingMsg: Message = { role: 'user', content: `I have a doubt about: ${t}`, ts: Date.now() };
    setMessages([openingMsg]);

    try {
      const res = await authFetch('/api/ai/doubt', {
        messages: [{ role: 'user', content: openingMsg.content }],
        topic: t,
        major: user?.major,
        language: user?.language,
        isFirstMessage: true,
      });
      const data = await res.json();
      if (data.reply) {
        const allMsgs = [openingMsg, { role: 'assistant' as const, content: data.reply, ts: Date.now() }];
        setMessages(allMsgs);
        if (data.session_id) setSessionId(data.session_id);
        await addXP('doubt_started');
        toast.success(`+${XP_REWARDS.doubt_started} XP earned!`);

        const db = createClient();
        if (db && user) {
          const { data: row } = await db.from('doubt_sessions').insert({
            user_id: user.id,
            topic: t,
            messages: allMsgs.map(m => ({ role: m.role, content: m.content })),
            status: 'active',
            xp_earned: XP_REWARDS.doubt_started,
          }).select('id').single();
          if (row) setSessionId(row.id);
        }
      }
    } catch {
      toast.error('Failed to connect. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [user, addXP]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim(), ts: Date.now() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const res = await authFetch('/api/ai/doubt', {
        messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
        topic,
        major: user?.major,
        language: user?.language,
        sessionId,
      });
      const data = await res.json();
      if (data.reply) {
        const updatedMsgs = [...newMsgs, { role: 'assistant' as const, content: data.reply, ts: Date.now() }];
        setMessages(updatedMsgs);
        await addXP('doubt_reply');
        toast.success(`+${XP_REWARDS.doubt_reply} XP`, { duration: 1500 });

        const db = createClient();
        if (db && sessionId) {
          await db.from('doubt_sessions').update({
            messages: updatedMsgs.map(m => ({ role: m.role, content: m.content })),
          }).eq('id', sessionId);
        }
      }
    } catch {
      toast.error('Network error. Please retry.');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, messages, topic, user, sessionId, addXP]);

  const reset = () => {
    const db = createClient();
    if (db && sessionId) {
      db.from('doubt_sessions').update({ status: 'resolved' }).eq('id', sessionId);
    }
    setPhase('setup');
    setMessages([]);
    setTopic('');
    setInput('');
    setSessionId(null);
  };

  if (phase === 'setup') return <SetupScreen onStart={startSession} />;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)] max-w-3xl mx-auto">
      {/* Chat header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="min-w-0">
          <p className="text-[10px] font-mono text-text-tertiary uppercase tracking-widest mb-1">Active Doubt</p>
          <h2 className="font-display font-semibold text-sm text-text-primary truncate">{topic}</h2>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge color="violet">{messages.filter(m => m.role === 'user').length} replies</Badge>
          <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={reset}>
            New
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
        <AnimatePresence>
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange to-violet flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
            </div>
            <div className="msg-ai">
              <p className="text-[10px] font-mono font-bold text-orange mb-2 tracking-widest uppercase">Vidya AI</p>
              <LoadingDots />
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 pt-3 border-t border-card-border mt-3">
        <div className="flex gap-2.5">
          <div className="flex-1">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type your response or ask a follow-up…"
              className="w-full bg-card-light border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-orange/50 focus:ring-2 focus:ring-orange/10 transition-all"
            />
          </div>
          <button
            onClick={startVoice}
            type="button"
            className={cn(
              'flex-shrink-0 w-11 rounded-xl border flex items-center justify-center transition-all',
              listening ? 'bg-orange/10 border-orange/40 text-orange animate-pulse' : 'bg-card-light border-card-border text-text-tertiary hover:text-text-primary',
            )}
          >
            <Mic className="w-4 h-4" />
          </button>
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            size="md"
            className="flex-shrink-0"
            icon={<Send className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">Send</span>
          </Button>
        </div>
        <p className="text-[10px] text-text-tertiary mt-2 text-center">
          +{XP_REWARDS.doubt_reply} XP per response · Enter to send
        </p>
      </div>
    </div>
  );
}
