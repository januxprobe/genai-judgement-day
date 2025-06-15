
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
  `add a vibrant pink blended cocktail, next to the person or in the person's hands, in a coupe glass with a long clear stem. The drink has a frothy, slushy texture with a light foam on top. A clear skewer rests across the glass, holding fresh red strawberry slices, a yellow pineapple chunk, a green kiwi slice with visible seeds, and a small caramel candy with a geometric pattern. Bright, glossy studio lighting highlights the fruit and glass, making colors pop vividly.`,
  `Add on the persons face, a single pair of bold, rectangular sunglasses with thick, glossy black frames and vibrant solid orange lenses. The molded nose bridge curves smoothly between the lenses. Thick temple arms match the black finish, with a hint of brown inner detail near the hinge.`,
  `add on the persons head a single, classic baseball cap in solid, vibrant orange. It has a curved brim, multi-panel crown with visible stitching, and a fabric-covered button at the top. Made of matte cotton twill with subtle woven texture. The front is completely blank, with no logos or text.`,
  `Add on the persons lap an open Apple MacBook with a vibrant orange, matte-finish hard case. The case has a cutout revealing the white AE logo on the lid.`,
];

const PREGENERATED_TERMINAITOR_THEME_DESCRIPTIONS: string[] = [ // Renamed from PREGENERATED_CHAOS_THEME_DESCRIPTIONS
  `add in the background, behind the person, gritty, post-apocalyptic night scene with burning rubble, twisted steel, scattered skulls, and glowing embers. 1980s dystopian sci-fi style, industrial futurism, cinematic lighting, dark and menacing atmosphere.`,
  `Specific Objects, Props, and Visual Elements:
The image contains several pieces of practical, tactical gear and a weapon.
Assault Rifle: The primary object is an assault rifle, appearing to be an AKM or a similar variant from the AK-47 family.
Furniture: It features classic wood furniture, including the handguard and pistol grip, which shows visible grain.
Magazine: A curved, 30-round "banana" magazine is inserted.
Receiver and Barrel: The rifle has a stamped steel receiver and a distinctive front sight block and gas tube, characteristic of the design. The overall appearance is rugged and utilitarian.
Sunglasses: Classic aviator-style sunglasses with thin metal frames and large, dark lenses are being worn.
Tactical Belt and Holster: A heavy-duty black belt is worn around the waist.
The belt is wide and features prominent silver metal grommets or eyelets.
Attached to the belt is a black holster, likely made of leather or kydex, designed to carry a sidearm.
Overall Artistic Style:
The aesthetic is gritty, late-20th-century action and post-apocalyptic realism. The equipment is practical, analog, and weathered, standing in stark contrast to the sleek, futuristic technology seen in previous images. The warm, high-contrast lighting and slight film grain are characteristic of late '80s and early '90s action cinema. The overall mood is one of a grounded, desperate struggle.
Elements for a New Background:
Desert Wasteland: A sun-bleached, desolate landscape fits the harsh lighting. This could include cracked earth, abandoned and rusting vehicles, and the ruins of a gas station or roadside motel under a hazy, hot sky.
Industrial Complex: A gritty, decaying industrial zone, such as a steel mill, abandoned factory, or a concrete-lined canal. Background elements could include chain-link fences, graffiti-covered walls, large pipes, and rusting machinery.
Resistance Hideout: An improvised, fortified hideout in a bunker, garage, or abandoned warehouse. The background could be filled with elements of guerrilla warfare: sandbags, camouflage netting, maps spread across tables, and weapon maintenance benches cluttered with cleaning kits, spare parts, and ammunition boxes.
Smoldering Ruins: A background depicting the aftermath of a battle. This could include the burning wreckage of futuristic war machines, smoldering craters in the asphalt, and buildings reduced to rubble, all under a dark, smoke-filled sky.`,
  `Specific Objects, Props, and Visual Elements:
The image displays an action figure of a battle-damaged, shapeshifting robot disguised in a police uniform.
Battle-Damaged Form: The most prominent feature is the severe damage revealing the figure's true nature.
Liquid Metal Wounds: Instead of conventional bullet holes, the torso is pierced by several large, splash-like wounds. These are composed of a silvery, chrome-like liquid metal that has burst through the uniform. Each wound has a distinct, frozen-in-time ripple effect, with concentric circles emanating from a central point.
Facial Damage: A large portion of the face, centered on the left eye, has been blown away. The "flesh" is peeled back to reveal the same shimmering, liquid metal substructure. The eye socket is a smooth, perfectly circular hole, through which the background is visible.
Police Uniform: The figure is wearing a dark blue, long-sleeved police officer's uniform.
Insignia: A silver police badge is pinned above the right chest pocket. Two silver pen-like objects are in the pocket.
Name Tag: Above the left chest pocket is a white name tag with the name "AUSTIN" in black capital letters.
Belt and Trousers: The figure wears matching dark blue trousers and a simple black leather belt with a silver buckle.
Overall Artistic Style:
The aesthetic is '90s Sci-Fi Body Horror. It combines a mundane, everyday disguise (a police uniform) with the terrifying and alien concept of a liquid metal, shapeshifting entity. The visual horror comes from the unnatural way the body is damaged, not tearing or bleeding but splashing and reforming. The warm, fiery background in the original photo suggests a climactic, industrial setting.
Elements for a New Background:
Rippling Liquid Metal Surfaces: The unique, concentric ripple pattern of the wounds is a powerful visual motif. A background could feature this effect on a larger scale: floors and walls could be made of the same liquid metal, rippling from impacts or from the machine's own movement. Pools of shimmering, silvery liquid metal could cover the ground.
Industrial Inferno / Steel Mill: This is the character's canonical environment. A background depicting a steel mill would be perfect. Elements could include vats of glowing molten steel, massive chains and hooks, metal catwalks, and heavy industrial machinery, all bathed in an intense orange and yellow light from the heat.
Explosions and Molten Elements: The background could be filled with the visual language of extreme heat and force. This includes sparks from grinding metal, jets of flame, and splashes of molten steel that mimic the liquid metal wounds on the figure.
Corrupted Environments: A background could show a normal environment, like a hospital corridor or a shopping mall, being physically corrupted by the robot's presence. Walls could appear to melt and drip with liquid metal, and checkerboard floors could warp and ripple, showing the mundane world being overcome by this futuristic threat.`,
  `Specific Objects, Props, and Visual Elements:
The image is a close-up of a severely battle-damaged cyborg, blending organic and mechanical elements.
Exposed Endoskeleton: The most striking feature is the extensive damage to the left side of the face, where the organic tissue has been torn away to reveal the metallic endoskeleton beneath.
Mechanical Structure: The exposed part is a dark, complex chrome structure, representing the robot's skull.
Robotic Eye: In place of a human eye is a glowing red optical sensor, which acts as a primary light source in that part of the image.
Wound and Gore Effects: The transition between the flesh and the machine is depicted with graphic detail.
Shredded remnants of skin and tissue cling to the edges of the exposed metal.
Streaks of blood are visible on the remaining organic parts of the face, and there are additional cuts and what appear to be bullet holes.
Clothing: The figure is wearing a heavy, dark jacket, likely leather.
Collar: The jacket has a prominent, high collar, which is turned up.
Texture: The material appears worn and rugged.
Overall Artistic Style:
The style is gritty sci-fi horror with an '80s action movie aesthetic. The image is characterized by its dark, high-contrast, and dramatic lighting (chiaroscuro), which uses deep shadows and cool blue tones to create a menacing and intense mood. The practical effects, blending organic and mechanical gore, are a hallmark of this era's filmmaking.
Elements for a New Background:
Dark Industrial Environments: A perfect setting would be a dimly lit factory, foundry, or machine shop at night. The background could be filled with heavy machinery, metal catwalks, hanging chains, and pipes venting steam, all under stark, directional lighting.
Rainy Urban Night: A classic choice would be a rain-slicked city alley or street at night. This would allow for dramatic reflections of neon signs or streetlights on the wet asphalt and the exposed chrome of the endoskeleton. The cool, blue color palette of the image would fit this perfectly.
Wreckage and Destruction: A background showing the immediate aftermath of a violent confrontation. This could include a wrecked, burning vehicle (like a truck or police car), shattered glass, and rubble, with flashing emergency lights (red and blue) providing dramatic, pulsating background illumination.
Abstract Light and Shadow: A more minimalist background could play with the lighting themes. For instance, a dark space with a single, harsh blue key light, or a background composed entirely of moving shadows and the intermittent sparks from a short-circuiting electrical panel.`,
  `Specific Objects, Props, and Visual Elements:
The image contains iconic props associated with a specific action character and setting.
Lever-Action Shotgun: A heavily modified shotgun is being aimed.
Design: It is a sawed-off, large-loop lever-action shotgun, often referred to as a "mare's leg." This modification allows for one-handed cocking, typically by spinning the weapon.
Details: The shotgun has wood furniture (forend) and a dark, parkerized or blued metal finish. The barrel is cut down, and the stock is removed, leaving only a pistol grip.
Black Leather Jacket: A classic black leather motorcycle jacket is being worn. It appears weathered and broken-in, consistent with heavy use. It features typical motorcycle jacket elements like a collar, zippers, and reinforced panels.
Sunglasses: Simple, dark, squarish sunglasses are being worn.
Overall Artistic Style:
The style is pure '90s blockbuster action film. The warm, golden-hour lighting, the slight film grain, and the combination of practical props (leather, steel, wood) create a gritty, high-stakes, and kinetic feel. It is a grounded, real-world aesthetic applied to an extraordinary situation.
Elements for a New Background:
Highway Chase Scene: The quintessential background for this imagery. This could be a multi-lane highway or a concrete drainage canal, with elements like pursuing vehicles (especially a large truck), overpasses, and the open road stretching ahead.
Desert Road: A long, empty stretch of cracked asphalt cutting through a desert landscape at sunset. The low, warm light would match the image's lighting perfectly, evoking a sense of travel and isolation.
Industrial Zone Aftermath: The scene of a recent battle in an industrial area. A background filled with the fiery wreckage of a tanker truck, smoldering debris, and the stark structures of a factory or steel mill would create a dramatic and action-packed setting.
Urban Underpass/Tunnel: A dark, gritty concrete underpass or tunnel. This would allow for dramatic lighting from the motorcycle's headlight and the sparks from ricocheting bullets, creating a claustrophobic and intense environment.`,
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
