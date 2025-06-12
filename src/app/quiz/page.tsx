
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
  `Objects, Props, and Items:
Thatched Beach Umbrella (Palapa): A large, rustic-style umbrella dominates the left side of the scene. It features a thick central pole made of unfinished, light brown wood. The umbrella's canopy is a dense, shaggy thatch made from dried, overlapping palm fronds in shades of golden-yellow and weathered brown.
Modern Lounge Chairs: Two matching chaise lounges are positioned in the shade of the umbrella. They have sleek, minimalist frames made of a silver or light gray metal. The seating surface is a taut, woven fabric in a neutral light beige or tan color.
Distinct Visual Elements:
Pristine White Sand: The beach is composed of very fine, bright white sand, appearing soft and powdery.
Umbrella Shadow: A distinct, dark, cool-toned shadow is cast by the palapa onto the white sand, anchoring the chairs and umbrella in the scene.
Tropical Ocean Water: The sea displays a prominent color gradient. It begins as a pale, translucent turquoise near the shoreline, deepens into a vibrant aquamarine, and transitions to a darker blue towards the horizon.
Distant Waves: Far out on the water, there are small white lines indicating gentle waves or ripples on the ocean surface.
Vibrant Blue Sky: The sky is a vast expanse of a deep, highly saturated, clear blue.
Fluffy Clouds: A few scattered, bright white, puffy cumulus clouds are visible low in the sky, just above the horizon line.
Artistic Style:
The overall artistic style is that of idealized, high-definition travel photography. It is characterized by its exceptionally vibrant and saturated colors, high contrast, and pristine, picture-perfect composition, designed to evoke a sense of a perfect tropical paradise or luxury vacation.`,
  `Objects, Props, and Items:
Two Palm Trees: Two prominent, tall palm trees stand on the right side of the beach. Their trunks are slender and brownish-gray. The fronds are lush and feathery, in shades of vibrant green and golden-yellow where they are hit by sunlight.
Small Tropical Plant: In the very bottom right corner, the spiky green fronds of a small, low-lying plant (possibly a young palm or shrub) are visible.
Distinct Visual Elements:
Golden-Beige Sand: The beach is made of fine, soft-looking sand with a warm, light golden-beige hue.
Palm Tree Shadows: The two palm trees cast long, distinct, and spiky shadows across the sand, indicating strong, direct sunlight.
Multi-hued Ocean: The ocean displays a clear and beautiful gradient of colors. It begins with a line of white seafoam at the water's edge, followed by a band of pale, translucent turquoise, which deepens into a vibrant cerulean and finally settles into a deep, rich blue at the horizon.
Gentle Waves and Seafoam: A thin layer of white seafoam marks where the gentle waves wash onto the shore.
Dynamic Sky: The sky is a vivid blue, slightly lighter near the horizon. It is filled with a variety of clouds, including soft, puffy white cumulus clouds and thin, wispy cirrus clouds streaking across the upper left portion of the frame.
Artistic Style:
The image exhibits the style of idealized, high-definition travel photography. The composition is picturesque, and the colors are highly saturated and vibrant to create an inviting and perfect vision of a tropical paradise. The lighting is bright and clear, emphasizing the clean lines and vivid colors of the landscape.`,
  `Objects, Props, and Items:
Coupe Glass: The drink is served in a wide-mouthed, shallow coupe-style cocktail glass with a long, elegant, clear glass stem and a simple, flat base.
Fruit Garnish Skewer: A garnish rests across the rim of the glass, held together by a thin, transparent cocktail pick.
Cut Strawberries: The garnish includes two pieces of fresh, red strawberry. One piece on the far left is sliced and fanned out, resting directly on the glass rim. Another chunk of strawberry is skewered.
Pineapple Chunk: A bright yellow, fibrous chunk of pineapple is on the skewer.
Kiwi Slice: A green slice of kiwi, showing its distinctive pattern of black seeds, is also on the skewer.
Caramel Candy: At the end of the skewer is a small, rectangular, light-brown candy, likely a caramel or toffee, with a molded, geometric pattern on its surface.
Distinct Visual Elements:
Blended Pink Cocktail: The glass is filled with a thick, opaque, reddish-pink beverage, likely a frozen or blended cocktail like a strawberry daiquiri.
Frothy Texture: The drink has a frothy, slushy texture, with a lighter-colored layer of foam visible at the surface.
Studio Lighting: The glass and its contents are lit with strong, focused lighting that creates bright highlights on the glass, the wet fruit, and the surface of the drink, giving it a glossy, appealing look.
Isolated Subject: The entire cocktail is presented against a solid, non-reflective black background, which makes the vibrant colors of the drink and garnish stand out sharply.`,
  `Objects, Props, and Items:
Sunglasses: The central object is a single pair of sunglasses.
Distinct Visual Elements:
Frames: The frames are thick, chunky, and made of a glossy black plastic or acetate. They have a bold, squared-off rectangular shape with slightly softened corners.
Nose Bridge: The nose bridge is molded as part of the frame, with a distinct, smooth curve connecting the two lens sockets.
Lenses: The lenses are a vibrant, translucent, solid orange or deep amber color. They are not gradient or mirrored.
Temple Arms (Arms): The temple arms are thick and robust, matching the black, glossy finish of the main frame. In some crops, a hint of a brownish inner core or detail can be seen through the semi-transparent part of the plastic near the hinge.
White Outline: A very thin, crisp white outline has been added around the sunglasses, separating them sharply from the black background.
Isolated Background: The sunglasses are presented against a completely flat, non-reflective black background.`,
  `Objects, Props, and Items:
Baseball Cap: The single object is a classic, unadorned baseball cap.
Distinct Visual Elements:
Vibrant Orange Color: The entire cap, including the crown, brim, and button, is a solid, bright, saturated orange color.
Multi-Panel Construction: The crown of the cap is constructed from multiple fabric panels, with visible stitching along the seams that converge at the top.
Fabric-Covered Button: A small, self-fabric-covered button (squatchee) is situated at the very top of the crown where the panels meet.
Curved Brim: The cap features a standard, pre-curved brim or visor extending from the front.
Fabric Texture: The cap is made from a solid, non-shiny fabric, likely a cotton twill, with a subtle woven texture visible upon close inspection.
Blank Front: The front of the cap is completely plain, with no logos, text, or embroidery.
Isolated Presentation: The cap is photographed against a solid black background, isolating it completely.`,
  `Objects, Props, and Items:
Laptop Computer: The image features a modern, thin laptop, identifiable as an Apple MacBook by its shape and the logo on the lid. It is positioned partially open.
Protective Hard Case: The laptop is fitted with a two-piece, clip-on protective hard case.
Laptop Keyboard: A portion of the laptop's keyboard is visible, showing a silver or light gray base with dark-colored keys.
Distinct Visual Elements:
Bright Orange Color: The protective case is a solid, vibrant, and saturated shade of orange.
Matte/Frosted Texture: The surface of the orange case has a matte or slightly frosted, non-glossy texture.
Apple Logo Cutout: The case features a precise cutout in the shape of the Apple logo, revealing the original logo on the laptop's lid beneath it. The logo itself appears white or light silver.
Case Feet: Small, raised, orange-colored feet are visible on the bottom corners of the case, designed to lift the laptop slightly off a surface.
Isolated Background: The laptop is displayed against a plain, solid black background, which makes the orange color stand out.`,
];

const PREGENERATED_TERMINAITOR_THEME_DESCRIPTIONS: string[] = [ // Renamed from PREGENERATED_CHAOS_THEME_DESCRIPTIONS
  `Specific Objects, Props, and Visual Elements:
The image is a close-up of a highly detailed, metallic humanoid endoskeleton, famously recognized as the T-800 from the Terminator franchise.
Endoskeleton Head: The head is a terrifyingly accurate robotic replica of a human skull.
Material and Texture: It is constructed from a dark, polished-yet-grimy chrome-like metal. The surface is not perfectly smooth; it is weathered, scratched, and pitted, suggesting heavy use and combat.
Optical Sensors: Set deep within the eye sockets are two intensely glowing red optical sensors. They serve as the focal point and primary source of menace.
Teeth: The mouth is fixed in a grimace, revealing a full set of individually articulated, chrome-plated teeth that mimic human dentition.
Jaw and Facial Mechanics: The jaw, cheekbones, and temple area are a complex assembly of interlocking plates, hydraulic pistons, and actuators, all visible and purely functional.
Endoskeleton Torso and Neck: The visible portion of the upper torso and neck reveals the inner workings of the machine.
Neck Pistons: The neck is a thick column of powerful hydraulic pistons and reinforced, flexible conduits that allow the head to move.
Chassis: The shoulder and chest area is an exposed chassis of interlocking structural components, more pistons, and layered metal plates. The design is entirely utilitarian and industrial, with no aesthetic covering.
Overall Artistic Style:
The style is '80s Dystopian Sci-Fi and Industrial Futurism. It is gritty, dark, and menacing. The design philosophy emphasizes brutal functionality over aesthetics, creating a sense of raw, terrifying power. The weathered, oily look of the metal and the raw mechanical components define this iconic, grim-future aesthetic.
Elements for a New Background:
Post-Apocalyptic Ruins: The classic setting for this machine. A background of a desolate, ruined city at night would be perfect. Elements could include piles of rubble, twisted steel rebar, shattered concrete, and human skulls being crushed underfoot.
Skynet Factory/Assembly Line: A dark, hellish industrial factory. The background could be filled with massive machinery, robotic arms welding endoskeleton parts, and conveyor belts carrying legions of identical units. The only light could come from sparks, molten metal, and the ubiquitous red glow of thousands of optical sensors.
Fire and Embers: A background of raging fires, burning buildings, and a landscape lit by the orange glow of destruction would complement the red eyes and the machine's purpose. Fields of glowing embers on the ground could add to the atmosphere.
Industrial Machinery: A close-up, abstract background focusing on the same design language: massive, moving pistons, turning gears, and a network of pipes and girders, all made from the same dark, grimy chrome.
Fields of Red Lights: A simple but effective background could be a dark, indistinct space filled with countless pairs of glowing red eyes, suggesting an entire army of Terminators standing in the darkness, waiting to be activated.`,
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
