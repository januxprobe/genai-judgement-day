
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useGameStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

const VerdictAnalysis = () => {
    const { answers, originalImage, transformedImage } = useGameStore();
    const [isAnimating, setIsAnimating] = useState(true);
    const [glitchKey, setGlitchKey] = useState(0);

    const [displayedPercentage, setDisplayedPercentage] = useState(0);
    const [displayedImage, setDisplayedImage] = useState(originalImage || '/assets/images/ae-logo.png');
    const [displayedBorderColor, setDisplayedBorderColor] = useState('border-muted');
    const [displayedTextColor, setDisplayedTextColor] = useState('text-muted');

    const { terminAEtorPercentage, terminAItorPercentage, dominantProtocol, dominantPercentage, dominantImage, dominantBorderColor, dominantTextColor, submissiveImage, submissiveBorderColor } = useMemo(() => {
        const aetorCount = answers.filter(a => a.choice === 'TerminAEtor').length;
        const aitorCount = answers.filter(a => a.choice === 'TerminAItor').length;
        const total = aetorCount + aitorCount;

        if (total === 0) {
            // Default/fallback state if no answers are present
            return {
                terminAEtorPercentage: 50,
                terminAItorPercentage: 50,
                dominantProtocol: 'TerminAEtor',
                dominantPercentage: 50,
                dominantImage: '/assets/images/terminaetor-avatar.png',
                dominantBorderColor: 'border-primary',
                dominantTextColor: 'neon-text-primary',
                submissiveImage: '/assets/images/terminaitor-avatar.png',
                submissiveBorderColor: 'border-secondary',
            };
        }

        const aetorPerc = Math.round((aetorCount / total) * 100);
        const aitorPerc = 100 - aetorPerc;
        const dominant = aetorPerc >= aitorPerc ? 'TerminAEtor' : 'TerminAItor';
        
        return {
            terminAEtorPercentage: aetorPerc,
            terminAItorPercentage: aitorPerc,
            dominantProtocol: dominant,
            dominantPercentage: dominant === 'TerminAEtor' ? aetorPerc : aitorPerc,
            dominantImage: transformedImage,
            dominantBorderColor: dominant === 'TerminAEtor' ? 'border-primary' : 'border-secondary',
            dominantTextColor: dominant === 'TerminAEtor' ? 'neon-text-primary' : 'neon-text-secondary',
            submissiveImage: dominant === 'TerminAEtor' ? '/assets/images/terminaitor-avatar.png' : '/assets/images/terminaetor-avatar.png',
            submissiveBorderColor: dominant === 'TerminAEtor' ? 'border-secondary' : 'border-primary'
        };

    }, [answers, transformedImage]);

    useEffect(() => {
        setIsAnimating(true);
        const animationDuration = 3000; // 3 seconds
        const glitchInterval = 150; // ms

        const glitcher = setInterval(() => {
            setDisplayedPercentage(Math.floor(Math.random() * 101));
            const isAETor = Math.random() > 0.5;
            setDisplayedImage(isAETor ? '/assets/images/terminaetor-avatar.png' : '/assets/images/terminaitor-avatar.png');
            setDisplayedBorderColor(isAETor ? 'border-primary' : 'border-secondary');
            setDisplayedTextColor(isAETor ? 'neon-text-primary' : 'neon-text-secondary');
            setGlitchKey(prev => prev + 1); // Force re-render for glitch effect
        }, glitchInterval);

        setTimeout(() => {
            clearInterval(glitcher);
            setIsAnimating(false);
            setDisplayedPercentage(dominantPercentage);
            setDisplayedImage(dominantImage);
            setDisplayedBorderColor(dominantBorderColor);
            setDisplayedTextColor(dominantTextColor);
        }, animationDuration);

        return () => clearInterval(glitcher);
    }, [dominantPercentage, dominantImage, dominantBorderColor, dominantTextColor]);

    const SideAvatar = ({ src, borderColor, isDominant, isAnimating }) => (
        <motion.div 
            className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0"
            initial={{ opacity: 0.5, scale: 0.8 }}
            animate={{ 
                opacity: isAnimating ? 0.7 : (isDominant ? 1 : 0.4), 
                scale: isAnimating ? 0.9 : (isDominant ? 1 : 0.8) 
            }}
            transition={{ duration: 0.5 }}
        >
            <Image 
                src={src} 
                alt="Avatar" 
                width={128} 
                height={128} 
                className={`w-full h-full rounded-full object-cover border-4 ${borderColor} transition-all duration-500`} 
            />
        </motion.div>
    );

    return (
        <div className="flex flex-col items-center justify-center space-y-6 w-full py-6">
            <div className="flex items-center justify-around w-full max-w-lg">
                <SideAvatar 
                    src="/assets/images/terminaetor-avatar.png" 
                    borderColor="border-primary"
                    isDominant={dominantProtocol === 'TerminAEtor'}
                    isAnimating={isAnimating}
                />
                
                <SideAvatar 
                    src="/assets/images/terminaitor-avatar.png" 
                    borderColor="border-secondary"
                    isDominant={dominantProtocol === 'TerminAItor'}
                    isAnimating={isAnimating}
                />
            </div>
            
            <div className="relative w-48 h-48 md:w-60 md:h-60">
                <AnimatePresence>
                    <motion.div
                        key={glitchKey}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5}}
                        transition={{ duration: isAnimating ? 0.05 : 0.5 }}
                        className="absolute inset-0"
                    >
                        <Image
                            src={displayedImage}
                            alt="Analysis subject"
                            width={240}
                            height={240}
                            className={`w-full h-full rounded-full object-cover border-4 ${isAnimating ? displayedBorderColor : dominantBorderColor} transition-colors duration-500 shadow-lg`}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="text-center font-headline">
                <div 
                    className={`text-6xl md:text-7xl font-bold transition-colors duration-500 ${isAnimating ? displayedTextColor : dominantTextColor}`}
                    style={{ textShadow: '0 0 10px currentColor' }}
                >
                    <AnimatePresence mode="popLayout">
                        <motion.span
                            key={displayedPercentage}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.1 }}
                        >
                           {displayedPercentage}%
                        </motion.span>
                    </AnimatePresence>
                </div>
                <div className={`text-2xl md:text-3xl uppercase mt-2 transition-colors duration-500 ${isAnimating ? displayedTextColor : dominantTextColor}`}>
                    {isAnimating ? 'Analyzing' : dominantProtocol}
                </div>
            </div>
        </div>
    );
};

export default VerdictAnalysis;
