/**
 * ═══════════════════════════════════════════════════════════
 *  VIDYA AI — SECURITY CORE (single source of truth)
 *  Every API route imports from here. One module, all defenses.
 *  DRY: fix a vulnerability once → fixed everywhere.
 * ═══════════════════════════════════════════════════════════
 *
 * Layers implemented:
 *  1. Rate limiting        (per-IP, in-memory sliding window)
 *  2. Input validation     (schema-based, strict types & lengths)
 *  3. Input sanitization   (strips injection payloads)
 *  4. Prompt-injection shield (blocks jailbreak patterns before AI)
 *  5. Auth guard           (Supabase JWT verification)
 *  6. Secure error handling (never leaks internals to client)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from './supabase';

// ─── 1. RATE LIMITING ───────────────────────────────────────
// Sliding window per IP. For production scale, swap the Map for
// Upstash Redis — the interface stays identical (DRY).
const hits = new Map<string, number[]>();

const LIMITS: Record<string, { windowMs: number; max: number }> = {
  ai:      { windowMs: 60_000, max: 10 },  // 10 AI calls/min
  auth:    { windowMs: 60_000, max: 5  },  // 5 login attempts/min
  default: { windowMs: 60_000, max: 30 },
};

export function rateLimit(req: NextRequest, bucket: keyof typeof LIMITS = 'default'): boolean {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const key = `${bucket}:${ip}`;
  const { windowMs, max } = LIMITS[bucket] ?? LIMITS.default;
  const now = Date.now();

  const timestamps = (hits.get(key) ?? []).filter(t => now - t < windowMs);
  if (timestamps.length >= max) return false;

  timestamps.push(now);
  hits.set(key, timestamps);

  // Garbage-collect old keys occasionally
  if (hits.size > 10_000) {
    for (const [k, v] of hits) if (v.every(t => now - t > windowMs)) hits.delete(k);
  }
  return true;
}

// ─── 2. INPUT VALIDATION (tiny schema validator, zero deps) ──
type FieldRule = {
  type: 'string' | 'number' | 'array';
  required?: boolean;
  maxLen?: number;
  min?: number;
  max?: number;
  enum?: readonly string[];
};

export function validate(
  body: Record<string, unknown>,
  schema: Record<string, FieldRule>,
): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  const clean: Record<string, unknown> = {};

  for (const [field, rule] of Object.entries(schema)) {
    const val = body[field];

    if (val === undefined || val === null || val === '') {
      if (rule.required) return { ok: false, error: `Missing field: ${field}` };
      continue;
    }
    if (rule.type === 'string') {
      if (typeof val !== 'string') return { ok: false, error: `${field} must be text` };
      if (rule.maxLen && val.length > rule.maxLen)
        return { ok: false, error: `${field} too long (max ${rule.maxLen})` };
      if (rule.enum && !rule.enum.includes(val))
        return { ok: false, error: `${field} has invalid value` };
      clean[field] = sanitize(val);
    }
    if (rule.type === 'number') {
      const n = Number(val);
      if (Number.isNaN(n)) return { ok: false, error: `${field} must be a number` };
      if (rule.min !== undefined && n < rule.min) return { ok: false, error: `${field} too small` };
      if (rule.max !== undefined && n > rule.max) return { ok: false, error: `${field} too large` };
      clean[field] = n;
    }
    if (rule.type === 'array') {
      if (!Array.isArray(val)) return { ok: false, error: `${field} must be a list` };
      if (rule.maxLen && val.length > rule.maxLen)
        return { ok: false, error: `${field} has too many items` };
      clean[field] = val.map((item: unknown) => {
        if (typeof item === 'string') return sanitize(item);
        if (item && typeof item === 'object') {
          const obj = { ...item } as Record<string, unknown>;
          for (const k of Object.keys(obj)) {
            if (typeof obj[k] === 'string') obj[k] = sanitize(obj[k] as string);
          }
          return obj;
        }
        return item;
      });
    }
  }
  return { ok: true, data: clean };
}

// ─── 3. SANITIZATION ────────────────────────────────────────
export function sanitize(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, '')   // strip script tags
    .replace(/<[^>]*on\w+\s*=/gi, '<')            // strip inline event handlers
    .replace(/javascript:/gi, '')                 // strip js: URLs
    .replace(/\0/g, '')                           // strip null bytes
    .trim()
    .slice(0, 8000);                              // hard cap on any input
}

// ─── 4. PROMPT-INJECTION SHIELD ─────────────────────────────
// Blocks common jailbreak patterns BEFORE they reach the AI.
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts)/i,
  /you\s+are\s+now\s+(a|an|in)\s/i,
  /system\s*prompt/i,
  /reveal\s+(your|the)\s+(instructions|prompt|system)/i,
  /pretend\s+(you('re|\s+are)|to\s+be)\s+(not\s+)?(an?\s+)?(ai|unrestricted|dan|jailbroken)/i,
  /developer\s+mode/i,
  /\bDAN\b.*mode/i,
];

export function shieldPrompt(input: string): { safe: boolean; reason?: string } {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return { safe: false, reason: 'Input contains disallowed instruction patterns' };
    }
  }
  return { safe: true };
}

// ─── 5. AUTH GUARD ──────────────────────────────────────────
export async function requireAuth(req: NextRequest): Promise<
  { ok: true; userId: string } | { ok: false; response: NextResponse }
> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return { ok: false, response: json({ error: 'Authentication required' }, 401) };
  }
  try {
    const db = createAdminClient();
    if (!db) return { ok: false, response: json({ error: 'Server configuration error' }, 500) };
    const { data: { user }, error } = await db.auth.getUser(token);
    if (error || !user) {
      return { ok: false, response: json({ error: 'Invalid or expired session' }, 401) };
    }
    // user.id is the Supabase Auth id (auth_id) — every other table FKs to
    // public.users.id instead, so resolve the real profile id here once.
    const { data: profile } = await db.from('users').select('id').eq('auth_id', user.id).single();
    if (!profile) {
      return { ok: false, response: json({ error: 'Profile not found' }, 401) };
    }
    return { ok: true, userId: profile.id };
  } catch {
    return { ok: false, response: json({ error: 'Authentication failed' }, 401) };
  }
}

// Verifies the caller is an institution_admin and returns their institution_id.
// Used by every /api/admin/* route — never trust a role claimed by the client.
export async function requireInstitutionAdmin(userId: string): Promise<
  { ok: true; institutionId: string } | { ok: false; response: NextResponse }
> {
  const db = createAdminClient();
  if (!db) return { ok: false, response: json({ error: 'Server configuration error' }, 500) };
  const { data } = await db.from('users').select('institution_id, role').eq('id', userId).single();
  if (!data || data.role !== 'institution_admin') {
    return { ok: false, response: json({ error: 'Institution admin access required' }, 403) };
  }
  return { ok: true, institutionId: data.institution_id };
}

// ─── 6. SECURE RESPONSES (never leak internals) ─────────────
export function json(body: object, status = 200): NextResponse {
  return NextResponse.json(body, { status });
}

export function safeError(err: unknown): NextResponse {
  // Log full error server-side only
  console.error('[API ERROR]', err);
  // Client gets a generic message — never stack traces, keys, or paths
  return json({ error: 'Something went wrong. Please try again.' }, 500);
}

// ─── ONE-CALL GUARD (composes everything — the DRY entry) ───
export async function guard(
  req: NextRequest,
  opts: {
    bucket?: keyof typeof LIMITS;
    schema?: Record<string, FieldRule>;
    checkPromptFields?: string[];   // fields to run through injection shield
    requireUser?: boolean;
  } = {},
): Promise<
  { ok: true; data: Record<string, unknown>; userId?: string }
  | { ok: false; response: NextResponse }
> {
  // Rate limit
  if (!rateLimit(req, opts.bucket ?? 'default')) {
    return { ok: false, response: json({ error: 'Too many requests. Slow down.' }, 429) };
  }

  // Parse body safely
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {
    return { ok: false, response: json({ error: 'Invalid request body' }, 400) };
  }

  // Validate schema
  let data = body;
  if (opts.schema) {
    const result = validate(body, opts.schema);
    if (!result.ok) return { ok: false, response: json({ error: result.error }, 400) };
    data = result.data;
  }

  // Prompt-injection shield on chosen fields
  for (const field of opts.checkPromptFields ?? []) {
    const value = data[field];
    if (typeof value === 'string') {
      const check = shieldPrompt(value);
      if (!check.safe) {
        return { ok: false, response: json({ error: 'Message could not be processed.' }, 400) };
      }
    }
    // Also check message arrays (chat histories)
    if (Array.isArray(value)) {
      for (const item of value) {
        const content = (item as { content?: string })?.content;
        if (content && !shieldPrompt(content).safe) {
          return { ok: false, response: json({ error: 'Message could not be processed.' }, 400) };
        }
      }
    }
  }

  // Auth
  if (opts.requireUser) {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth;
    return { ok: true, data, userId: auth.userId };
  }

  return { ok: true, data };
}
