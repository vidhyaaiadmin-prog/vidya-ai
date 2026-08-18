-- ╔══════════════════════════════════════════════════════════╗
-- ║           VIDYA AI — COMPLETE DATABASE SCHEMA            ║
-- ║  Run in Supabase SQL Editor after creating your project  ║
-- ╚══════════════════════════════════════════════════════════╝

-- ── Enable extensions ───────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;            -- for RAG
CREATE EXTENSION IF NOT EXISTS pg_trgm;           -- for text search

-- ── ENUM types ──────────────────────────────────────────────
CREATE TYPE language_code AS ENUM ('en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml');
CREATE TYPE quiz_difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE ai_model AS ENUM ('gemini-flash', 'gemini-pro', 'claude-sonnet', 'claude-opus', 'ollama');
CREATE TYPE ai_feature AS ENUM ('doubt', 'quiz', 'planner', 'career', 'interview', 'flashcard_gen', 'pyq', 'plagiarism', 'resources', 'certifications');
CREATE TYPE srs_grade AS ENUM ('0','1','2','3','4','5');

-- ═══════════════════════════════════════════════════════════
-- 00. INSTITUTIONS (B2B-only: every user belongs to one)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.institutions (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 TEXT NOT NULL,
  join_code            TEXT UNIQUE NOT NULL,     -- distributed by the institution to its students
  allowed_email_domain TEXT,                     -- e.g. '@iitb.ac.in' — only official edu emails may sign up
  seats_limit          INTEGER NOT NULL DEFAULT 500,
  contract_start       DATE,
  contract_end         DATE,
  is_active            BOOLEAN DEFAULT TRUE,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_institutions_join_code ON public.institutions(join_code);

-- Dev/demo seed — delete this row before onboarding a real institution.
-- allowed_email_domain is NULL here (any email works) so signup is easy to
-- test pre-launch; set a real domain once a real institution replaces this.
INSERT INTO public.institutions (name, join_code, allowed_email_domain, seats_limit, contract_start, contract_end)
VALUES ('Demo College (dev seed)', 'DEMO-2026', NULL, 500, NOW(), NOW() + INTERVAL '1 year');

-- ═══════════════════════════════════════════════════════════
-- 01. USERS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id         UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id  UUID NOT NULL REFERENCES public.institutions(id),
  email           TEXT UNIQUE,
  phone           TEXT UNIQUE,
  name            TEXT NOT NULL CHECK (length(name) >= 2),
  avatar_url      TEXT,
  major           TEXT NOT NULL DEFAULT 'Computer Science',
  semester        SMALLINT DEFAULT 1 CHECK (semester BETWEEN 1 AND 10),
  goal            TEXT[] NOT NULL DEFAULT ARRAY['Get a great placement'],
  language        language_code NOT NULL DEFAULT 'en',
  role            TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'institution_admin')),
  city            TEXT,
  state           TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_auth_id       ON public.users(auth_id);
CREATE INDEX idx_users_email         ON public.users(email);
CREATE INDEX idx_users_institution   ON public.users(institution_id);

-- IQAC evidence log — feeds the NAAC/NBA report generator (Phase 2, not yet built)
-- (created here, after users, since created_by references public.users(id))
CREATE TABLE public.iqac_evidence (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  criterion      TEXT NOT NULL,
  note           TEXT NOT NULL,
  created_by     UUID REFERENCES public.users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_iqac_institution ON public.iqac_evidence(institution_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- 02. USER PROGRESS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.user_progress (
  user_id                     UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  xp                          INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level                       SMALLINT NOT NULL DEFAULT 1,
  streak                      SMALLINT NOT NULL DEFAULT 0,
  longest_streak              SMALLINT NOT NULL DEFAULT 0,
  last_active                 TIMESTAMPTZ DEFAULT NOW(),
  total_doubts                INTEGER DEFAULT 0,
  total_quizzes               INTEGER DEFAULT 0,
  total_flashcards_reviewed   INTEGER DEFAULT 0,
  quiz_accuracy               NUMERIC(5,2) DEFAULT 0.0,
  study_minutes_today         INTEGER DEFAULT 0,
  study_minutes_week          INTEGER DEFAULT 0,
  study_minutes_total         INTEGER DEFAULT 0,
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ── XP events log ──────────────────────────────────────────
CREATE TABLE public.xp_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event       TEXT NOT NULL,
  amount      SMALLINT NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_xp_events_user ON public.xp_events(user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- 03. ACHIEVEMENTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.achievements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         TEXT UNIQUE NOT NULL,
  label       TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,
  xp_reward   SMALLINT DEFAULT 0,
  condition   TEXT,   -- e.g. "total_quizzes >= 10"
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_achievements (
  user_id        UUID REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- Seed achievements
INSERT INTO public.achievements (key, label, description, icon, xp_reward) VALUES
  ('first_doubt',    'Doubt Solver',        'Solved your first doubt',          '🔍', 5),
  ('quiz_10',        'Quiz Master',          'Completed 10 quizzes',             '✅', 50),
  ('quiz_100',       'Quiz Legend',          'Completed 100 quizzes',            '🏆', 200),
  ('streak_7',       '7-Day Streak',         'Studied 7 days in a row',          '🔥', 20),
  ('streak_30',      '30-Day Legend',        'Studied 30 days in a row',         '⚡', 100),
  ('streak_100',     '100-Day Champion',     'Studied 100 days in a row',        '👑', 500),
  ('level_5',        'Level 5 Scholar',      'Reached Level 5',                  '⭐', 0),
  ('level_10',       'Level 10 Expert',      'Reached Level 10',                 '💎', 0),
  ('career',         'Career Mapped',        'Generated first career roadmap',   '🗺️', 20),
  ('interview',      'Interview Ready',      'Completed a mock interview',       '🎤', 25),
  ('cards_50',       'Flashcard Champion',   'Reviewed 50 flashcards',           '🃏', 30),
  ('xp_500',         '500 XP Club',          'Earned 500 total XP',              '🏅', 0),
  ('xp_1000',        '1000 XP Elite',        'Earned 1000 total XP',             '💰', 0),
  ('planner',        'Planner Pro',          'Created a study plan',             '📅', 15),
  ('first_pyq',      'PYQ Practitioner',     'Completed first PYQ paper',        '📝', 20);

-- ═══════════════════════════════════════════════════════════
-- 04. DOUBT SESSIONS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.doubt_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  topic       TEXT NOT NULL,
  subject     TEXT,
  messages    JSONB NOT NULL DEFAULT '[]',
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  xp_earned   SMALLINT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_doubt_sessions_user ON public.doubt_sessions(user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- 05. QUIZZES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.quizzes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject       TEXT NOT NULL,
  difficulty    quiz_difficulty NOT NULL DEFAULT 'medium',
  questions     JSONB NOT NULL,
  answers       JSONB,
  score         SMALLINT,
  time_taken    INTEGER,            -- seconds
  xp_earned     SMALLINT DEFAULT 0,
  is_pyq        BOOLEAN DEFAULT FALSE,
  exam_name     TEXT,               -- e.g. 'GATE CS', 'CAT'
  exam_year     SMALLINT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);
CREATE INDEX idx_quizzes_user    ON public.quizzes(user_id, created_at DESC);
CREATE INDEX idx_quizzes_subject ON public.quizzes(subject);

-- ═══════════════════════════════════════════════════════════
-- 06. FLASHCARDS (with SRS)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.flashcards (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  front         TEXT NOT NULL,
  back          TEXT NOT NULL,
  subject       TEXT,
  deck          TEXT,
  -- SM-2 SRS fields
  ease_factor   NUMERIC(4,2) NOT NULL DEFAULT 2.5,
  interval      SMALLINT NOT NULL DEFAULT 1,
  repetitions   SMALLINT NOT NULL DEFAULT 0,
  next_review   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reviewed TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_flashcards_user        ON public.flashcards(user_id);
CREATE INDEX idx_flashcards_next_review ON public.flashcards(user_id, next_review)
  WHERE is_active = TRUE;

-- SRS review log
CREATE TABLE public.flashcard_reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  grade       srs_grade NOT NULL,
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- 07. STUDY PLANS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.study_plans (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exam_name     TEXT,
  exam_date     DATE NOT NULL,
  subjects      TEXT[] NOT NULL,
  hours_per_day SMALLINT NOT NULL DEFAULT 4,
  plan_text     TEXT NOT NULL,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_study_plans_user ON public.study_plans(user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- 08. CAREER ROADMAPS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.career_roadmaps (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal            TEXT NOT NULL,
  current_skills  TEXT[],
  roadmap_text    TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_career_user ON public.career_roadmaps(user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- 09. INTERVIEW SESSIONS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.interview_sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL,
  messages      JSONB NOT NULL DEFAULT '[]',
  score         SMALLINT,
  feedback      TEXT,
  xp_earned     SMALLINT DEFAULT 0,
  turn_count    SMALLINT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

-- ═══════════════════════════════════════════════════════════
-- 10. AI COST TRACKING
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.ai_usage_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feature       ai_feature NOT NULL,
  model         ai_model NOT NULL,
  input_tokens  INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd      NUMERIC(12, 8) NOT NULL DEFAULT 0,
  cost_inr      NUMERIC(12, 6) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ai_logs_user_date ON public.ai_usage_logs(user_id, created_at DESC);
CREATE INDEX idx_ai_logs_date      ON public.ai_usage_logs(created_at DESC);

-- Daily cost view (for observability dashboard)
CREATE VIEW public.daily_ai_costs AS
  SELECT
    DATE(created_at) as date,
    user_id,
    feature,
    model,
    SUM(input_tokens + output_tokens) as total_tokens,
    SUM(cost_inr) as total_cost_inr
  FROM public.ai_usage_logs
  GROUP BY DATE(created_at), user_id, feature, model;

-- ═══════════════════════════════════════════════════════════
-- 11. RAG CONTENT STORE (for Doubt Solver)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.content_chunks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content     TEXT NOT NULL,
  embedding   VECTOR(768),            -- Gemini text-embedding-004
  subject     TEXT NOT NULL,
  chapter     TEXT,
  source      TEXT NOT NULL,          -- 'NCERT', 'university_syllabus', etc.
  major       TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_content_embedding ON public.content_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
CREATE INDEX idx_content_subject ON public.content_chunks(subject);

-- RAG similarity search function
CREATE OR REPLACE FUNCTION public.match_content(
  query_embedding VECTOR(768),
  match_count     INT DEFAULT 5,
  filter_subject  TEXT DEFAULT NULL
)
RETURNS TABLE (
  id        UUID,
  content   TEXT,
  subject   TEXT,
  chapter   TEXT,
  source    TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id, c.content, c.subject, c.chapter, c.source,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.content_chunks c
  WHERE (filter_subject IS NULL OR c.subject ILIKE '%' || filter_subject || '%')
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 12. DAILY ANALYTICS SNAPSHOTS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.daily_snapshots (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  xp_earned       SMALLINT DEFAULT 0,
  doubts_count    SMALLINT DEFAULT 0,
  quizzes_count   SMALLINT DEFAULT 0,
  flashcards_count SMALLINT DEFAULT 0,
  study_minutes   SMALLINT DEFAULT 0,
  UNIQUE(user_id, date)
);
CREATE INDEX idx_snapshots_user ON public.daily_snapshots(user_id, date DESC);

-- ═══════════════════════════════════════════════════════════
-- 13. CERTIFICATION SUGGESTER
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.user_certifications (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  provider       TEXT NOT NULL,
  cost_type      TEXT NOT NULL CHECK (cost_type IN ('free', 'paid')),
  complexity     quiz_difficulty NOT NULL DEFAULT 'medium',
  specialization TEXT,
  why            TEXT,
  status         TEXT NOT NULL DEFAULT 'saved' CHECK (status IN ('saved', 'completed')),
  quiz_score     SMALLINT,
  quiz_total     SMALLINT,
  xp_earned      SMALLINT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  completed_at   TIMESTAMPTZ
);
CREATE INDEX idx_user_certifications_user ON public.user_certifications(user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- 14. ROW LEVEL SECURITY (DPDPA 2023 compliance)
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubt_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_roadmaps   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_snapshots   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "users: own data only" ON public.users
  FOR ALL USING (auth.uid() = auth_id);

CREATE POLICY "progress: own data only" ON public.user_progress
  FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "quizzes: own data only" ON public.quizzes
  FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "flashcards: own data only" ON public.flashcards
  FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "doubt_sessions: own data only" ON public.doubt_sessions
  FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "study_plans: own data only" ON public.study_plans
  FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "career_roadmaps: own data only" ON public.career_roadmaps
  FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "interview_sessions: own data only" ON public.interview_sessions
  FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "ai_usage_logs: own data only" ON public.ai_usage_logs
  FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "achievements: public read" ON public.achievements
  FOR SELECT USING (TRUE);

-- Institutions: a student may read only the name of their own institution
-- (join-code lookup during signup happens server-side via the admin client, never via this policy)
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "institutions: own institution read" ON public.institutions
  FOR SELECT USING (id IN (SELECT institution_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "user_achievements: own data only" ON public.user_achievements
  FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "xp_events: own data only" ON public.xp_events
  FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

CREATE POLICY "user_certifications: own data only" ON public.user_certifications
  FOR ALL USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

-- Content chunks: public read (syllabus content)
ALTER TABLE public.content_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_chunks: public read" ON public.content_chunks
  FOR SELECT USING (TRUE);

-- IQAC evidence: institution members can read their own institution's log;
-- writes only happen server-side via the admin client after a role check.
ALTER TABLE public.iqac_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "iqac_evidence: own institution read" ON public.iqac_evidence
  FOR SELECT USING (institution_id IN (SELECT institution_id FROM public.users WHERE auth_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════
-- 15. TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Auto-create progress row when user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_progress (user_id, xp, level, streak)
  VALUES (NEW.id, 50, 1, 1);   -- 50 XP welcome bonus
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER users_updated_at     BEFORE UPDATE ON public.users     FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER progress_updated_at  BEFORE UPDATE ON public.user_progress FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER sessions_updated_at  BEFORE UPDATE ON public.doubt_sessions FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ═══════════════════════════════════════════════════════════
-- 16. ADMIN VIEWS (for founder dashboard)
-- ═══════════════════════════════════════════════════════════
CREATE VIEW public.admin_overview AS
  SELECT
    COUNT(DISTINCT u.id)             AS total_users,
    COUNT(DISTINCT u.institution_id) AS active_institutions,
    COUNT(DISTINCT CASE WHEN up.last_active > NOW()-INTERVAL '1 day' THEN u.id END) AS dau,
    COUNT(DISTINCT CASE WHEN up.last_active > NOW()-INTERVAL '7 days' THEN u.id END) AS wau,
    SUM(up.xp)                       AS total_xp_earned,
    AVG(up.streak)                   AS avg_streak,
    SUM(al.cost_inr)                 AS total_ai_cost_inr
  FROM public.users u
  LEFT JOIN public.user_progress up ON u.id = up.user_id
  LEFT JOIN public.ai_usage_logs al ON u.id = al.user_id
  WHERE u.is_active = TRUE;

-- Cost per user per day
CREATE VIEW public.admin_cost_per_user AS
  SELECT
    DATE(created_at) as date,
    COUNT(DISTINCT user_id) as active_users,
    SUM(cost_inr) as total_cost_inr,
    SUM(cost_inr) / NULLIF(COUNT(DISTINCT user_id), 0) as cost_per_user_inr
  FROM public.ai_usage_logs
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
