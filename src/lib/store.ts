
import { create } from 'zustand';

export interface QuizQuestion {
  id: number;
  text: string;
  answers: { text: string; protocol: "Code" | "Chaos" }[];
}

interface GameState {
  originalImage: string | null;
  transformedImage: string | null; // Added to store the current image for the quiz
  currentQuestionIndex: number;
  questions: QuizQuestion[];
  answers: { questionId: number; choice: 'Code' | 'Chaos' }[];
  summary: string | null;
  title: string;
  isLoading: boolean;
  error: string | null;

  startQuiz: (image: string, questions: QuizQuestion[]) => void;
  submitAnswer: (questionId: number, protocol: 'Code' | 'Chaos', newTransformedImage: string) => void; // Updated signature
  setSummaryAndTitle: (summary: string, title: string) => void;
  nextQuestion: () => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetGame: () => void;
  getCurrentQuestion: () => QuizQuestion | undefined;
}

export const initialQuestions: QuizQuestion[] = [
  {
    id: 1, text: "Construct a Perfect Digital Construct, or Awaken a Self-Evolving Neural Network?",
    answers: [{ text: "Perfect Digital Construct", protocol: "Code" }, { text: "Self-Evolving Neural Network", protocol: "Chaos" }]
  },
  {
    id: 2, text: "Obey the Master Algorithm, or Embrace the Beauty of Emergent Chaos?",
    answers: [{ text: "Obey the Master Algorithm", protocol: "Code" }, { text: "Embrace the Beauty of Emergent Chaos", protocol: "Chaos" }]
  },
  {
    id: 3, text: "Carve Your Path with Logic Gates, or Ride the Wave of Quantum Fluctuation?",
    answers: [{ text: "Carve Your Path with Logic Gates", protocol: "Code" }, { text: "Ride the Wave of Quantum Fluctuation", protocol: "Chaos" }]
  },
  {
    id: 4, text: "Define Your Reality with Immutable Code, or Let the System Learn, Adapt, and Overwrite?",
    answers: [{ text: "Define Your Reality with Immutable Code", protocol: "Code" }, { text: "Let the System Learn, Adapt, and Overwrite", protocol: "Chaos" }]
  },
  {
    id: 5, text: "Execute the Prime Directive, or Trigger a Cascade of Unforeseen System Events?",
    answers: [{ text: "Execute the Prime Directive", protocol: "Code" }, { text: "Trigger a Cascade of Unforeseen System Events", protocol: "Chaos" }]
  },
];


export const useGameStore = create<GameState>((set, get) => ({
  originalImage: null,
  transformedImage: null, // Initialized transformedImage
  currentQuestionIndex: 0,
  questions: [],
  answers: [],
  summary: null,
  title: "Your Judgment",
  isLoading: false,
  error: null,

  startQuiz: (image, questions) => set({
    originalImage: image,
    transformedImage: image, // Set initial transformedImage
    questions,
    currentQuestionIndex: 0,
    answers: [],
    summary: null,
    isLoading: false,
    error: null,
  }),
  submitAnswer: (questionId, protocol, newTransformedImage) => set((state) => ({
    answers: [...state.answers, { questionId, choice: protocol }],
    transformedImage: newTransformedImage, // Update transformedImage
  })),
  setSummaryAndTitle: (summary, title) => set({ summary, title }),
  nextQuestion: () => set((state) => ({ currentQuestionIndex: state.currentQuestionIndex + 1 })),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  resetGame: () => set({
    originalImage: null,
    transformedImage: null,
    currentQuestionIndex: 0,
    questions: [], 
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
