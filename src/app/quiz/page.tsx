
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
// IMPORTANT: PRE-GENERATED THEME DESCRIPTIONS
// =====================================================================================
// After running the `describeReferenceTheme` flow for each of your 5 'Code'
// and 5 'Chaos' reference images, PASTE THE COMBINED DESCRIPTIONS HERE.
// For example, concatenate all 5 'Code' descriptions into one string for
// PREGENERATED_CODE_THEME_DESCRIPTION.
//
// EXAMPLE:
// const PREGENERATED_CODE_THEME_DESCRIPTION = `
//   Image 1: Features a chrome robot arm holding a glowing plasma pistol...
//   Image 2: Shows intricate neon circuit board patterns with orange data streams...
//   Image 3: Depicts a holographic interface with geometric shapes...
//   Image 4: Contains a sleek, metallic drone with glowing orange thrusters...
//   Image 5: Highlights a futuristic cityscape with sharp angles and data conduits...
// `;
// const PREGENERATED_CHAOS_THEME_DESCRIPTION = `
//   Image 1: Displays a glitchy digital entity with fragmented light effects...
//   Image 2: Shows chaotic energy lines in neon yellow and magenta...
//   Image 3: Depicts an abstract explosion of distorted pixels and static...
//   Image 4: Contains a bio-mechanical tendril with pulsating yellow veins...
//   Image 5: Highlights a fractured reality with overlapping, distorted planes...
// `;
//
// Ensure these descriptions accurately reflect the objects, props, and style
// you want to inspire the AI for each theme.
// =====================================================================================

const PREGENERATED_CODE_THEME_DESCRIPTION: string = `
PASTE YOUR COMBINED 'CODE' THEME DESCRIPTIONS HERE. 
This should be a detailed account of objects, props, and thematic elements 
from your 5 'Code' reference images.
`;

const PREGENERATED_CHAOS_THEME_DESCRIPTION: string = `
PASTE YOUR COMBINED 'CHAOS' THEME DESCRIPTIONS HERE.
This should be a detailed account of objects, props, and thematic elements
from your 5 'Chaos' reference images.
`;


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

  const handleAnswer = async (choice: 'Code' | 'Chaos') => {
    if (!currentQuestion || !transformedImage) return;

    setIsLoading(true);
    setError(null);
    setShowGlitch(true);

    try {
      const themeDescription = choice === 'Code' ? PREGENERATED_CODE_THEME_DESCRIPTION : PREGENERATED_CHAOS_THEME_DESCRIPTION;
      
      // Basic check if placeholder text is still there
      if (themeDescription.includes("PASTE YOUR COMBINED")) {
        console.warn(`Warning: Placeholder text found in ${choice.toUpperCase()}_THEME_DESCRIPTION. AI might not use specific details.`);
        toast({
            title: "Theme Description Placeholder",
            description: `The pre-generated description for '${choice}' theme seems to be a placeholder. Please update it in quiz/page.tsx for best results.`,
            variant: "default",
            duration: 7000,
        });
      }


      const transformationResult = await transformImage({
        photoDataUri: transformedImage,
        choice,
        questionNumber: currentQuestionIndex + 1,
        referenceThemeDescription: themeDescription.trim(),
      });

      submitAnswer(currentQuestion.id, choice, transformationResult.transformedPhotoDataUri);

      if (currentQuestionIndex < questions.length - 1) {
        nextQuestion();
      } else {
        const summaryResult = await generateSummaryFromImage({
          transformedPhotoDataUri: transformationResult.transformedPhotoDataUri,
        });
        setSummaryAndTitle(summaryResult.summary, `Judgment: ${choice} Protocol`);
        router.push('/results');
      }
    } catch (err) {
      console.error("AI processing error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown AI error";
      setError(`AI ERROR: ${errorMessage}`);
      toast({
        title: "AI Processing Error",
        description: `Could not process your choice: ${errorMessage}`,
        variant: "destructive",
      });
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
          QUESTION {currentQuestionIndex + 1}/${questions.length}
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
          <NeonButton
            neonColor="primary"
            onClick={() => handleAnswer('Code')}
            disabled={isLoading}
            className="w-full sm:flex-1"
          >
            CODE
          </NeonButton>
          <NeonButton
            neonColor="secondary"
            onClick={() => handleAnswer('Chaos')}
            disabled={isLoading}
            className="w-full sm:flex-1"
          >
            CHAOS
          </NeonButton>
        </div>
        
        {isLoading && (
          <p className="text-lg neon-text-primary animate-pulse">Processing your destiny...</p>
        )}
      </div>
    </main>
  );
}
