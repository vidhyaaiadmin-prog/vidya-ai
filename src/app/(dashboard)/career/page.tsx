'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Map, Briefcase, Code, TrendingUp, RefreshCw, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button, Card, Badge, SectionHeader, Input } from '@/components/ui';
import { useUserStore } from '@/lib/stores';
import { XP_REWARDS } from '@/lib/utils';
import { authFetch } from '@/lib/api-client';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

const GOAL_PRESETS = [
  { icon: '💻', label: 'Software Engineer (SDE)', sub: 'Product companies, startups' },
  { icon: '📊', label: 'Data Analyst / Scientist', sub: 'Analytics, ML roles' },
  { icon: '🎯', label: 'Product Manager', sub: 'Tech & consulting' },
  { icon: '📈', label: 'Investment Banking / Finance', sub: 'BFSI sector' },
  { icon: '🏢', label: 'Management Consultant', sub: 'Big 4, MBB firms' },
  { icon: '🚀', label: 'Found My Own Startup', sub: 'Entrepreneurship path' },
  { icon: '📋', label: 'Civil Services (IAS/IPS)', sub: 'UPSC track' },
  { icon: '🌍', label: 'Study Abroad (MS/MBA)', sub: 'International education' },
];

const SKILL_CHIPS = [
  'Python', 'Java', 'JavaScript', 'C++', 'SQL', 'Excel',
  'Data Analysis', 'Machine Learning', 'React', 'Node.js',
  'Communication', 'Leadership', 'MS Office', 'Accounting', 'Statistics',
];

export default function CareerPage() {
  const { user, addXP } = useUserStore();
  const [goal, setGoal] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [roadmap, setRoadmap] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'goal' | 'skills' | 'result'>('goal');

  useEffect(() => {
    if (!user) return;
    const db = createClient();
    if (!db) return;
    db.from('career_roadmaps')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) {
          setRoadmap(data[0].roadmap_text);
          setGoal(data[0].goal);
          setSelectedSkills((data[0].current_skills as string[]) || []);
          setStep('result');
        }
      });
  }, [user]);

  const toggleSkill = (s: string) =>
    setSelectedSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const generate = async () => {
    const finalGoal = customGoal || goal;
    if (!finalGoal) return;
    setLoading(true);
    try {
      const res = await authFetch('/api/ai/career', {
        goal: finalGoal,
        currentSkills: selectedSkills.join(', '),
        major: user?.major,
        language: user?.language,
      });
      const data = await res.json();
      if (data.roadmap) {
        setRoadmap(data.roadmap);
        setStep('result');
        await addXP('career_mapped');
        toast.success(`Career roadmap ready! +${XP_REWARDS.career_mapped} XP`);

        const db = createClient();
        if (db && user) {
          await db.from('career_roadmaps').insert({
            user_id: user.id,
            goal: finalGoal,
            current_skills: selectedSkills,
            roadmap_text: data.roadmap,
          });
        }
      } else {
        toast.error('Could not generate roadmap. Please try again.');
      }
    } catch {
      toast.error('Network error. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setRoadmap(null); setGoal(''); setCustomGoal('');
    setSelectedSkills([]); setStep('goal');
  };

  if (step === 'result' && roadmap) return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono text-orange uppercase tracking-widest mb-1">Your Career Roadmap</p>
          <h2 className="font-display font-bold text-xl text-text-primary">{customGoal || goal}</h2>
          <p className="text-sm text-text-secondary mt-0.5">{user?.major}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color="orange">+{XP_REWARDS.career_mapped} XP</Badge>
          <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={reset}>
            New Goal
          </Button>
        </div>
      </div>

      {selectedSkills.length > 0 && (
        <Card className="!py-3 !px-4">
          <p className="text-xs text-text-tertiary mb-2">Current Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {selectedSkills.map(s => <Badge key={s} color="grey">{s}</Badge>)}
          </div>
        </Card>
      )}

      <Card>
        <div className="prose-ai">
          <ReactMarkdown>{roadmap}</ReactMarkdown>
        </div>
      </Card>

      <Button variant="secondary" full icon={<RefreshCw className="w-4 h-4" />} onClick={reset}>
        Explore a Different Goal
      </Button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <SectionHeader
        eyebrow="Career GPS"
        title={<>Map your path to <span className="text-gradient-orange">your dream role.</span></>}
        subtitle="Tell me where you want to go. I'll give you the exact skills, resources, and timeline to get there."
      />

      {/* Step 1: Goal */}
      {step === 'goal' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <Card glow="none">
            <p className="text-xs font-mono font-bold tracking-widest uppercase text-text-secondary mb-4">
              What's your career goal?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
              {GOAL_PRESETS.map(g => (
                <button key={g.label} onClick={() => setGoal(g.label)}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    goal === g.label
                      ? 'bg-orange/10 border-orange/40 text-text-primary'
                      : 'bg-card-light border-card-border text-text-secondary hover:border-white/20'
                  }`}>
                  <span className="text-xl flex-shrink-0 mt-0.5">{g.icon}</span>
                  <div>
                    <p className="text-xs font-semibold leading-snug">{g.label}</p>
                    <p className="text-[10px] text-text-tertiary mt-0.5">{g.sub}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-text-tertiary mb-3">
              <div className="flex-1 h-px bg-card-border" />
              <span>or type your own</span>
              <div className="flex-1 h-px bg-card-border" />
            </div>
            <Input
              value={customGoal}
              onChange={e => setCustomGoal(e.target.value)}
              placeholder="e.g. Quantitative Analyst, UI/UX Designer, EdTech Founder"
              icon={<Briefcase className="w-4 h-4" />}
            />
          </Card>
          <Button
            full size="lg" icon={<ArrowRight className="w-5 h-5" />}
            onClick={() => setStep('skills')}
            disabled={!goal && !customGoal.trim()}
          >
            Next: Current Skills
          </Button>
        </motion.div>
      )}

      {/* Step 2: Skills */}
      {step === 'skills' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="flex items-center gap-2">
            <button onClick={() => setStep('goal')} className="text-text-tertiary hover:text-text-primary transition-colors">
              ← Back
            </button>
            <span className="text-text-tertiary">·</span>
            <span className="text-sm text-orange font-medium">{customGoal || goal}</span>
          </div>

          <Card>
            <p className="text-xs font-mono font-bold tracking-widest uppercase text-text-secondary mb-1">
              Select your current skills
            </p>
            <p className="text-xs text-text-tertiary mb-4">Choose all that apply — helps me identify your skill gap</p>
            <div className="flex flex-wrap gap-2">
              {SKILL_CHIPS.map(s => (
                <button key={s} onClick={() => toggleSkill(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedSkills.includes(s)
                      ? 'bg-violet/20 border border-violet/40 text-violet-light'
                      : 'bg-card-light border border-card-border text-text-secondary hover:border-white/20'
                  }`}>
                  {selectedSkills.includes(s) && '✓ '}{s}
                </button>
              ))}
            </div>
            {selectedSkills.length > 0 && (
              <p className="text-xs text-text-tertiary mt-3">{selectedSkills.length} skills selected</p>
            )}
          </Card>

          <Button
            full size="lg" loading={loading}
            icon={<Map className="w-5 h-5" />}
            onClick={generate}
          >
            {loading ? 'Mapping your career path…' : `Generate Roadmap  +${XP_REWARDS.career_mapped} XP`}
          </Button>

          <p className="text-center text-xs text-text-tertiary">
            No skills selected? That's fine — I'll do a full gap analysis for you.
          </p>
        </motion.div>
      )}
    </div>
  );
}
