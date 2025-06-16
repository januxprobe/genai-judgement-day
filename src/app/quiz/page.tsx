
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useGameStore } from '@/lib/store';
import { transformImage } from '@/ai/flows/transform-image-based-on-quiz-answer';
import { generateSummaryFromImage } from '@/ai/flows/generate-summary-from-image';
import NeonButton from '@/components/neon-button';
import CrtOverlay from '@/components/crt-overlay';
import LoadingSpinner from '@/components/loading-spinner';
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from 'lucide-react';

// =====================================================================================
// PRE-GENERATED THEME DESCRIPTIONS
// =====================================================================================
const PREGENERATED_TERMINAETOR_THEME_DESCRIPTIONS: string[] = [
  `add in the background, behind the person, a tropical beach with a thatched umbrella and two modern lounge chairs on pristine white sand. Turquoise ocean water fades to deep blue. Bright blue sky with scattered white clouds. Vivid, clean, sunny, paradise vacation aesthetic.`,
  `add in the background, behind the person, two tall palm trees on the right side of a sunlit tropical beach, casting long, spiky shadows on soft sand. Highly saturated colors, crisp lighting, clear blue sky. Picture-perfect, high-definition travel photography style.`,
  `Add on the persons face, a single pair of bold, rectangular sunglasses with thick, glossy black frames and vibrant solid orange lenses. The molded nose bridge curves smoothly between the lenses. Thick temple arms match the black finish, with a hint of brown inner detail near the hinge.`,
  `add on the persons head a single, classic baseball cap in solid, vibrant orange. It has a curved brim, multi-panel crown with visible stitching, and a fabric-covered button at the top. Made of matte cotton twill with subtle woven texture. The front is completely blank, with no logos or text.`,
  `Add on the persons lap an open Apple MacBook with a vibrant orange, matte-finish hard case. The case has a cutout revealing the white AE logo on the lid.`,
];

const PREGENERATED_TERMINAITOR_THEME_DESCRIPTIONS: string[] = [
  `add in the background, behind the person, a post-apocalyptic night scene with burning rubble, twisted steel, and glowing embers. 1980s dystopian sci-fi style, industrial futurism, cinematic lighting, dark and menacing atmosphere.`,
  `add in the background a terminator-like robots with red gloawing eyes running towards the person in the forground.`,
  `add in the background a large, black semi-truck with a shattered windshield and heavy front-end damage with a terminator-like robot with glowing red eyes crwaling over it. Gritty, fast-paced, '90s action movie style with intense motion`,
  //`add in the background one tough, athletic woman. She wears dark tactical pants with a belt of gear, a fitted black tank top, and dark sunglasses. Her hair is in a pony tail, and she has a focused, battle-ready stance. She is wrestling with a terminator-like robot.`,
  `add a worn black leather motorcycle jacket and dark square sunglasses to the person or robot in the foreground. He sits on  a black motorcycle, partially visible, with chrome detailing and a low-slung frame. `,
  `change the person into a metallic humanoid endoskeleton, resembling the T-800 from Terminator. The head is a chrome skull with glowing red eyes, weathered and scratched, with exposed pistons and chrome-plated teeth in a grimace. Visible torso and neck show raw mechanical components, thick neck pistons, and industrial plating.`,
];


export default function QuizPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    transformedImage,
    currentQuestionIndex,
    questions,
    submitAnswer,
    nextQuestion,
    setIsLoading,
    isLoading,
    setError,
    error,
    setSummaryAndTitle,
    getCurrentQuestion,
    resetGame,
  } = useGameStore();

  const currentQuestion = getCurrentQuestion();
  const [showGlitch, setShowGlitch] = useState(false);

  useEffect(() => {
    if (!transformedImage && !isLoading) { 
      toast({
        title: "Session Expired",
        description: "No image found. Redirecting to start.",
        variant: "destructive"
      });
      resetGame();
      router.push('/');
    }
  }, [transformedImage, isLoading, router, toast, resetGame]);

  const handleAnswer = async (choice: 'TerminAEtor' | 'TerminAItor') => {
    if (!currentQuestion || !transformedImage) return;

    setIsLoading(true);
    setError(null);
    setShowGlitch(true);

    try {
      const themeDescriptionsArray = choice === 'TerminAEtor' ? PREGENERATED_TERMINAETOR_THEME_DESCRIPTIONS : PREGENERATED_TERMINAITOR_THEME_DESCRIPTIONS;
      
      let currentThemeDescription = "";
      if (themeDescriptionsArray && themeDescriptionsArray.length > currentQuestionIndex) {
        currentThemeDescription = themeDescriptionsArray[currentQuestionIndex];
      } else {
        console.warn(`Warning: Not enough theme descriptions for ${choice.toUpperCase()} theme. Question index ${currentQuestionIndex} is out of bounds for an array of length ${themeDescriptionsArray?.length || 0}.`);
         toast({
            title: `Missing Theme Description (Q${currentQuestionIndex + 1})`,
            description: `No pre-generated description found for '${choice}' theme for this question. Default theming will apply.`,
            variant: "default",
            duration: 7000,
        });
      }
      
      if (currentThemeDescription.includes("PASTE YOUR") || currentThemeDescription.trim() === "") {
        console.warn(`Warning: Placeholder text or empty description found for ${choice.toUpperCase()} theme, question ${currentQuestionIndex + 1}. AI might not use specific details for this step.`);
      }


      const transformationResult = await transformImage({
        photoDataUri: transformedImage,
        choice,
        questionNumber: currentQuestionIndex + 1,
        referenceThemeDescription: currentThemeDescription.trim(),
      });

      submitAnswer(currentQuestion.id, choice, transformationResult.transformedPhotoDataUri);

      if (currentQuestionIndex < questions.length - 1) {
        nextQuestion();
      } else {
        const summaryResult = await generateSummaryFromImage({
          transformedPhotoDataUri: transformationResult.transformedPhotoDataUri,
        });
        setSummaryAndTitle(summaryResult.summary, `Judgment: ${choice}`);
        router.push('/results');
      }
    } catch (err) {
      console.error("AI processing error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown AI error";
      
      if (errorMessage.toLowerCase().includes("moderated")) {
        setError("CONTENT MODERATED: Your image transformation was flagged by our safety system. Please try a different image or choice.");
        toast({
          title: "Content Moderated",
          description: "The image transformation was flagged by our safety system. Please try a different approach.",
          variant: "destructive",
          duration: 7000, 
        });
      } else {
        setError(`AI ERROR: ${errorMessage}`);
        toast({
          title: "AI Processing Error",
          description: `Could not process your choice: ${errorMessage}`,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => setShowGlitch(false), 500); 
    }
  };
  
  if (!currentQuestion && questions.length > 0 && currentQuestionIndex >= questions.length) {
     router.push('/results');
     return <LoadingSpinner text="Loading Results..." color="primary" />;
  }

  if (!currentQuestion || !transformedImage) {
    return <LoadingSpinner text="INITIALIZING DIRECTIVE..." color="primary" />;
  }

  return (
    <main className={`flex-grow flex flex-col items-center justify-center p-4 md:p-8 min-h-screen relative overflow-hidden ${showGlitch ? 'glitch-transition' : ''}`}>
      <CrtOverlay className="fixed inset-0" />
      <div className="z-10 w-full max-w-4xl mx-auto flex flex-col items-center space-y-8">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-headline neon-text-primary text-center uppercase glitch-text" data-text={`QUESTION ${currentQuestionIndex + 1}/${questions.length}`}>
          QUESTION {currentQuestionIndex + 1}/{questions.length}
        </h2>

        <div className="relative w-full max-w-md aspect-[4/3] bg-black border-2 border-primary rounded-lg shadow-[0_0_15px_theme(colors.primary.DEFAULT)] overflow-hidden">
          <Image src={transformedImage} alt="Your transformed self" layout="fill" objectFit="cover" />
          <CrtOverlay />
          {isLoading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
              <LoadingSpinner text="ANALYZING CHOICE..." color="secondary" />
            </div>
          )}
        </div>
        
        <p className="text-2xl md:text-3xl neon-text-secondary text-center min-h-[3em] flex items-center justify-center">
          {currentQuestion.text}
        </p>

        {error && (
          <div className="my-4 p-4 bg-destructive/20 border border-destructive rounded-md text-destructive-foreground flex items-center gap-2">
            <AlertTriangle size={24} />
            <p className="text-lg font-headline">{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-6 w-full max-w-lg">
          {currentQuestion.answers.map((answer, index) => (
            <NeonButton
              key={index}
              neonColor={answer.protocol === 'TerminAEtor' ? 'primary' : 'secondary'}
              onClick={() => handleAnswer(answer.protocol)}
              disabled={isLoading}
              className="w-full sm:flex-1"
            >
              {answer.text}
            </NeonButton>
          ))}
        </div>
        
        {isLoading && (
          <p className="text-lg neon-text-primary animate-pulse">Processing your destiny...</p>
        )}
      </div>
    </main>
  );
}
