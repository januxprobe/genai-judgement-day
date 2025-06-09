
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

const CODE_REFERENCE_IMAGE_PATH = '/reference-themes/code-style.png';
const CHAOS_REFERENCE_IMAGE_PATH = '/reference-themes/chaos-style.png';

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
      let codeReferenceImageUri: string | undefined = undefined;
      let chaosReferenceImageUri: string | undefined = undefined;

      if (choice === 'Code') {
        codeReferenceImageUri = await imageUrlToDataUri(CODE_REFERENCE_IMAGE_PATH);
        if (!codeReferenceImageUri) {
          console.warn(`Could not load or convert code reference image from ${CODE_REFERENCE_IMAGE_PATH}. Proceeding without it.`);
          toast({
            title: "Reference Image Issue",
            description: "Could not load 'Code' reference image. AI will proceed without it.",
            variant: "default",
          });
        }
      } else if (choice === 'Chaos') {
        chaosReferenceImageUri = await imageUrlToDataUri(CHAOS_REFERENCE_IMAGE_PATH);
        if (!chaosReferenceImageUri) {
          console.warn(`Could not load or convert chaos reference image from ${CHAOS_REFERENCE_IMAGE_PATH}. Proceeding without it.`);
           toast({
            title: "Reference Image Issue",
            description: "Could not load 'Chaos' reference image. AI will proceed without it.",
            variant: "default",
          });
        }
      }

      const transformationResult = await transformImage({
        photoDataUri: transformedImage,
        choice,
        questionNumber: currentQuestionIndex + 1,
        codeReferenceImageUri,
        chaosReferenceImageUri,
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

