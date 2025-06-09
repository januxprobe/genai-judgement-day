
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
import { imageUrlToDataUri } from '@/lib/utils';

// Define arrays of paths for reference images.
// You can add more paths to these arrays if you have more images.
const CODE_REFERENCE_IMAGE_PATHS = [
  '/reference-themes/code-style-1.png',
  // '/reference-themes/code-style-2.png', // Example: add more if needed
];
const CHAOS_REFERENCE_IMAGE_PATHS = [
  '/reference-themes/chaos-style-1.png',
  // '/reference-themes/chaos-style-2.png', // Example: add more if needed
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

  const handleAnswer = async (choice: 'Code' | 'Chaos') => {
    if (!currentQuestion || !transformedImage) return;

    setIsLoading(true);
    setError(null);
    setShowGlitch(true);

    try {
      let referenceImageUris: string[] = [];
      const pathsToLoad = choice === 'Code' ? CODE_REFERENCE_IMAGE_PATHS : CHAOS_REFERENCE_IMAGE_PATHS;

      if (pathsToLoad.length > 0) {
        const dataUriPromises = pathsToLoad.map(path => imageUrlToDataUri(path));
        const results = await Promise.all(dataUriPromises);
        referenceImageUris = results.filter((uri): uri is string => uri !== undefined);

        if (referenceImageUris.length === 0 && pathsToLoad.length > 0) {
          console.warn(`Could not load or convert any reference images for '${choice}'. Proceeding without them.`);
          toast({
            title: "Reference Image Issue",
            description: `Could not load any '${choice}' reference images. AI will proceed without them.`,
            variant: "default",
          });
        } else if (referenceImageUris.length < pathsToLoad.length) {
           console.warn(`Some reference images for '${choice}' could not be loaded. Proceeding with available ones.`);
           toast({
            title: "Reference Image Issue",
            description: `Some '${choice}' reference images could not be loaded. AI will use the ones available.`,
            variant: "default",
          });
        }
      }

      const transformationResult = await transformImage({
        photoDataUri: transformedImage,
        choice,
        questionNumber: currentQuestionIndex + 1,
        codeReferenceImageUris: choice === 'Code' ? referenceImageUris : undefined,
        chaosReferenceImageUris: choice === 'Chaos' ? referenceImageUris : undefined,
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
