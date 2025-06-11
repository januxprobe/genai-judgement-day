
import { create } from 'zustand';

export interface QuizQuestion {
  id: number;
  text: string;
  answers: { text: string; protocol: "TerminAEtor" | "TerminAItor" }[];
}

// Utility function to shuffle an array and get the first n items
const getShuffledQuestions = (array: QuizQuestion[], numQuestions: number): QuizQuestion[] => {
    // Create a copy of the array to avoid modifying the original
    const shuffled = [...array];

    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, numQuestions);
};


interface GameState {
  originalImage: string | null;
  transformedImage: string | null;
  currentQuestionIndex: number;
  questions: QuizQuestion[];
  answers: { questionId: number; choice: 'TerminAEtor' | 'TerminAItor' }[];
  summary: string | null;
  title: string;
  isLoading: boolean;
  error: string | null;

  startQuiz: (image: string) => void;
  submitAnswer: (questionId: number, protocol: 'TerminAEtor' | 'TerminAItor', newTransformedImage: string) => void;
  setSummaryAndTitle: (summary: string, title: string) => void;
  nextQuestion: () => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetGame: () => void;
  getCurrentQuestion: () => QuizQuestion | undefined;
}

export const initialQuestions: QuizQuestion[] = [
  // Ideation & Strategy
  {
    id: 1,
    text: "When starting a new project, what is the first, smallest, and most valuable problem we can solve with AI?",
    answers: [
      { text: "Identify a narrow, high-impact business case where a simple AI solution can deliver immediate value and serve as a foundation for future iterations.", protocol: "TerminAEtor" },
      { text: "Attempt to build a massive, all-encompassing AI that solves every problem at once, without a clear starting point or defined scope.", protocol: "TerminAItor" }
    ]
  },
  {
    id: 2,
    text: "Is AI the most appropriate tool for this specific problem, or could a simpler, non-AI solution be more effective?",
    answers: [
      { text: "Use a powerful tool only when it's applicable. First, evaluate if the problem truly requires AI; otherwise, opt for a traditional, more straightforward approach.", protocol: "TerminAEtor" },
      { text: "We have a powerful AI hammer, so every problem looks like a nail. Apply AI everywhere, even when it's overkill.", protocol: "TerminAItor" }
    ]
  },
  {
    id: 3,
    text: "How do we determine if a task requires a simple prompt, a structured workflow, or a complex, thinking AI agent?",
    answers: [
      { text: "Start small with a prompt. If that's not enough, escalate to a workflow. Only for the most complex, dynamic problems do we implement an AI agent. We don't use a bazooka to kill a mosquito.", protocol: "TerminAEtor" },
      { text: "Always jump straight to building the most complex AI agent possible; it's more impressive and will surely handle everything.", protocol: "TerminAItor" }
    ]
  },
  {
    id: 4,
    text: "Which stakeholders and direct end-users must be included in the initial ideation phase to ensure we build a valuable solution?",
    answers: [
      { text: "Sit together with stakeholders and the direct users of the solution from day one to define a valuable, small-scale idea to implement first.", protocol: "TerminAEtor" },
      { text: "The tech team knows best. Build the solution in isolation and then present the finished product to the users.", protocol: "TerminAItor" }
    ]
  },
  {
    id: 5,
    text: "What is our strategy for model selection? Should we start with the most powerful model to validate the concept and then optimize for cost and speed?",
    answers: [
      { text: "Start with the best, most expensive model to verify the concept can work. Then, iteratively scale back to a faster, more cost-effective model that still meets our quality standards.", protocol: "TerminAEtor" },
      { text: "Pick the cheapest, fastest model from the start to save money, even if it compromises the initial quality and viability of the proof of concept.", protocol: "TerminAItor" }
    ]
  },
  // Development & Implementation
  {
    id: 6,
    text: "How can we build the simplest possible version of the product to begin the feedback loop?",
    answers: [
      { text: "Build the minimum viable product in a short sprint, focusing on one core function, so we can get it into users' hands and start collecting feedback immediately.", protocol: "TerminAEtor" },
      { text: "Spend months building a feature-complete product before letting anyone see it, assuming we know exactly what users want.", protocol: "TerminAItor" }
    ]
  },
  {
    id: 7,
    text: "What kind of input data (e.g., questions, expected outputs) do we need from users to train and guide the AI effectively?",
    answers: [
      { text: "Ask users for an Excel file or a list with plenty of sample inputs and their expected outputs. This helps us train the AI and tailor the prompts for relevance.", protocol: "TerminAEtor" },
      { text: "Let the AI figure it out. It has ingested the entire internet, so it should know what to do without specific examples from our users.", protocol: "TerminAItor" }
    ]
  },
  {
    id: 8,
    text: "How do we bake human-in-the-loop checks into every layer of the build process?",
    answers: [
      { text: "Integrate human oversight at every stage: ideation, building, measuring, and learning. We are in the driver's seat, not the AI.", protocol: "TerminAEtor" },
      { text: "Automate everything from the start. The goal is to remove humans from the process entirely to achieve maximum efficiency.", protocol: "TerminAItor" }
    ]
  },
  {
    id: 9,
    text: "When building a solution, how do we provide the AI with the right context and documentation to ensure its responses are accurate?",
    answers: [
      { text: "Feed the AI with specific, relevant documentation, historical data, and clear examples to steer its responses and ground them in reality.", protocol: "TerminAEtor" },
      { text: "Rely solely on the LLM's pre-existing knowledge and hope it provides answers that are relevant to our specific business case.", protocol: "TerminAItor" }
    ]
  },
  {
    id: 10,
    text: "For complex tasks, how do we break down the problem into smaller steps that a workflow or agent can execute sequentially?",
    answers: [
      { text: "Define a clear plan or workflow where the AI tackles one subtask at a time, generating a section or completing a step before moving to the next.", protocol: "TerminAEtor" },
      { text: "Give the AI a single, massive prompt and expect it to generate a perfect, multi-page document in one go without any intermediate steps.", protocol: "TerminAItor" }
    ]
  },
  // Testing & Verification
  {
    id: 11,
    text: "How will we measure the AI's performance and gather feedback from direct users during the initial testing phase?",
    answers: [
      { text: "Observe a small group of direct users interacting with the system through defined scenarios. Log their questions and the AI's responses to analyze performance.", protocol: "TerminAEtor" },
      { text: "Release it to everyone at once and assume no news is good news. If we don't hear complaints, it must be working perfectly.", protocol: "TerminAItor" }
    ]
  },
  {
    id: 12,
    text: "What does a good or complete enough response look like from the user's perspective, and how do we test against that standard?",
    answers: [
      { text: "We work with users to define the criteria for a successful answer—is it detailed, complete, and in the right tone? We then use this to evaluate the AI's output.", protocol: "TerminAEtor" },
      { text: "If the AI generates a grammatically correct response, we consider the task complete. The subjective quality is not our concern.", protocol: "TerminAItor" }
    ]
  },
  {
    id: 13,
    text: "How do we trace the AI's reasoning, such as seeing which tools an agent uses, to understand its decision-making process?",
    answers: [
      { text: "Log every step the AI takes—which tools are called, in what order, and with what results. This allows us to understand its process and debug when things go wrong.", protocol: "TerminAEtor" },
      { text: "Treat the AI as a black box. As long as it produces an output, we don't need to know how it got there.", protocol: "TerminAItor" }
    ]
  },
  {
    id: 14,
    text: "What is our process for verifying the AI's output against source documents to mitigate the risk of hallucination?",
    answers: [
      { text: "Always cite the sources used to generate a response. Provide users with direct links to the source documents so they can verify the information themselves.", protocol: "TerminAEtor" },
      { text: "Trust the LLM's output implicitly. Hallucinations are a known risk, but it's too much effort to double-check everything.", protocol: "TerminAItor" }
    ]
  },
  {
    id: 15,
    text: "When testing, how can we determine if the AI's answers are detailed enough, or if they are providing too much information?",
    answers: [
      { text: "Through user observation and feedback, we fine-tune the level of detail. We need the user to tell us if the response is just right, too vague, or overwhelming.", protocol: "TerminAEtor" },
      { text: "More information is always better. We'll configure the AI to provide the most verbose answers possible to cover all bases.", protocol: "TerminAItor" }
    ]
  },
  // Maintenance & Iteration
  {
    id: 16,
    text: "What mechanisms, like a 'thumbs up/thumbs down' feature, will we implement for users to provide ongoing feedback on the AI's responses?",
    answers: [
      { text: "Integrate simple feedback tools like 'thumbs up/thumbs down' into the user interface, making it easy for users to report both good and bad responses instantly.", protocol: "TerminAEtor" },
      { text: "If users have a problem, they can submit a formal support ticket. We don't need a constant stream of low-level feedback.", protocol: "TerminAItor" }
    ]
  },
  {
    id: 17,
    text: "When a user reports a 'thumbs down' or a bad response, what is our process for analyzing the session to identify and fix the root cause?",
    answers: [
      { text: "A 'thumbs down' triggers a human review. We analyze the entire session—the initial question, the AI's response, and the context—to understand what went wrong and fix it.", protocol: "TerminAEtor" },
      { text: "We'll aggregate the 'thumbs down' data into a quarterly report. If a trend emerges, we might look into it then.", protocol: "TerminAItor" }
    ]
  },
  {
    id: 18,
    text: "Based on user feedback and performance data, how do we decide whether to continue on the current path or pivot our approach?",
    answers: [
      { text: "Use the insights from the learn phase to decide our next move. We assess if the AI is behaving as expected or if we need to change the data, prompts, or even the entire approach.", protocol: "TerminAEtor" },
      { text: "Stick to the original project plan, regardless of what the initial user feedback says. Pivoting is a sign of failure.", protocol: "TerminAItor" }
    ]
  },
  {
    id: 19,
    text: "How do we use the insights from each sprint to scale the solution iteratively, adding functionality only when necessary?",
    answers: [
      { text: "Operate in a spiral, building upon the previous sprint. We add more functionality or more advanced AI tools only when there is a clear need and value demonstrated.", protocol: "TerminAEtor" },
      { text: "Front-load the project with every feature we can imagine. The goal is to launch a big, impressive product, not to build it piece by piece.", protocol: "TerminAItor" }
    ]
  },
  {
    id: 20,
    text: "How do we ensure that even after deployment, a human is always overseeing the system's performance and user satisfaction?",
    answers: [
      { text: "Human oversight is perpetual. We continuously monitor how the AI is behaving in production and how users are interacting with it to ensure it remains effective and aligned with their needs.", protocol: "TerminAEtor" },
      { text: "Once the project is deployed, our job is done. The system should run itself, and we'll only intervene if there's a major outage.", protocol: "TerminAItor" }
    ]
  }
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

  startQuiz: (image) => {
    const selectedQuestions = getShuffledQuestions(initialQuestions, 5); // Using 5 questions for now
    set({
      originalImage: image,
      transformedImage: image,
      questions: selectedQuestions,
      currentQuestionIndex: 0,
      answers: [],
      summary: null,
      isLoading: false,
      error: null,
    });
  },
  submitAnswer: (questionId, protocol, newTransformedImage) => set((state) => ({
    answers: [...state.answers, { questionId, choice: protocol }],
    transformedImage: newTransformedImage,
  })),
  setSummaryAndTitle: (summary, title) => set({ summary, title }),
  nextQuestion: () => set((state) => ({ currentQuestionIndex: state.currentQuestionIndex + 1 })),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  resetGame: () => {
    const selectedQuestions = getShuffledQuestions(initialQuestions, 5); // Using 5 questions
    set({
      originalImage: null,
      transformedImage: null,
      currentQuestionIndex: 0,
      questions: selectedQuestions,
      answers: [],
      summary: null,
      title: "Your Judgment",
      isLoading: false,
      error: null,
    });
  },
  getCurrentQuestion: () => {
    const state = get();
    return state.questions[state.currentQuestionIndex];
  },
}));

