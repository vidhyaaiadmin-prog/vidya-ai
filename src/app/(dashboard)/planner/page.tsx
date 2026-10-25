'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, BookOpen, Target, RefreshCw, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button, Card, Badge, SectionHeader, Input } from '@/components/ui';
import { useUserStore } from '@/lib/stores';
import { XP_REWARDS, daysUntil, cn } from '@/lib/utils';
import { authFetch } from '@/lib/api-client';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

const HOURS_OPTIONS = ['2', '3', '4', '5', '6', '8'];

const PRESET_EXAMS = [
  { name: 'GATE 2027', date: '2027-02-07', subjects: 'Engineering Mathematics, General Aptitude, Core Subject (CSE/ECE/ME/CE)' },
  { name: 'CAT 2026', date: '2026-11-29', subjects: 'Quantitative Aptitude, Verbal Ability & Reading Comprehension, Data Interpretation & Logical Reasoning' },
  { name: 'University Semester Exam', date: '', subjects: '' },
];

export default function PlannerPage() {
  const { user, addXP } = useUserStore();
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [subjects, setSubjects] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('4');
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandTip, setExpandTip] = useState(false);

  useEffect(() => {
    if (!user) return;
    const db = createClient();
    if (!db) return;
    db.from('study_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) {
          setPlan(data[0].plan_text);
          setExamName(data[0].exam_name || '');
          setExamDate(data[0].exam_date || '');
          setSubjects((data[0].subjects as string[])?.join(', ') || '');
          setHoursPerDay(String(data[0].hours_per_day || 4));
        }
      });
  }, [user]);

  const days = examDate ? daysUntil(examDate) : null;

  const generate = async () => {
    if (!examDate || !subjects.trim()) return;
    setLoading(true);
    try {
      const res = await authFetch('/api/ai/planner', { examDate, examName, subjects, hoursPerDay, major: user?.major, language: user?.language });
      const data = await res.json();
      if (data.plan) {
        setPlan(data.plan);
        await addXP('planner_created');
        toast.success(`Study plan created! +${XP_REWARDS.planner_created} XP`);

        const db = createClient();
        if (db && user) {
          await db.from('study_plans').insert({
            user_id: user.id,
            exam_name: examName || null,
            exam_date: examDate,
            subjects: subjects.split(',').map(s => s.trim()).filter(Boolean),
            hours_per_day: Number(hoursPerDay),
            plan_text: data.plan,
          });
        }
      } else {
        // Surface the real reason (e.g. "Invalid exam date") instead of a generic retry.
        toast.error(data.error || 'Could not generate plan. Try again.');
      }
    } catch {
      toast.error('Network error. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset: typeof PRESET_EXAMS[0]) => {
    setExamName(preset.name);
    if (preset.date) setExamDate(preset.date);
    if (preset.subjects) setSubjects(preset.subjects);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SectionHeader
        eyebrow="AI Study Planner"
        title={<>Exam-ready in <span className="text-gradient-orange">every subject.</span></>}
        subtitle="Tell me your exam date and subjects. I'll build a realistic, prioritised daily schedule."
      />

      {!plan ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Preset exams */}
          <div>
            <p className="text-xs font-mono text-text-tertiary uppercase tracking-widest mb-3">Quick presets</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_EXAMS.map(p => (
                <button key={p.name} onClick={() => applyPreset(p)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-card-light border border-card-border text-text-secondary hover:border-orange/40 hover:text-orange transition-all">
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <Card glow="orange">
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Exam Name"
                  value={examName}
                  onChange={e => setExamName(e.target.value)}
                  placeholder="e.g. GATE 2026, Semester V"
                  icon={<Target className="w-4 h-4" />}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-secondary tracking-wider uppercase">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={e => setExamDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-card-light border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-orange/50 focus:ring-2 focus:ring-orange/10 transition-all"
                  />
                </div>
              </div>

              {days !== null && days > 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl border',
                    days <= 7 ? 'bg-danger/5 border-danger/30' : days <= 30 ? 'bg-amber/5 border-amber/30' : 'bg-mint/5 border-mint/30',
                  )}>
                    <Clock className={cn('w-5 h-5', days <= 7 ? 'text-danger' : days <= 30 ? 'text-amber' : 'text-mint')} />
                    <span className="font-bold text-sm" style={{ color: days <= 7 ? 'var(--danger)' : days <= 30 ? 'var(--amber)' : 'var(--mint)' }}>
                      {days} days remaining
                    </span>
                    <span className="text-xs text-text-tertiary ml-auto">
                      {days <= 7 ? '⚠️ Very soon!' : days <= 30 ? '📅 Plan carefully' : '✓ Good runway'}
                    </span>
                  </div>
                </motion.div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-secondary tracking-wider uppercase flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  Subjects / Topics to Cover
                </label>
                <textarea
                  value={subjects}
                  onChange={e => setSubjects(e.target.value)}
                  placeholder="e.g. Data Structures, DBMS, Computer Networks, Operating Systems, Software Engineering"
                  rows={3}
                  className="w-full bg-navy-2 border border-card-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none resize-none focus:border-orange/50 focus:ring-2 focus:ring-orange/10 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-secondary tracking-wider uppercase flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  Study Hours Per Day
                </label>
                <div className="flex gap-2">
                  {HOURS_OPTIONS.map(h => (
                    <button key={h} onClick={() => setHoursPerDay(h)}
                      className={cn(
                        'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all',
                        hoursPerDay === h
                          ? 'bg-orange text-white shadow-[0_0_20px_rgba(255,107,43,0.3)]'
                          : 'bg-card-light border border-card-border text-text-secondary hover:border-white/20',
                      )}>
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              <Button
                full size="lg"
                onClick={generate}
                loading={loading}
                disabled={!examDate || !subjects.trim()}
                icon={<Calendar className="w-5 h-5" />}
              >
                {loading ? 'Generating your plan…' : `Generate Study Plan  +${XP_REWARDS.planner_created} XP`}
              </Button>
            </div>
          </Card>

          {/* How it works */}
          <Card>
            <button
              className="w-full flex items-center justify-between text-left"
              onClick={() => setExpandTip(!expandTip)}
            >
              <span className="text-sm font-semibold text-text-primary">How the planner works</span>
              <ChevronDown className={cn('w-4 h-4 text-text-tertiary transition-transform', expandTip && 'rotate-180')} />
            </button>
            <AnimatePresence>
              {expandTip && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                  <div className="mt-4 space-y-2 text-xs text-text-secondary leading-relaxed">
                    {[
                      '📊 AI analyses your subjects and assigns time based on typical difficulty and mark weightage',
                      '📅 Creates a realistic week-by-week schedule leaving time for revision',
                      '🎯 Identifies high-priority topics that carry maximum marks in Indian exams',
                      '⚡ Adjusts automatically for short timelines — prioritises ruthlessly when you have fewer days',
                    ].map((tip, i) => <p key={i}>{tip}</p>)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-lg text-text-primary">{examName || 'Your Study Plan'}</h3>
              {days !== null && (
                <p className="text-sm text-text-secondary mt-0.5">{days} days remaining</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge color="orange">+{XP_REWARDS.planner_created} XP</Badge>
              <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => setPlan(null)}>
                Regenerate
              </Button>
            </div>
          </div>

          <Card glow="none">
            <div className="prose-ai">
              <ReactMarkdown>{plan}</ReactMarkdown>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="text-center !py-4">
              <div className="font-display font-bold text-2xl text-orange">{hoursPerDay}h</div>
              <div className="text-xs text-text-secondary mt-1">Per day</div>
            </Card>
            <Card className="text-center !py-4">
              <div className="font-display font-bold text-2xl text-violet">{days !== null ? `${days}d` : '—'}</div>
              <div className="text-xs text-text-secondary mt-1">Until exam</div>
            </Card>
          </div>

          <Button variant="secondary" full icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => {
              const db = createClient();
              if (db && user) db.from('study_plans').update({ is_active: false }).eq('user_id', user.id);
              setPlan(null);
            }}>
            Create New Plan
          </Button>
        </motion.div>
      )}
    </div>
  );
}
