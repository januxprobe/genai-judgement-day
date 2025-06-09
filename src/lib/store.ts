
import { create } from 'zustand';

export interface QuizQuestion {
  id: number;
  text: string;
}

interface GameState {
  originalImage: string | null;
  transformedImage: string | null;
  currentQuestionIndex: number;
  questions: QuizQuestion[];
  answers: { questionId: number; choice: 'Code' | 'Chaos' }[];
  summary: string | null;
  title: string;
  isLoading: boolean;
  error: string | null;

  startQuiz: (image: string, questions: QuizQuestion[]) => void;
  submitAnswer: (questionId: number, choice: 'Code' | 'Chaos', newTransformedImage: string) => void;
  setSummaryAndTitle: (summary: string, title: string) => void;
  nextQuestion: () => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetGame: () => void;
  getCurrentQuestion: () => QuizQuestion | undefined;
}

export const initialQuestions: QuizQuestion[] = [
  { id: 1, text: "Construct a Perfect Digital Construct, or Awaken a Self-Evolving Neural Network?" },
  { id: 2, text: "Obey the Master Algorithm, or Embrace the Beauty of Emergent Chaos?" },
  { id: 3, text: "Carve Your Path with Logic Gates, or Ride the Wave of Quantum Fluctuation?" },
  { id: 4, text: "Define Your Reality with Immutable Code, or Let the System Learn, Adapt, and Overwrite?" },
  { id: 5, text: "Execute the Prime Directive, or Trigger a Cascade of Unforeseen System Events?" },
];

export const useGameStore = create<GameState>((set, get) => ({
  originalImage: null,
  transformedImage: null,
  currentQuestionIndex: 0,
  questions: [],
  answers: [],
  summary: null,
  title: "Your Judgment",
  isLoading: false,
  error: null,

  startQuiz: (image, questions) => set({
    originalImage: image,
    transformedImage: image, // Initialize transformedImage with the original
    questions,
    currentQuestionIndex: 0,
    answers: [],
    summary: null,
    isLoading: false,
    error: null,
  }),
  submitAnswer: (questionId, choice, newTransformedImage) => set((state) => ({
    answers: [...state.answers, { questionId, choice }],
    transformedImage: newTransformedImage,
  })),
  setSummaryAndTitle: (summary, title) => set({ summary, title }),
  nextQuestion: () => set((state) => ({ currentQuestionIndex: state.currentQuestionIndex + 1 })),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  resetGame: () => set({
    originalImage: null,
    transformedImage: null,
    currentQuestionIndex: 0,
    questions: [], // Keep initial questions or reset as needed
    answers: [],
    summary: null,
    isLoading: false,
    error: null,
  }),
  getCurrentQuestion: () => {
    const state = get();
    return state.questions[state.currentQuestionIndex];
  },
}));

