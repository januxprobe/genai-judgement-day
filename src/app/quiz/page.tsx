
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
const PREGENERATED_CODE_THEME_DESCRIPTIONS: string[] = [
  `Specific Objects, Props, and Visual Elements:
Futuristic Armor/Exoskeleton:
The image features a sophisticated, form-fitting suit of white and black armor. The overall design is sleek, modern, and modular.
Helmet: A white, multi-paneled helmet covers the top, back, and sides of the head. It features clean seams and a prominent, circular, black-and-grey component over the ear area, resembling a high-tech audio sensor or comms unit.
Torso Armor: The chest and back are protected by a solid white breastplate and backplate.
Chest Emblem: The most prominent feature on the chest is a circular, recessed light source that glows with a vibrant orange. Inside this glowing circle are the capital letters "A" and "E" (the 'E' resembles the Greek letter Epsilon 'Ε') in a clean, white, sans-serif font.
Manufacturer's Plate: Below the glowing emblem, there is a small, black, rectangular plate with white text. The top line appears to read "MONOLIGHT," and a smaller line below it might say "SYSTEMS" or "STARK."
System ID: Near the right collarbone, another small, subtle marking is visible, possibly reading "#SYSTEM" or a similar identifier.
Shoulder and Arm Armor: The shoulders are covered by articulated white pauldrons with a layered, protective design. The upper and forearm armor consists of matching white plates that wrap around the limb, revealing the black under-suit at the joints for flexibility.
Under-suit: Visible at the neck and joints is a black, flexible under-suit. The neck portion has a high collar and a slightly ribbed or textured appearance, suggesting a protective, high-performance fabric.
Overall Artistic Style:
The aesthetic is sleek, near-future sci-fi, characterized by clean lines, minimalist design, and a corporate or high-tech military feel. It avoids the grit of cyberpunk or the bulk of classic mecha, favoring a more refined and advanced technological look.
Elements for a New Background:
The "A E" Logo: The glowing orange emblem is a strong branding element. It could be used as a recurring motif in the background on walls, holographic displays, or on other pieces of equipment, establishing a corporate or factional headquarters.
Color Palette: The combination of sterile white, deep black, and vibrant orange is a striking palette. A background could feature minimalist white architecture with black accents, punctuated by glowing orange data streams, signage, or ambient lighting.
Paneling and Seams: The segmented, multi-paneled design of the armor could be mirrored in the background's architecture, such as wall panels, floor tiles, or the hulls of vehicles.
Holographic Interfaces: Given the high-tech nature of the suit, the background could be filled with floating holographic UIs, data readouts, or schematics, many of which could incorporate the orange glow and the "A E" logo.
Manufacturing/Maintenance Bay: A background depicting a clean, robotic assembly line or a maintenance bay for these suits would fit perfectly. This could include robotic arms, diagnostic screens, and charging stations.`,
  `Specific Objects, Props, and Visual Elements:
The image displays a full-body view of a humanoid robot with an athletic and sleek build.
Robot Body: The robot is constructed from a combination of matte white, dark grey/black, and glowing orange components.
Head: The head is a smooth, white helmet, similar in shape to a modern motorcycle or pilot's helmet. It has a glossy black faceplate where a human face would be.
Optical Sensors: Two prominent, glowing orange circles serve as the robot's "eyes" or main optical sensors.
Chin Guard: A white chin guard features a single, subtle horizontal slit, giving the impression of a mouth.
Torso: The upper torso is protected by a white, segmented chest plate and matching shoulder pauldrons.
"AE" Logo: The letters "AE" are stamped on the upper left side of the chest in a bold, sans-serif font, colored in a vibrant yellow-orange that matches the robot's other light sources.
Core and Abdomen: The central torso and abdomen are made of black, articulated plates, creating a contrast with the white armor.
Energy Effects / Lighting: Glowing orange light is a key feature of the design. It appears as integrated light strips and panels:
Lining the seams between the white chest plate and the black core.
Accenting the waist and pelvic area, which is primarily glowing orange/yellow.
Embedded in the joints, such as the elbows, hips, and knees.
Illuminating the palms and back of the hands.
Limbs: The arms and legs follow the same design language.
Arms: White armor plates cover the shoulders and forearms, while the upper arms and joints are black. The hands are black and fully articulated with glowing orange elements.
Legs: The upper legs have white armor plating on the outside of the thighs, with a black under-structure. The lower legs are more robust and mechanical, primarily black and dark grey, with complex jointing at the knee and ankle.
Feet: The feet are solid, boot-like structures designed for stability, colored in dark grey and black.
Overall Artistic Style:
The style is clean, high-tech, near-future sci-fi. The robot's design feels like a mass-produced, commercial, or military model from a specific corporation ("AE"). The smooth surfaces, integrated lighting, and ergonomic-yet-inhuman form give it a very polished and advanced appearance.
Elements for a New Background:
Integrated Light Strips: The glowing orange lines are the most dominant visual motif. A background could feature a futuristic laboratory, hangar, or hallway with the same orange light strips embedded in the floors, walls, and ceiling, guiding the eye or indicating power conduits.
The "AE" Corporate Branding: The "AE" logo could be used extensively in the background. It could be on large wall banners, holographic advertisements, computer monitors, or on other machinery, establishing a corporate-controlled environment.
Charging Stations/Alcoves: The robot's design suggests it's a manufactured unit. A background featuring a row of docking bays or charging alcoves, each perfectly sized for one of these robots, would be very effective. These stations could have glowing orange indicators showing charging status.
Geometric Paneling: The robot's armor is made of distinct, interlocking panels. The background architecture could mimic this with geometric wall panels, hexagonal floor tiles, or faceted structures, all in a white, black, and grey palette.
Holographic Schematics: A background could feature a large, semi-transparent holographic display showing the technical schematics or a 3D model of the robot itself, with glowing orange lines highlighting key systems.`,
  `Specific Objects, Props, and Visual Elements:
The image shows a robust, heavily-armored humanoid robot with an intimidating and tactical design.
Robot Body: The robot's chassis is constructed with a mix of off-white and black/dark grey armored plates, featuring a more angular and complex design than the previous examples.
Head: A white helmet with a full black faceplate.
Optical Sensors: The "eyes" are aggressive, glowing orange-yellow slits, giving the robot a menacing appearance.
Helmet Details: Small, glowing orange light strips accent the sides of the helmet, just above the faceplate.
Torso: The torso is heavily plated, suggesting significant protection.
Chest Plate: The upper chest is covered in a segmented, off-white plate with black trim. The plating has a subtle hexagonal pattern.
"AE" Emblem: In the center of the chest is a glowing, orange-yellow hexagonal emblem. Inside the hexagon, the letters "AE" are displayed in a bold, yellow, sans-serif font.
Abdomen: The midsection and waist are composed of layered black plates that resemble tactical body armor, creating a powerful, V-shaped torso.
Limbs: The arms and legs are similarly armored with a complex interplay of white and black panels.
Arms: The arms feature white shoulder pauldrons and forearm guards over a black mechanical structure. The hands are black, with a complex, multi-jointed design.
Legs: The legs are heavily armored, with large white plates on the outer thighs. The knees are protected by thick, black, articulated guards. The lower legs and feet are a mix of black and white components, creating a sturdy, boot-like appearance.
Paneling and Details: The armor is characterized by its sharp angles, beveled edges, and visible seams and bolts, emphasizing its mechanical and utilitarian nature.
Overall Artistic Style:
The aesthetic is militaristic sci-fi or tactical futurism. Compared to the sleeker, more commercial-looking models, this robot is clearly designed for combat or heavy-duty operations. The angular lines, heavy plating, and aggressive stance give it a powerful and functional look, akin to a robotic super-soldier.
Elements for a New Background:
Hexagonal Patterns: The hexagonal "AE" emblem and chest plate design are a core visual motif. A background could incorporate this pattern into floor tiling, wall textures, reinforced windows, or energy field emitters to create a cohesive environment.
The "AE" Hexagonal Logo: This specific, more aggressive version of the logo could be used to brand a military base, armory, or the side of a futuristic tank or dropship.
Angular and Brutalist Architecture: The robot's sharp, angular design would be well-complemented by a background featuring Brutalist-inspired sci-fi architecture—large, imposing concrete or metallic structures, sharp-edged corridors, and fortified positions.
Armory/Hangar Setting: A background depicting a military armory would be a perfect fit. This could include weapon racks holding futuristic firearms, ammunition crates stamped with the "AE" hex logo, and other combat robots in various states of maintenance.
High-Contrast Lighting: A dramatic lighting scheme with harsh spotlights, casting sharp shadows, and punctuated by the glow of orange warning lights or computer consoles would enhance the tactical and dangerous feel of the scene.`,
  `Specific Objects, Props, and Visual Elements:
The image features a person in a futuristic suit of armor alongside a unique single-wheeled vehicle.
Futuristic Armored Suit:
The suit is form-fitting and athletic, primarily matte black with gunmetal grey and vibrant orange highlights. It looks like a high-performance riding or light combat suit.
Helmet: A dark grey/black, full-head helmet that leaves the face exposed. It has a modern, aerodynamic design with orange accents on vents at the top.
Torso Armor: The chest and abdomen are covered in segmented, black, form-fitting plates that evoke the musculature of the human body.
"AE" Emblem: Positioned on the left side of the chest is a circular, recessed orange emblem containing the letters "AE" in a light yellow/white font.
Shoulders and Knees: The suit is accented with bright orange armor plates on the shoulders (pauldrons) and knees, serving as both protection and a strong visual highlight.
Legs: The upper legs are protected by plates with a dark, gunmetal grey finish.
Boots: The footwear consists of bulky, futuristic boots in dark grey and black, with orange accents and heavy-duty straps.
Gloves: The hands are covered in simple, form-fitting black gloves.
Futuristic Monowheel Vehicle:
Positioned next to the figure is a large, self-balancing, single-wheeled vehicle.
Wheel and Tire: The vehicle's main feature is a massive, thick tire with a complex, aggressive tread pattern. The rim of the wheel is a vibrant, solid orange.
Hub/Spokes: The wheel's interior has complex, dark grey, multi-spoke-like structures, resembling a turbine fan or high-tech mag wheel.
Chassis and Seat: A small chassis sits atop the wheel, likely housing the engine and electronics. It has a light grey/silver top surface that functions as a small seat or handle, with black and orange components visible underneath.
Prop:
Lollipop: A spherical, amber-colored lollipop on a stick is being held. This mundane, slightly whimsical object creates a strong contrast with the high-tech, serious nature of the armor and vehicle.
Overall Artistic Style:
The style is Urban Futurism or Cyber-Rider. It combines sleek, high-tech vehicle and equipment design with a sense of personal, everyday use in a future city. The aesthetic is stylish and functional, leaning more towards a personal mobility/extreme sports vibe than a military one.
Elements for a New Background:
Futuristic Cityscape: A background depicting a bustling, neon-lit city street at dusk or night would be ideal. This could include towering skyscrapers with digital billboards, flying vehicle traffic, and pedestrian walkways.
Monowheel Race Track or Park: A dedicated environment for these vehicles, such as a futuristic skate park or a high-speed race track with glowing orange boundary lines, banking turns, and spectator stands.
"AE" Branded Environment: An "AE" vehicle dealership or a high-tech garage. This setting could feature polished concrete floors, minimalist architecture, and several other monowheels on display stands or in various states of customization. Large "AE" logos could adorn the walls.
Color and Light: The scene should make heavy use of the black-and-orange color scheme. A dark, rain-slicked street reflecting the orange glow from the vehicle, suit, and surrounding neon signs would create a rich, atmospheric background.
Juxtaposition of High-Tech and Low-Tech: Inspired by the lollipop, the background could feature a mix of advanced and mundane elements. For example, a high-tech monowheel parked outside a traditional-looking street food stall or an old brick building covered in holographic graffiti.`,
  `Specific Objects, Props, and Visual Elements:
This image features a person in a sophisticated, high-tech suit, holding a laptop.
Futuristic Suit/Armor:
The suit is a sleek, full-body outfit, primarily matte black with highly detailed, vibrant orange accents. It appears to be a uniform for a technician, pilot, or field agent.
Helmet: A black, open-faced helmet that covers the top, back, and sides of the head, along with the jawline. It resembles a high-tech motorcycle or flight helmet.
Torso: The upper body is protected by a solid black chest plate.
"AE" Logo: The letters "AE" are emblazoned across the chest in a large, bold, orange, sans-serif font, clearly identifying the suit's affiliation.
Shoulder Details: The shoulders feature integrated black pauldrons with small, subtle insignias—one looks like a triangle, the other a square with a line through it.
Legs and Boots: The most visually complex part of the suit. The legs are covered in an intricate, almost bio-mechanical pattern of interlocking black and glossy orange panels.
Pattern: The orange sections form flowing, organic lines that resemble stylized musculature or a network of energy conduits running down the shins and over the integrated boots. This creates a powerful contrast with the solid black upper body.
Gloves: Simple, form-fitting black gloves.
Futuristic Laptop:
The figure is holding and operating a slim, modern laptop.
Casing: The entire outer shell of the laptop is a solid, vibrant orange, perfectly matching the accents on the suit.
Design: It is a thin, sleek device. The keyboard appears to be black, and there is a small, subtle logo on the lid.
Overall Artistic Style:
The style is corporate sci-fi or tech-wear futurism. The combination of the branded uniform and the matching proprietary hardware suggests the character is an employee or agent of the "AE" corporation. The design is clean and professional, but the intricate leg patterns add a unique, high-performance flair.
Elements for a New Background:
Bio-Organic/Circuitry Patterns: The most distinctive element is the flowing orange-and-black pattern on the legs. This visual motif could be used to create a stunning background, such as a server room where the walls are covered in massive, pulsating server racks with glowing orange circuitry patterns. It could also appear as data-flow visualizations on holographic screens.
"AE" Corporate Headquarters: The background could be the interior of a minimalist, high-tech corporate building. Think polished black floors, walls with inset orange lighting, and large glass partitions overlooking a futuristic city. The bold "AE" logo could be displayed on a lobby wall or on digital signage.
Data Center / Server Farm: A dark room filled with rows of sleek, black server racks. The only light could come from the orange glow of status indicators, network activity lights, and the screens of terminals, creating a high-contrast, information-dense environment.
Holographic User Interfaces: To complement the act of using a laptop, the background could be filled with floating, semi-transparent holographic UIs. These could display lines of code, network schematics, 3D models, or financial data, all rendered in the signature orange-on-black color scheme.
Vehicle Hangar/Engineering Bay: A setting where "AE" technology is developed or maintained. The background could feature partially assembled vehicles, drones, or other robotics, with technicians in similar suits working at orange-accented consoles.`,
];

const PREGENERATED_CHAOS_THEME_DESCRIPTIONS: string[] = [
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

  const handleAnswer = async (choice: 'Code' | 'Chaos') => {
    if (!currentQuestion || !transformedImage) return;

    setIsLoading(true);
    setError(null);
    setShowGlitch(true);

    try {
      const themeDescriptionsArray = choice === 'Code' ? PREGENERATED_CODE_THEME_DESCRIPTIONS : PREGENERATED_CHAOS_THEME_DESCRIPTIONS;
      
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
          {/* Render answer buttons */}
 {currentQuestion.answers.map((answer, index) => (
 <NeonButton
 key={index}
 neonColor={answer.protocol === 'Code' ? 'primary' : 'secondary'}
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
