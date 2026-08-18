'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserProgress, UserAchievement } from '@/types';
import { createClient } from '@/lib/supabase';
import { XP_REWARDS, type XPEvent } from '@/lib/utils';

// Which user_progress counter (if any) a given XP event should bump by 1.
const COUNTER_EVENTS: Partial<Record<XPEvent, keyof UserProgress>> = {
  quiz_completed:  'total_quizzes',
  doubt_started:   'total_doubts',
  flashcard_known: 'total_flashcards_reviewed',
};

// ─── User Store ────────────────────────────────────────────
interface UserState {
  user: User | null;
  progress: UserProgress | null;
  achievements: UserAchievement[];
  isLoading: boolean;

  setUser:        (u: User | null) => void;
  setProgress:    (p: UserProgress | null) => void;
  setAchievements:(a: UserAchievement[]) => void;
  setLoading:     (v: boolean) => void;
  clearUser:      () => void;

  addXP:          (event: XPEvent) => Promise<void>;
  fetchProgress:  () => Promise<void>;
  updateStreak:   () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      progress: null,
      achievements: [],
      isLoading: false,

      setUser:         (user) => set({ user }),
      setProgress:     (progress) => set({ progress }),
      setAchievements: (achievements) => set({ achievements }),
      setLoading:      (isLoading) => set({ isLoading }),
      clearUser:       () => set({ user: null, progress: null, achievements: [] }),

      addXP: async (event) => {
        const { user, progress } = get();
        if (!user || !progress) return;

        const amount = XP_REWARDS[event];
        const newXP = progress.xp + amount;

        // These events double as the only signal that a quiz/doubt/flashcard
        // review actually happened — Profile's stat counters read straight
        // from these columns, so without this bump they stay at 0 forever.
        const counterField = COUNTER_EVENTS[event];
        const counterUpdate = counterField
          ? { [counterField]: (progress[counterField] as number) + 1 }
          : {};

        // Optimistic update — instant UI, always works
        set({ progress: { ...progress, xp: newXP, ...counterUpdate } });

        // Persist to DB only when Supabase is configured
        const db = createClient();
        if (!db) return;
        try {
          await db.from('user_progress').update({ xp: newXP, ...counterUpdate }).eq('user_id', user.id);
          await db.from('xp_events').insert({ user_id: user.id, event, amount });
        } catch { /* offline or DB down — local state already updated */ }
      },

      fetchProgress: async () => {
        const { user, progress } = get();
        if (!user) return;

        const db = createClient();
        if (!db) return;  // local mode — keep persisted progress
        try {
          const { data } = await db
            .from('user_progress')
            .select('*')
            .eq('user_id', user.id)
            .single();
          if (data) set({ progress: data as unknown as UserProgress });
        } catch { /* keep local progress */ }
      },

      updateStreak: async () => {
        const { user, progress } = get();
        if (!user || !progress) return;

        const db = createClient();
        if (!db) return;
        const lastActive = new Date(progress.last_active);
        const today = new Date();
        const dayDiff = Math.floor(
          (today.setHours(0,0,0,0) - lastActive.setHours(0,0,0,0)) / 86400000
        );

        let newStreak = progress.streak;
        if (dayDiff === 1) newStreak += 1;       // Consecutive day
        else if (dayDiff > 1) newStreak = 1;     // Broken streak

        await db.from('user_progress').update({
          streak: newStreak,
          last_active: new Date().toISOString(),
        }).eq('user_id', user.id);

        set({ progress: { ...progress, streak: newStreak } });
      },
    }),
    {
      name: 'vidya-user',
      partialize: (state) => ({ user: state.user, progress: state.progress }),
    },
  ),
);

// ─── UI Store ──────────────────────────────────────────────
interface UIState {
  sidebarOpen: boolean;
  activeFeature: string;
  commandOpen: boolean;
  onboardingDone: boolean;

  setSidebarOpen:   (v: boolean) => void;
  setActiveFeature: (v: string) => void;
  setCommandOpen:   (v: boolean) => void;
  setOnboardingDone:(v: boolean) => void;
  toggleSidebar:    () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen:    false,
      activeFeature:  'home',
      commandOpen:    false,
      onboardingDone: false,

      setSidebarOpen:    (v) => set({ sidebarOpen: v }),
      setActiveFeature:  (v) => set({ activeFeature: v }),
      setCommandOpen:    (v) => set({ commandOpen: v }),
      setOnboardingDone: (v) => set({ onboardingDone: v }),
      toggleSidebar:     () => set({ sidebarOpen: !get().sidebarOpen }),
    }),
    {
      name: 'vidya-ui',
      partialize: (state) => ({
        onboardingDone: state.onboardingDone,
        activeFeature: state.activeFeature,
      }),
    },
  ),
);

// ─── Quiz Store ─────────────────────────────────────────────
import type { QuizQuestion, Difficulty } from '@/types';

interface QuizState {
  subject: string;
  difficulty: Difficulty;
  questions: QuizQuestion[];
  currentIdx: number;
  answers: (number | null)[];
  startTime: number | null;
  phase: 'setup' | 'loading' | 'quiz' | 'result';
  showExplanation: boolean;

  setSubject:      (v: string) => void;
  setDifficulty:   (v: Difficulty) => void;
  setQuestions:    (q: QuizQuestion[]) => void;
  setPhase:        (p: QuizState['phase']) => void;
  selectAnswer:    (idx: number) => void;
  nextQuestion:    () => void;
  resetQuiz:       () => void;
}

export const useQuizStore = create<QuizState>()((set, get) => ({
  subject:         '',
  difficulty:      'medium',
  questions:       [],
  currentIdx:      0,
  answers:         [],
  startTime:       null,
  phase:           'setup',
  showExplanation: false,

  setSubject:    (subject) => set({ subject }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setQuestions:  (questions) => set({ questions, currentIdx: 0, answers: [], phase: 'quiz', startTime: Date.now() }),
  setPhase:      (phase) => set({ phase }),

  selectAnswer: (idx) => {
    const { answers, currentIdx } = get();
    const newAnswers = [...answers];
    newAnswers[currentIdx] = idx;
    set({ answers: newAnswers, showExplanation: true });
  },

  nextQuestion: () => {
    const { currentIdx, questions } = get();
    if (currentIdx < questions.length - 1) {
      set({ currentIdx: currentIdx + 1, showExplanation: false });
    } else {
      set({ phase: 'result' });
    }
  },

  resetQuiz: () => set({
    subject: '', questions: [], currentIdx: 0, answers: [],
    startTime: null, phase: 'setup', showExplanation: false,
  }),
}));

// ─── Flashcard Store ────────────────────────────────────────
import type { Flashcard } from '@/types';

interface FlashcardState {
  cards: Flashcard[];
  currentIdx: number;
  flipped: boolean;
  known: Set<string>;
  view: 'review' | 'add' | 'generate' | 'done';

  setCards:    (c: Flashcard[]) => void;
  addCard:     (c: Flashcard) => void;
  setFlipped:  (v: boolean) => void;
  toggleFlip:  () => void;
  markKnown:   (id: string) => void;
  nextCard:    () => void;
  prevCard:    () => void;
  setView:     (v: FlashcardState['view']) => void;
  reset:       () => void;
}

export const useFlashStore = create<FlashcardState>()((set, get) => ({
  cards: [],
  currentIdx: 0,
  flipped: false,
  known: new Set(),
  view: 'review',

  setCards:   (cards) => set({ cards }),
  addCard:    (c) => set((s) => ({ cards: [...s.cards, c] })),
  setFlipped: (flipped) => set({ flipped }),
  toggleFlip: () => set((s) => ({ flipped: !s.flipped })),

  markKnown: (id) => {
    const { known, currentIdx, cards } = get();
    const newKnown = new Set(known);
    newKnown.add(id);
    set({ known: newKnown, flipped: false });
    if (currentIdx < cards.length - 1) set({ currentIdx: currentIdx + 1 });
    else set({ view: 'done' });
  },

  nextCard: () => {
    const { currentIdx, cards } = get();
    set({ currentIdx: Math.min(currentIdx + 1, cards.length - 1), flipped: false });
  },
  prevCard: () => {
    const { currentIdx } = get();
    set({ currentIdx: Math.max(0, currentIdx - 1), flipped: false });
  },
  setView: (view) => set({ view }),
  reset:   () => set({ currentIdx: 0, flipped: false, known: new Set(), view: 'review' }),
}));
