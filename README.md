# Vidya AI — Full-Stack EdTech Platform

> The all-in-one AI education platform for 40M+ Indian college students.
> Offline-first · Vernacular-first · AI-first · Built for Bharat.

---

## 🚀 Quick Start (5 steps)

### 1. Clone and install
```bash
cd vidya-ai
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env.local
# Fill in your API keys (see section below)
```

### 3. Set up Supabase database
```bash
# Go to supabase.com → Create project → SQL Editor
# Paste and run: supabase/schema.sql
```

### 4. Run the dev server
```bash
npm run dev
# Open http://localhost:3000
```

### 5. Generate TypeScript types from Supabase
```bash
npm run db:types
```

---

## 🔑 API Keys You Need

### Supabase (Free tier works)
1. Go to [supabase.com](https://supabase.com) → Create new project
2. Go to Settings → API
3. Copy: `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
4. Copy: `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Copy: `service_role secret key` → `SUPABASE_SERVICE_ROLE_KEY`

### Google Gemini (Free tier: 1,000 req/day)
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click "Get API key" → Create API key
3. Copy → `GEMINI_API_KEY`

### Anthropic Claude (For Doubt Solver)
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. API Keys → Create Key
3. Copy → `ANTHROPIC_API_KEY`
> Cost: ~$3/1M input tokens (Claude Sonnet 4.6). Routed only for the Socratic Doubt Solver.

### Razorpay (For payments — optional for MVP)
1. Go to [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Settings → API Keys → Generate
3. Copy Key ID → `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID`
4. Copy Key Secret → `RAZORPAY_KEY_SECRET`

### WhatsApp Cloud API (For parent digest — optional for MVP)
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create an app → Add WhatsApp product
3. Get Phone Number ID and Access Token

---

## 🏗️ Architecture

```
vidya-ai/
├── src/
│   ├── app/
│   │   ├── (dashboard)/          # Protected routes (all feature pages)
│   │   │   ├── home/             # Dashboard
│   │   │   ├── doubt/            # Socratic AI chat
│   │   │   ├── quiz/             # AI-generated MCQs
│   │   │   ├── flashcards/       # SRS flashcards
│   │   │   ├── planner/          # Study plan generator
│   │   │   ├── career/           # Career GPS
│   │   │   ├── interview/        # Mock interview
│   │   │   ├── pyq/              # Previous year questions
│   │   │   ├── analytics/        # Performance charts
│   │   │   └── profile/          # User profile
│   │   ├── api/ai/               # AI API routes (server-side)
│   │   │   ├── doubt/            # Claude Sonnet (Socratic)
│   │   │   ├── quiz/             # Gemini Flash (MCQ gen)
│   │   │   ├── planner/          # Gemini Flash (study plan)
│   │   │   ├── career/           # Gemini Flash (roadmap)
│   │   │   ├── interview/        # Claude Sonnet (interview)
│   │   │   └── flashcards/       # Gemini Flash (card gen)
│   │   ├── onboarding/           # First-time setup
│   │   └── page.tsx              # Root redirect
│   ├── components/
│   │   ├── ui/                   # Button, Card, Badge, Input, Modal, etc.
│   │   └── layout/AppShell.tsx   # Sidebar + Header + BottomNav
│   ├── lib/
│   │   ├── ai.ts                 # AI provider router (Gemini/Claude)
│   │   ├── supabase.ts           # DB client (browser + admin)
│   │   ├── stores.ts             # Zustand state (user, quiz, flashcards)
│   │   └── utils.ts              # XP, SRS, date helpers
│   └── types/index.ts            # All TypeScript types
├── supabase/
│   └── schema.sql                # Complete DB schema + RLS policies
├── public/manifest.json          # PWA manifest
└── .env.example                  # All required env vars
```

---

## 🤖 AI Model Routing

| Feature | Model | Why | Cost |
|---------|-------|-----|------|
| Socratic Doubt Solver | Claude Sonnet 4.6 | Best at multi-turn Socratic reasoning | $3/$15 per 1M |
| Mock Interview | Claude Sonnet 4.6 | Nuanced feedback and evaluation | $3/$15 per 1M |
| Quiz Generator | Gemini 2.5 Flash-Lite | Fast, structured JSON output | $0.10/$0.40 per 1M |
| Study Planner | Gemini 2.5 Flash-Lite | Long-form structured output | $0.10/$0.40 per 1M |
| Career GPS | Gemini 2.5 Flash-Lite | Good at structured roadmaps | $0.10/$0.40 per 1M |
| Flashcard Generator | Gemini 2.5 Flash-Lite | JSON array output | $0.10/$0.40 per 1M |
| PYQ Mode | Gemini 2.5 Flash-Lite | MCQ generation in exam style | $0.10/$0.40 per 1M |
| Offline Coaching | Ollama + Gemma 4 E2B | ₹0 forever, on-device | Free |

**Target: ₹1.79–2.23 per student per month in AI costs.**

---

## 💾 Database Setup

After pasting `supabase/schema.sql` in the Supabase SQL editor, you'll have:

- `users` — profiles with language, major, plan
- `user_progress` — XP, level, streak, study time
- `doubt_sessions` — full conversation history
- `quizzes` — generated questions + student answers
- `flashcards` — SRS cards with SM-2 algorithm fields
- `study_plans` — AI-generated plans with exam dates
- `career_roadmaps` — saved career paths
- `interview_sessions` — mock interview transcripts
- `ai_usage_logs` — per-feature token tracking (critical for cost control)
- `content_chunks` — vector store for RAG (doubt solver accuracy)
- `achievements` — 15 pre-seeded achievements
- RLS policies on every table (DPDPA 2023 compliance)

---

## 📱 Features Implemented (Phase 1 MVP)

- [x] Onboarding (name, major, goal, language)
- [x] Dashboard with XP, streak, level progress
- [x] Socratic Doubt Solver (Claude-powered multi-turn chat)
- [x] AI Quiz Generator (Gemini, topic → 5 MCQs, auto-advance)
- [x] Flashcards with SM-2 spaced repetition + AI generation
- [x] Study Planner (exam date + subjects → detailed AI plan)
- [x] Career GPS (goal + skills → 6-month roadmap)
- [x] Mock Interview (6-question HR+technical, scoring)
- [x] PYQ Mode (competitive exam practice)
- [x] Analytics (XP chart, subject scores, streak calendar)
- [x] Profile page with achievements
- [x] Zustand state management with persistence
- [x] AI cost tracking per feature per user
- [x] Daily token caps per plan
- [x] Responsive layout (sidebar on desktop, bottom nav on mobile)
- [x] PWA manifest for installability
- [x] Row-level security (DPDPA compliance)
- [x] Framer Motion animations throughout

---

## 🚢 Deployment

### Vercel (recommended)
```bash
npm install -g vercel
vercel --prod
# Set env vars in Vercel dashboard
```

### Self-hosted
```bash
npm run build
npm start
```

---

## 💰 Cost Estimate

| Stage | Users | Monthly Cost |
|-------|-------|-------------|
| Build | 0 | ~₹500 (API testing) |
| Beta | 500 | ~₹4,895 |
| Growth | 5,000 | ~₹20,810 |
| Scale | 50,000 | ~₹1,62,066 |

Break-even: **Month 7 with just 50 paying students at ₹149/month.**

---

## 📞 Support

When you're ready to connect APIs, fill in `.env.local` and the app will automatically use real data.
All AI features are already wired — they just need the keys.

**Built with:** Next.js 14 · Supabase · Gemini API · Claude API · Zustand · Framer Motion · Recharts · Tailwind CSS


