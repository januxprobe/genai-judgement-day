
"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useGameStore, initialQuestions, type QuizQuestion } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import EmailForm from '@/components/email-form';
import CrtOverlay from '@/components/crt-overlay';
import NeonButton from '@/components/neon-button';
import LoadingSpinner from '@/components/loading-spinner';
import { ArrowLeft } from 'lucide-react';
import VerdictAnalysis from '@/components/verdict-analysis';

export default function ResultsPage() {
  const router = useRouter();
  const { 
    transformedImage, 
    summary, 
    title: gameStoreTitle, 
    isLoading, 
    resetGame,
    questions: gameStoreQuestions, // Actual questions asked in this game session
    answers: gameStoreAnswers // User's answers from this game session
  } = useGameStore();
  const [showGlitch, setShowGlitch] = useState(true); // Start with glitch on load

  useEffect(() => {
    if (!transformedImage && !isLoading) { // if there's no image and not loading
      router.push('/');
    }
    // Disable glitch after a short period
    const timer = setTimeout(() => setShowGlitch(false), 500);
    return () => clearTimeout(timer);
  }, [transformedImage, isLoading, router]);

  const handlePlayAgain = () => {
    resetGame();
    router.push('/');
  };

  let pageStaticTitle = "Judgment Rendered";
  let verdictSuffix = "";
  let titleColorClass = "neon-text-primary"; // Default to orange

  if (gameStoreTitle) {
    if (gameStoreTitle.includes("TerminAEtor")) {
      verdictSuffix = "TerminAEtor"; // Correct capitalization
      titleColorClass = "neon-text-primary";
    } else if (gameStoreTitle.includes("TerminAItor")) {
      verdictSuffix = "TerminAItor"; // Correct capitalization
      titleColorClass = "neon-text-secondary";
    }
  }

  const fullPageTitle = verdictSuffix ? `${pageStaticTitle}: ${verdictSuffix}` : pageStaticTitle;
  const dataTextGlitch = fullPageTitle.toUpperCase();


  if (isLoading) {
    return (
       <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8 min-h-screen relative overflow-hidden">
         <CrtOverlay className="fixed inset-0" />
         <LoadingSpinner text="COMPILING JUDGMENT..." color="primary" />
       </main>
    );
  }
  
  if (!transformedImage) {
     // This will be handled by redirect in useEffect, but good to have a fallback.
     return (
        <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8 min-h-screen relative overflow-hidden">
            <CrtOverlay className="fixed inset-0" />
            <p className="text-2xl neon-text-primary">No judgment data found. Redirecting...</p>
        </main>
     );
  }

  return (
    <main className={`flex-grow flex flex-col items-center justify-center p-4 md:p-8 min-h-screen relative overflow-hidden ${showGlitch ? 'glitch-transition' : ''}`}>
      <CrtOverlay className="fixed inset-0" />
      <div className="z-10 w-full max-w-5xl mx-auto space-y-8">
        <header className="text-center mb-8">
          <h1 className={`text-5xl md:text-6xl font-headline uppercase glitch-text ${titleColorClass}`} data-text={dataTextGlitch}>
            {fullPageTitle}
          </h1>
        </header>

        <div className="flex flex-col gap-8 items-center md:items-stretch">
          <Card className="bg-card border-primary shadow-[0_0_15px_theme(colors.primary.DEFAULT)] w-full max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
            <CardContent className="relative aspect-[4/3] w-full overflow-hidden rounded-lg p-0"> {/* p-0 if no header */}
              {transformedImage && (
                <Image src={transformedImage} alt="Final transformed image" layout="fill" objectFit="cover" />
              )}
              <CrtOverlay />
            </CardContent>
          </Card>

          <div className="space-y-8 w-full max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
            <Card className="bg-card border-secondary shadow-[0_0_15px_theme(colors.secondary.DEFAULT)]">
              <CardHeader>
                <CardTitle className="text-3xl neon-text-secondary uppercase">Verdict & Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <VerdictAnalysis />
                
                <CardDescription className="text-lg text-foreground leading-relaxed whitespace-pre-wrap mt-6 pt-6 border-t border-border">
                  {summary || "No summary available."}
                </CardDescription>
                
                {gameStoreAnswers && gameStoreAnswers.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <h3 className="text-2xl font-headline neon-text-primary mb-6 text-center uppercase">Your Protocol Path:</h3>
                    <ul className="space-y-8">
                      {gameStoreAnswers.map((answerEntry, index) => {
                        const questionAsked = gameStoreQuestions.find(q => q.id === answerEntry.questionId);
                        const originalQuestionDetails = initialQuestions.find(q => q.id === answerEntry.questionId);
                        
                        if (!questionAsked || !originalQuestionDetails) return null;

                        const chosenAnswerObject = originalQuestionDetails.answers.find(ans => ans.protocol === answerEntry.choice);
                        const chosenAnswerText = chosenAnswerObject ? chosenAnswerObject.text : "Answer text not found.";
                        
                        const avatarUrl = answerEntry.choice === 'TerminAEtor' 
                          ? "/assets/images/terminaetor-avatar.png" 
                          : "/assets/images/terminaitor-avatar.png";
                        
                        const avatarAlt = answerEntry.choice === 'TerminAEtor' 
                          ? "TerminAEtor Avatar" 
                          : "TerminAItor Avatar";
                        
                        const quoteBorderColor = answerEntry.choice === 'TerminAEtor' ? 'border-primary' : 'border-secondary';
                        const attributionColor = answerEntry.choice === 'TerminAEtor' ? 'text-primary/90' : 'text-secondary/90';
                        const avatarBorderColor = answerEntry.choice === 'TerminAEtor' ? 'border-primary' : 'border-secondary';

                        return (
                          <li key={index} className="flex flex-col space-y-3 p-4 bg-background/30 rounded-md border border-muted">
                            <p className="font-semibold text-xl text-foreground text-center neon-text-primary">Directive {index + 1}: <span className="text-foreground/90">{questionAsked.text}</span></p>
                            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                              <div className={`relative w-32 h-32 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 ${avatarBorderColor} flex-shrink-0`}>
                                <Image 
                                  src={avatarUrl} 
                                  alt={avatarAlt} 
                                  layout="fill" 
                                  objectFit="cover" 
                                  data-ai-hint={answerEntry.choice === 'TerminAEtor' ? "robot orange" : "robot cyan"}
                                />
                              </div>
                              <blockquote className={`italic text-foreground/90 border-l-4 ${quoteBorderColor} pl-4 py-2 text-base flex-grow`}>
                                <p>"{chosenAnswerText}"</p>
                                <footer className={`text-sm not-italic ${attributionColor} mt-2 font-headline`}>- {answerEntry.choice}</footer>
                              </blockquote>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-primary shadow-[0_0_10px_theme(colors.primary.DEFAULT)]">
              <CardHeader>
                <CardTitle className="text-3xl neon-text-primary uppercase">Secure Your Record</CardTitle>
              </CardHeader>
              <CardContent>
                <EmailForm />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="text-center mt-12">
          <NeonButton neonColor="secondary" onClick={handlePlayAgain}>
            <ArrowLeft className="mr-2 h-6 w-6"/> FACE JUDGMENT AGAIN
          </NeonButton>
        </div>
      </div>
    </main>
  );
}
