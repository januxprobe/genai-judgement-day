"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import WebcamCapture from '@/components/webcam-capture';
import { useGameStore } from '@/lib/store';
import CrtOverlay from '@/components/crt-overlay';
import { StartScreen } from '@/components/start-screen'; // Assuming the path is correct

export default function RecruitmentPage() {
  const router = useRouter();
  const startGame = useGameStore((state) => state.startQuiz);
  const [showStartScreen, setShowStartScreen] = useState(true);

  const handleImageCapture = (imageDataUrl: string) => {
    startGame(imageDataUrl);
    router.push('/quiz');
  };

  if (showStartScreen) {
    return <StartScreen onStart={() => setShowStartScreen(false)} />;
  }

  return (
    <main className="flex-grow flex flex-col items-center justify-center p-4 min-h-screen relative overflow-hidden">
      <CrtOverlay className="fixed inset-0" />
      <div className="z-10 w-full flex flex-col items-center">
        <header className="mb-8 md:mb-12 text-center">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-headline neon-text-primary uppercase glitch-text" data-text="GenAI Judgment Day">
            GenAI Judgement Day
          </h1>
          <p className="text-xl md:text-2xl neon-text-secondary mt-2">
            YOUR CHOICES WILL SHAPE YOUR DIGITAL SELF.
          </p>
        </header>
        <WebcamCapture onImageCapture={handleImageCapture} />
      </div>
    </main>
  );
}
