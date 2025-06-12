
'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import NeonButton from '@/components/neon-button';
import CrtOverlay from './crt-overlay';
import { cn } from '@/lib/utils';

type StartScreenProps = {
  onStart: () => void;
};

export function StartScreen({ onStart }: StartScreenProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showGlitch, setShowGlitch] = useState(false);

  const handleStartClick = () => {
    setShowGlitch(true); // Activate glitch effect

    if (audioRef.current) {
      const audioElement = audioRef.current;

      const cleanupAndProceed = () => {
        audioElement.removeEventListener('ended', handleAudioEnd);
        onStart();
      };

      const handleAudioEnd = () => {
        cleanupAndProceed();
      };

      audioElement.addEventListener('ended', handleAudioEnd);

      audioElement.load();
      audioElement.play().catch(error => {
        console.error("Audio play failed:", error);
        cleanupAndProceed(); // Proceed even if audio fails
      });
    } else {
      onStart();
    }
  };

  return (
    <div className={cn(
        "flex flex-col items-center justify-center text-center text-white p-4 z-10 min-h-screen",
        showGlitch ? 'glitch-transition' : ''
      )}
    >
        <CrtOverlay />
        <div className="max-w-xl flex flex-col items-center gap-6">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-headline neon-text-primary uppercase glitch-text whitespace-nowrap" data-text="GENAI JUDGMENT DAY">
                GENAI JUDGEMENT DAY
            </h1>

            <div className="relative w-full max-w-md aspect-[4/3] bg-black border-2 border-primary rounded-lg shadow-[0_0_15px_theme(colors.primary.DEFAULT)] overflow-hidden my-4">
                <Image
                    src="/assets/images/ae-terminator-face-off.png"
                    alt="Face off between a human and a terminator"
                    layout="fill"
                    objectFit="cover"
                    className="opacity-80"
                    data-ai-hint="robot human"
                />
                <CrtOverlay />
            </div>

            <p className="text-xl md:text-2xl neon-text-secondary">
                Your face is the key. Your choices are the AI.
            </p>
            <p className="text-lg text-white/80">
                Answer the questions to witness your transformation. Will you align with the systematic TerminAEtor or the unpredictable TerminAItor?
            </p>

            <NeonButton
                onClick={handleStartClick}
                neonColor="secondary"
                className="w-full max-w-xs"
            >
                Initiate Protocol
            </NeonButton>

            <audio ref={audioRef} src="/assets/audio/hasta-la-vista-baby.mp3" preload="auto" />
        </div>
    </div>
  );
}
