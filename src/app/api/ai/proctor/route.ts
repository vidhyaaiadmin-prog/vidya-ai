import { NextRequest } from 'next/server';
import { guard, json } from '@/lib/security';
import { callGeminiVision } from '@/lib/ai';

// Vault Mode snapshot check — one small frame every ~30s, not continuous
// streaming, to keep cost and privacy exposure bounded. Fails open: a network
// or AI error never blocks the exam, it just skips that one check.
export async function POST(req: NextRequest) {
  const g = await guard(req, {
    bucket: 'ai',
    requireUser: true,
    schema: { image: { type: 'string', required: true, maxLen: 400_000 } },
  });
  if (!g.ok) return g.response;

  try {
    const { image } = g.data as { image: string };
    const raw = await callGeminiVision(
      image, 'image/jpeg',
      `You are an exam proctor reviewing one webcam frame. Answer ONLY JSON: {"ok": true|false, "flag": "short reason or empty string"}.
Flag false ONLY for a clear integrity concern: no person visible, more than one person visible, a phone/second screen/notes clearly visible. Do NOT flag normal things: looking down briefly, lighting, glasses, background objects, minor movement.`,
      g.userId ?? 'anonymous', 'plagiarism', // reuse 'plagiarism' feature slot — no separate enum entry needed for this low-volume check
    );

    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : { ok: true, flag: '' };
    return json({ ok: parsed.ok !== false, flag: parsed.flag || undefined });
  } catch (err) {
    // Fail open — a proctoring hiccup should never fail the student's exam.
    return json({ ok: true });
  }
}
