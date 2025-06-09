
'use server';
/**
 * @fileOverview Transforms a user's image based on their quiz answers and a pre-generated theme description.
 * This flow uses a pre-generated description of reference themes to guide an image generation model
 * to create a new background while preserving the user.
 *
 * - transformImage - A function that transforms the image based on quiz choices and a theme description.
 * - TransformImageInput - The input type for the transformImage function.
 * - TransformImageOutput - The return type for the transformImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransformImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a REAL HUMAN USER (THE USER PHOTO), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  choice: z.enum(['Code', 'Chaos']).describe('The user\'s choice for the current question.'),
  questionNumber: z.number().describe('The question number in the quiz.'),
  referenceThemeDescription: z.string().optional().describe(
    "A pre-generated textual description of the chosen theme's reference elements, objects, props, and overall style. This description is derived from analyzing one or more reference images for the theme."
  ),
});
export type TransformImageInput = z.infer<typeof TransformImageInputSchema>;

const TransformImageOutputSchema = z.object({
  transformedPhotoDataUri: z
    .string()
    .describe("The transformed photo of the user, as a data URI."),
  transformationDescription: z.string().describe('A description of the transformation applied.'),
});
export type TransformImageOutput = z.infer<typeof TransformImageOutputSchema>;

export async function transformImage(input: TransformImageInput): Promise<TransformImageOutput> {
  return transformImageFlow(input);
}

const transformImageFlow = ai.defineFlow(
  {
    name: 'transformImageFlow',
    inputSchema: TransformImageInputSchema,
    outputSchema: TransformImageOutputSchema,
  },
  async (input) => {
    const themeName = input.choice;
    const finalImagePromptParts: ({text: string} | {media: {url: string}})[] = [];

    let coreInstructions = `**TASK: ADDITIVELY EVOLVE BACKGROUND AND ADD THEMATIC ELEMENTS (ROBOTS/CHARACTERS) WHILE ABSOLUTELY PRESERVING THE USER'S ACTUAL HUMAN FACE AND FORM**

You will be given "THE USER PHOTO". This photo contains a REAL HUMAN USER, potentially with an already modified background from previous steps.
Your primary goals are:
1.  **IDENTIFY and PERFECTLY PRESERVE THE REAL HUMAN USER** in "THE USER PHOTO". This human user, AND MOST IMPORTANTLY THEIR ACTUAL HUMAN FACE, body, clothing, and pose, MUST remain **100% UNCHANGED, COMPLETELY CLEAR, AND UNOBSCURED** in the foreground. The user's actual human face is paramount and must not be altered, covered by helmets, or turned into a robot. Their actual human facial features must be perfectly retained.
2.  **ADDITIVELY EVOLVE AND AUGMENT THE EXISTING BACKGROUND** of "THE USER PHOTO" with new, A.I.-generated elements. Do NOT completely replace the entire background if it has existing features; instead, integrate new elements thematically.
3.  This evolution and augmentation of the background MUST be inspired by the chosen theme: **${themeName}**. Crucially, add some fitting robots or other characters described by the theme INTO THE BACKGROUND SCENERY.
`;

    if (input.referenceThemeDescription && input.referenceThemeDescription.trim()) {
      coreInstructions += `\n4.  Furthermore, the new background elements and their style should be heavily influenced by this detailed description derived from an analysis of reference images for the '${themeName}' theme: "${input.referenceThemeDescription}". 
    **ABSOLUTELY CRITICAL CLARIFICATION REGARDING THEME DESCRIPTIONS:** If this theme description mentions any elements that could be applied to a head or face (e.g., helmets, masks, robotic eyes, specific facial structures for characters), these details are **EXCLUSIVELY FOR ROBOTS OR CHARACTERS DEPICTED IN THE NEWLY AUGMENTED BACKGROUND ONLY**. These elements MUST NOT, under any circumstances, be applied to THE REAL HUMAN USER in "THE USER PHOTO". The user's actual human face MUST remain entirely untouched, unobscured, and unchanged from the original photo. Any characters, robots, or figures mentioned in the theme description should appear IN THE BACKGROUND, separate from the user, and should incorporate such thematic head/face elements if described. Ensure these background characters/robots fit the described theme.`;
      console.log(`Using pre-generated reference description for '${themeName}'. Emphasizing face preservation from theme details and additive background changes including robots.`);
    } else {
      if (themeName === 'Code') {
        coreInstructions += `\n4.  The new background elements for 'Code' should feature clean, futuristic, structured elements, possibly incorporating neon orange (hex #FF8C00) accents. Think circuit patterns, glowing geometric shapes, or sleek digital interfaces. Crucially, add some fitting robots or drones (e.g. sleek, technological) into this evolving background scene.`;
      } else { // Chaos
        coreInstructions += `\n4.  The new background elements for 'Chaos' should feature glitchy, abstract, aggressive elements, possibly incorporating neon yellow (hex #04D9FF) accents. Think distorted digital artifacts, chaotic energy lines, or fragmented light effects. Crucially, add some fitting robots (e.g. damaged, rogue, or industrial) into this evolving background scene.`;
      }
      console.log(`No pre-generated reference description provided for '${themeName}'. Using default theme description with additive changes and background robots.`);
    }
     coreInstructions += `\n\n**CRITICAL RULE 1: THE REAL HUMAN USER FROM "THE USER PHOTO", AND ESPECIALLY THEIR ACTUAL HUMAN FACE, MUST NOT BE ALTERED, REPLACED, MODIFIED, OR OBSCURED IN ANY WAY. DO NOT ADD HELMETS, ROBOTIC FACES, OR MASK THE USER'S ACTUAL HUMAN FACIAL FEATURES. The user must remain clearly identifiable as the human they were in the original photo.**`;
     coreInstructions += `\n**CRITICAL RULE 2: Only their background is to be additively augmented. All thematic elements from any descriptions (robots, machinery, characters, etc.) are part of this augmented background scene and must not cover or change the user, especially their face. New elements should integrate with the existing background.**`;


    finalImagePromptParts.push({ text: coreInstructions });

    finalImagePromptParts.push({ text: "\n\n**THE USER PHOTO (Identify the human user, keep them and ESPECIALLY THEIR ACTUAL HUMAN FACE 100% unchanged and unobscured, additively evolve their background including thematic robots/characters):**" });
    finalImagePromptParts.push({ media: {url: input.photoDataUri} });
    
    finalImagePromptParts.push({
      text: `\n\n**FINAL INSTRUCTION: Generate the image.**
1.  Take THE HUMAN USER from "THE USER PHOTO" and ensure THEY, AND CRITICALLY THEIR ACTUAL HUMAN FACE, are perfectly preserved, unchanged, and unobscured in the foreground.
2.  Additively evolve and augment their original background with new A.I.-generated elements as described above, inspired by the '${themeName}' theme and the provided description. This includes adding thematic ROBOTS/CHARACTERS into the background scene. REMEMBER: if the theme description details headgear or facial features, these are for BACKGROUND characters/robots ONLY, NOT for the user.
3.  All generated elements (including any robots or thematic characters from descriptions) MUST ONLY be in this new, additively augmented background, BEHIND the preserved human user. ABSOLUTELY NO ELEMENTS SHOULD COVER, OBSCURE, OR REMOVE THE USER'S ACTUAL HUMAN FACE.
You can also provide a brief text description of the newly generated background, how it incorporates the theme, adds robots/characters, and how it evolves from any previous state.`
    });

    console.log("DEBUG: Final Image Generation - Prompt Parts being sent to AI (contains data URIs):", JSON.stringify(finalImagePromptParts, null, 2));

    const {media, text: modelGeneratedText} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', 
      prompt: finalImagePromptParts,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
        ],
      },
    });

    let transformedPhotoDataUri = media?.url;
    let transformationDescription = modelGeneratedText;

    if (!transformedPhotoDataUri) {
      console.warn("AI image generation did not return a media URL. Falling back to previous image.");
      transformedPhotoDataUri = input.photoDataUri;
      transformationDescription = "AI image generation failed to return a new image. Displaying the previous image. The user's face should have remained unchanged and background elements should have been additive.";
    } else if (!transformationDescription || transformationDescription.trim() === "") {
        transformationDescription = `The background of the user's photo was additively transformed based on their choice of '${input.choice}' for question #${input.questionNumber}, including new thematic robots/characters in the background.
It was inspired by ${input.referenceThemeDescription && input.referenceThemeDescription.trim() ? "a pre-generated theme description: "+input.referenceThemeDescription : "the general '"+input.choice+"' theme"}.
The human user in their original photo, and critically their actual human face, was intended to be kept clear, prominent, and completely unchanged and unobscured in the foreground.`;
    }

    return {
      transformedPhotoDataUri: transformedPhotoDataUri,
      transformationDescription: transformationDescription,
    };
  }
);

