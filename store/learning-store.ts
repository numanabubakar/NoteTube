import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LearningSession {
  id: string;
  videoTitle: string;
  videoUrl: string;
  duration: number; // minutes
  notesGenerated: boolean;
  quizCompleted: boolean;
  score?: number;
  createdAt: Date;
}

export interface LearningStats {
  totalVideosProcessed: number;
  totalLearningTime: number; // minutes
  currentStreak: number;
  longestStreak: number;
  sessionsThisMonth: number;
  averageScore: number;
}

export interface LearningState {
  sessions: LearningSession[];
  stats: LearningStats;
  addSession: (session: LearningSession) => void;
  updateSession: (id: string, session: Partial<LearningSession>) => void;
  getStats: () => LearningStats;
}

const defaultStats: LearningStats = {
  totalVideosProcessed: 0,
  totalLearningTime: 0,
  currentStreak: 0,
  longestStreak: 0,
  sessionsThisMonth: 0,
  averageScore: 0,
};

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      sessions: [],
      stats: defaultStats,
      addSession: (session) => {
        set((state) => ({
          sessions: [session, ...state.sessions],
        }));
        get().getStats();
      },
      updateSession: (id, updates) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },
      getStats: () => {
        const sessions = get().sessions;
        const now = new Date();
        const thisMonth = sessions.filter(
          (s) =>
            new Date(s.createdAt).getMonth() === now.getMonth() &&
            new Date(s.createdAt).getFullYear() === now.getFullYear()
        );

        const totalTime = sessions.reduce((acc, s) => acc + s.duration, 0);
        const completedQuizzes = sessions.filter((s) => s.quizCompleted);
        const avgScore =
          completedQuizzes.length > 0
            ? completedQuizzes.reduce((acc, s) => acc + (s.score || 0), 0) /
              completedQuizzes.length
            : 0;

        const stats: LearningStats = {
          totalVideosProcessed: sessions.length,
          totalLearningTime: totalTime,
          currentStreak: 0,
          longestStreak: 0,
          sessionsThisMonth: thisMonth.length,
          averageScore: Math.round(avgScore),
        };

        set({ stats });
        return stats;
      },
    }),
    {
      name: 'learning-store',
    }
  )
);
