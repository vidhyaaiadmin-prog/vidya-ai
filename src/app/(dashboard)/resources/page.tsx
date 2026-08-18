'use client';
import { useState } from 'react';
import { Compass, ExternalLink, PlayCircle, BookOpen } from 'lucide-react';
import { Button, Card, Badge, SectionHeader, Input } from '@/components/ui';
import { useUserStore } from '@/lib/stores';
import { authFetch } from '@/lib/api-client';
import toast from 'react-hot-toast';

interface Course { title: string; provider: string; why: string; }
interface Video { search_query: string; channel_suggestion: string; why: string; }

export default function ResourcesPage() {
  const { user } = useUserStore();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);

  const find = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await authFetch('/api/ai/resources', { topic, major: user?.major, language: user?.language });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      setCourses(data.courses ?? []);
      setVideos(data.videos ?? []);
    } catch {
      toast.error('Network error. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <SectionHeader
        eyebrow="Free Resource Finder"
        title={<>Best free content for <span className="text-gradient-orange">any topic</span></>}
        subtitle="Curated course and video search picks — ranked, not endless scrolling."
      />

      <Card glow="orange">
        <div className="flex gap-2.5">
          <div className="flex-1">
            <Input value={topic} onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && find()}
              placeholder="e.g. Dynamic Programming, Porter's Five Forces" />
          </div>
          <Button onClick={find} loading={loading} disabled={!topic.trim()} icon={<Compass className="w-4 h-4" />}>
            Find
          </Button>
        </div>
      </Card>

      {courses.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-mono font-bold tracking-widest uppercase text-text-tertiary flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" /> Free Courses
          </p>
          {courses.map((c, i) => (
            <Card key={i} className="!p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge color="orange">{c.provider}</Badge>
                </div>
                <p className="text-sm font-semibold text-text-primary">{c.title}</p>
                <p className="text-xs text-text-tertiary mt-0.5">{c.why}</p>
              </div>
              <a href={`https://www.google.com/search?q=${encodeURIComponent(c.title + ' ' + c.provider)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 p-2 rounded-lg text-text-tertiary hover:text-orange hover:bg-orange/10 transition-all">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Card>
          ))}
        </div>
      )}

      {videos.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-mono font-bold tracking-widest uppercase text-text-tertiary flex items-center gap-2">
            <PlayCircle className="w-3.5 h-3.5" /> YouTube Search Picks
          </p>
          {videos.map((v, i) => (
            <Card key={i} className="!p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Badge color="violet" className="mb-1">{v.channel_suggestion}</Badge>
                <p className="text-sm font-semibold text-text-primary">{v.search_query}</p>
                <p className="text-xs text-text-tertiary mt-0.5">{v.why}</p>
              </div>
              <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(v.search_query)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 p-2 rounded-lg text-text-tertiary hover:text-violet-light hover:bg-violet/10 transition-all">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
