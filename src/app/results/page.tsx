
"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import EmailForm from '@/components/email-form';
import CrtOverlay from '@/components/crt-overlay';
import NeonButton from '@/components/neon-button';
import LoadingSpinner from '@/components/loading-spinner';
import { ArrowLeft } from 'lucide-react';

export default function ResultsPage() {
  const router = useRouter();
  const { transformedImage, summary, title, isLoading, resetGame } = useGameStore();
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
          <h1 className="text-5xl md:text-6xl font-headline neon-text-primary uppercase glitch-text" data-text="Judgment Rendered">
            Judgment Rendered
          </h1>
        </header>

        <div className="flex flex-col gap-8 items-center md:items-stretch">
          <Card className="bg-card border-primary shadow-[0_0_15px_theme(colors.primary.DEFAULT)] w-full max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl neon-text-primary uppercase">{title || "Final Transformation"}</CardTitle>
            </CardHeader>
            <CardContent className="relative aspect-[4/3] w-full overflow-hidden rounded-b-lg">
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
                <CardDescription className="text-lg text-foreground leading-relaxed whitespace-pre-wrap">
                  {summary || "No summary available."}
                </CardDescription>
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
