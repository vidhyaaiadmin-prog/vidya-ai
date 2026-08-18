// ─── User & Auth ──────────────────────────────────────────────
export interface User {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  avatar_url?: string;
  major: Major;
  semester: number;
  goal: string[];
  language: Language;
  institution_id: string;
  institution_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Institution {
  id: string;
  name: string;
  join_code: string;
  seats_limit: number;
  contract_start?: string;
  contract_end?: string;
  is_active: boolean;
}

export interface UserProgress {
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
}

export interface Achievement {
  id: string;
  key: string;
  label: string;
  description: string;
  icon: string;
  xp_reward: number;
  condition: string;
}

export interface UserAchievement {
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement: Achievement;
}

// ─── Enums ────────────────────────────────────────────────────
export type Major =
  | 'Computer Science'
  | 'Electronics Engineering'
  | 'Mechanical Engineering'
  | 'Civil Engineering'
  | 'BBA / MBA'
  | 'B.Com / M.Com'
  | 'BA / MA (Arts)'
  | 'BCA / MCA'
  | 'Pharmacy'
  | 'Architecture'
  | 'Other';

export type Language = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' | 'ml';

export type Difficulty = 'easy' | 'medium' | 'hard';

// ─── Doubt / Chat ──────────────────────────────────────────────
export interface DoubtSession {
  id: string;
  user_id: string;
  topic: string;
  subject?: string;
  messages: ChatMessage[];
  status: 'active' | 'resolved';
  xp_earned: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

// ─── Quiz ─────────────────────────────────────────────────────
export interface QuizQuestion {
  q: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  explanation: string;
  topic?: string;
  difficulty?: Difficulty;
}

export interface Quiz {
  id: string;
  user_id: string;
  subject: string;
  difficulty: Difficulty;
  questions: QuizQuestion[];
  answers?: (number | null)[];
  score?: number;
  time_taken?: number;
  xp_earned: number;
  created_at: string;
  completed_at?: string;
}

// ─── Flashcards ───────────────────────────────────────────────
export interface Flashcard {
  id: string;
  user_id: string;
  front: string;
  back: string;
  subject?: string;
  deck?: string;
  // SRS data
  ease_factor: number;       // default 2.5
  interval: number;          // days
  repetitions: number;
  next_review: string;       // ISO date
  last_reviewed?: string;
  created_at: string;
}

export type SRSGrade = 0 | 1 | 2 | 3 | 4 | 5; // 0-2 fail, 3-5 pass

// ─── Study Plan ───────────────────────────────────────────────
export interface StudyPlan {
  id: string;
  user_id: string;
  exam_name?: string;
  exam_date: string;
  subjects: string[];
  hours_per_day: number;
  plan_text: string;
  created_at: string;
}

// ─── PYQ ──────────────────────────────────────────────────────
export interface PYQPaper {
  id: string;
  exam: string;         // 'GATE', 'CAT', 'UPSC', etc.
  year: number;
  subject?: string;
  questions: QuizQuestion[];
  total_marks: number;
  duration_minutes: number;
}

export interface PYQAttempt {
  id: string;
  user_id: string;
  paper_id: string;
  answers: (number | null)[];
  score: number;
  time_taken: number;
  completed_at: string;
}

// ─── Career ───────────────────────────────────────────────────
export interface CareerRoadmap {
  id: string;
  user_id: string;
  goal: string;
  current_skills: string[];
  roadmap_text: string;
  created_at: string;
}

// ─── Certification Suggester ───────────────────────────────────
export interface CertificationSuggestion {
  title: string;
  provider: string;
  cost_type: 'free' | 'paid';
  complexity: Difficulty;
  why: string;
  search_query: string;  // never a fabricated URL — same rule as Resources
}

export interface UserCertification {
  id: string;
  user_id: string;
  title: string;
  provider: string;
  cost_type: 'free' | 'paid';
  complexity: Difficulty;
  specialization?: string;
  why?: string;
  status: 'saved' | 'completed';
  quiz_score?: number;
  quiz_total?: number;
  xp_earned: number;
  created_at: string;
  completed_at?: string;
}

// ─── Interview ────────────────────────────────────────────────
export interface InterviewSession {
  id: string;
  user_id: string;
  role: string;
  messages: ChatMessage[];
  score?: number;
  feedback?: string;
  xp_earned: number;
  created_at: string;
  completed_at?: string;
}

// ─── Analytics ────────────────────────────────────────────────
export interface DailyActivity {
  date: string;
  xp: number;
  doubts: number;
  quizzes: number;
  flashcards: number;
  minutes: number;
}

export interface SubjectPerformance {
  subject: string;
  quiz_count: number;
  avg_score: number;
  weak_topics: string[];
}

// ─── AI Cost Tracking ─────────────────────────────────────────
export interface AIUsageLog {
  id: string;
  user_id: string;
  feature: 'doubt' | 'quiz' | 'planner' | 'career' | 'interview' | 'flashcard_gen';
  model: 'gemini-flash' | 'gemini-pro' | 'claude-sonnet' | 'claude-opus' | 'ollama';
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  cost_inr: number;
  created_at: string;
}

// ─── API Response Types ────────────────────────────────────────
export interface APIResponse<T = unknown> {
  data?: T;
  error?: string;
  xp_earned?: number;
}

export interface QuizGenerateResponse {
  questions: QuizQuestion[];
  subject: string;
  difficulty: Difficulty;
}

export interface PlannerResponse {
  plan: string;
  days_remaining: number;
  subjects: string[];
}

// ─── WhatsApp ─────────────────────────────────────────────────
export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template';
  text?: { body: string };
  template?: {
    name: string;
    language: { code: string };
    components?: unknown[];
  };
}
