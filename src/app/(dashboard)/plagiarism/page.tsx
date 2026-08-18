'use client';
import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Button, Card, Badge, SectionHeader, Textarea, ProgressBar } from '@/components/ui';
import { useUserStore } from '@/lib/stores';
import { authFetch } from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function PlagiarismPage() {
  const { user } = useUserStore();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ score: number; verdict: string; reasons: string[] } | null>(null);

  const check = async () => {
    if (text.trim().length < 40) { toast.error('Paste at least a paragraph to analyze.'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await authFetch('/api/ai/plagiarism', { text, language: user?.language });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      setResult(data);
    } catch {
      toast.error('Network error. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const color = !result ? 'var(--teal)' : result.score >= 70 ? 'var(--mint)' : result.score >= 40 ? 'var(--amber)' : 'var(--danger)';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <SectionHeader
        eyebrow="Originality Check"
        title={<>Check your work <span className="text-gradient-teal">before you submit</span></>}
        subtitle="An AI writing-pattern estimate — flags generic phrasing and AI-like structure. Not a plagiarism database match."
      />

      <Card glow="teal">
        <Textarea
          label="Paste your submission"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste your essay, report, or assignment text here…"
          rows={10}
        />
        <div className="mt-3">
          <Button full onClick={check} loading={loading} disabled={text.trim().length < 40}
            icon={<ShieldCheck className="w-4 h-4" />}>
            Check Originality
          </Button>
        </div>
      </Card>

      {result && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-text-tertiary">Originality Score</span>
            <Badge color={result.score >= 70 ? 'mint' : result.score >= 40 ? 'amber' : 'danger'}>{result.score}/100</Badge>
          </div>
          <ProgressBar value={result.score} height={7} color={color} />
          <p className="text-sm text-text-primary font-medium mt-3">{result.verdict}</p>
          {result.reasons.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {result.reasons.map((r, i) => (
                <li key={i} className="text-xs text-text-secondary flex gap-2">
                  <span className="text-text-tertiary">•</span>{r}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
