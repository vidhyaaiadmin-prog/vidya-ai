import { createBrowserClient } from '@supabase/ssr';
import { createClient as createServerClientBase } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// One gate, used everywhere (DRY): true only when keys are configured
export const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const adminReady = Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);

// ─── Browser client (null in local mode — callers skip DB) ──
export function createClient() {
  if (!supabaseReady) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ─── Admin client (server API routes only) ─────────────────
export function createAdminClient() {
  if (!adminReady) return null;
  return createServerClientBase(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ─── Type-safe DB query helpers ────────────────────────────
export type Tables = {
  institutions: {
    id: string;
    name: string;
    join_code: string;
    allowed_email_domain: string | null;
    seats_limit: number;
    contract_start: string | null;
    contract_end: string | null;
    is_active: boolean;
    created_at: string;
  };
  iqac_evidence: {
    id: string;
    institution_id: string;
    criterion: string;
    note: string;
    created_by: string | null;
    created_at: string;
  };
  users: {
    id: string;
    institution_id: string;
    role: string;
    email: string | null;
    phone: string | null;
    name: string;
    avatar_url: string | null;
    major: string;
    semester: number;
    goal: string[];
    language: string;
    created_at: string;
    updated_at: string;
  };
  user_progress: {
    user_id: string;
    xp: number;
    level: number;
    streak: number;
    last_active: string;
    total_doubts: number;
    total_quizzes: number;
    total_flashcards_reviewed: number;
    quiz_accuracy: number;
    study_minutes_today: number;
    study_minutes_week: number;
  };
  doubt_sessions: {
    id: string;
    user_id: string;
    topic: string;
    subject: string | null;
    messages: unknown;
    status: string;
    xp_earned: number;
    created_at: string;
    updated_at: string;
  };
  quizzes: {
    id: string;
    user_id: string;
    subject: string;
    difficulty: string;
    questions: unknown;
    answers: unknown | null;
    score: number | null;
    time_taken: number | null;
    xp_earned: number;
    created_at: string;
    completed_at: string | null;
  };
  flashcards: {
    id: string;
    user_id: string;
    front: string;
    back: string;
    subject: string | null;
    deck: string | null;
    ease_factor: number;
    interval: number;
    repetitions: number;
    next_review: string;
    last_reviewed: string | null;
    created_at: string;
  };
  study_plans: {
    id: string;
    user_id: string;
    exam_name: string | null;
    exam_date: string;
    subjects: string[];
    hours_per_day: number;
    plan_text: string;
    created_at: string;
  };
  ai_usage_logs: {
    id: string;
    user_id: string;
    feature: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
    cost_inr: number;
    created_at: string;
  };
};
