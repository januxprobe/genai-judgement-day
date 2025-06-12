
'use server';
/**
 * @fileOverview Transforms a user's image based on their quiz answers and a pre-generated theme description.
 * This flow uses a pre-generated description of reference themes to guide an image generation model
 * to create a new background while preserving the user's face, body, and pose, and potentially altering their clothing.
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
  choice: z.enum(['TerminAEtor', 'TerminAItor']).describe('The user\'s choice for the current question. TerminAEtor for orderly/code-like, TerminAItor for chaotic/unpredictable.'),
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

    let coreInstructions = `**TASK: THEMATICALLY AUGMENT USER'S BACKGROUND, PRESERVING USER'S FACE/BODY/POSE**

You will be given "THE USER PHOTO". This photo contains a REAL HUMAN USER, potentially with an already modified background from previous steps.
Your primary goals are:
1.  **IDENTIFY and PERFECTLY PRESERVE THE REAL HUMAN USER'S ACTUAL HUMAN FACE, BODY FORM, AND POSE** in "THE USER PHOTO". Their ACTUAL HUMAN FACE, body form (shape), and pose MUST remain **100% UNCHANGED, COMPLETELY CLEAR, AND UNOBSCURED** in the foreground. The user's actual human face is paramount and must not be altered, covered by helmets, or turned into a robot. Their actual human facial features must be perfectly retained.
2.  **AUGMENT THE EXISTING BACKGROUND OF "THE USER PHOTO" BY ADDING NEW AI-GENERATED ELEMENTS *BEHIND* THE PRESERVED USER.** Integrate these new elements thematically into the scene that is already present in "THE USER PHOTO". Do NOT completely replace the entire background. The goal is to add to and evolve what's already there, behind the user.
`; 

/*
3.  The new elements added to the background MUST be inspired by the chosen theme: **${themeName}**.
Crucially, add some fitting robots or other characters described by the theme INTO THE BACKGROUND SCENERY, behind the user.
*/

    if (input.referenceThemeDescription && input.referenceThemeDescription.trim()) {
      coreInstructions += `\n3.  When augmenting the background, **incorporate specific objects, props, or stylistic elements mentioned in the following theme description INTO THE EXISTING BACKGROUND SCENE BEHIND THE USER**: "${input.referenceThemeDescription}".`;
      coreInstructions += `\n    **ABSOLUTELY CRITICAL CLARIFICATION REGARDING THEME DESCRIPTIONS AND THE USER'S FACE:** If this theme description mentions any elements that could be applied to a head or face (e.g., helmets, masks, robotic eyes, specific facial structures for characters), these details are **EXCLUSIVELY FOR ROBOTS OR CHARACTERS DEPICTED IN THE NEWLY AUGMENTED BACKGROUND ONLY (BEHIND THE USER)**. These elements MUST NOT, under any circumstances, be applied to THE REAL HUMAN USER'S ACTUAL HUMAN FACE in "THE USER PHOTO". The user's actual human face MUST remain entirely untouched, unobscured, and unchanged from the original photo. Any characters, robots, or figures mentioned in the theme description should appear IN THE BACKGROUND, separate from and behind the user, and should incorporate such thematic head/face elements if described. Ensure these background characters/robots fit the described theme.`;
      console.log(`Using pre-generated reference description for '${themeName}' for additive background changes BEHIND user. Emphasizing face preservation, including robots.`);
    } /*else {
      if (themeName === 'TerminAEtor') {
        coreInstructions += `\n4.  The new background elements for 'TerminAEtor' to be added *behind the user* should feature clean, futuristic, structured elements, possibly incorporating neon orange (hex #FF8C00) accents. Think circuit patterns, glowing geometric shapes, sleek digital interfaces, or advanced AE-built robotic constructs. Crucially, add some fitting robots or drones (e.g. sleek, technological, orderly, AE-branded) into this evolving background scene, behind the user.`;
      } else { // TerminAItor
        coreInstructions += `\n4.  The new background elements for 'TerminAItor' to be added *behind the user* should feature glitchy, abstract, aggressive, and unpredictable elements, possibly incorporating neon yellow/cyan (hex #04D9FF) accents. Think distorted digital artifacts, chaotic energy lines, fragmented light effects, or rogue AI constructs. Crucially, add some fitting robots (e.g. damaged, rogue, industrial, or uniquely self-modified AI entities) into this evolving background scene, behind the user.`;
      }
      console.log(`No pre-generated reference description provided for '${themeName}'. Using default theme description for additive background changes BEHIND user and background robots.`);
    }*/
     coreInstructions += `\n\n**CRITICAL RULE 1: THE REAL HUMAN USER'S ACTUAL HUMAN FACE, BODY FORM, AND POSE from "THE USER PHOTO" MUST NOT BE ALTERED, REPLACED, MODIFIED, OR OBSCURED IN ANY WAY. They must remain clearly identifiable as the human they were in the original photo, in the foreground.**`;
     //coreInstructions += `\n**CRITICAL RULE 2: Only their background is to be additively augmented *BEHIND THEM*. All thematic elements from any descriptions (robots, machinery, characters, etc.) are part of this augmented background scene and must not cover or change the user, especially their face. New background elements should integrate with the existing background that is behind the user.**`;


    finalImagePromptParts.push({ text: coreInstructions });

    finalImagePromptParts.push({ text: "\n\n**THE USER PHOTO (This is the base image. Identify the human user. Keep their ACTUAL HUMAN FACE, BODY FORM, AND POSE 100% unchanged and unobscured in the foreground. Augment the background *behind* them by adding new thematic elements and robots/characters):**" });
    finalImagePromptParts.push({ media: {url: input.photoDataUri} });
    
    finalImagePromptParts.push({
      text: `\n\n**FINAL INSTRUCTION: Generate the image.**
1.  Take THE HUMAN USER from "THE USER PHOTO". Ensure THEIR ACTUAL HUMAN FACE, BODY FORM, AND POSE are perfectly preserved, unchanged, and unobscured in the foreground.
2.  Take the original background from "THE USER PHOTO" (the scene behind the user) and augment it by adding new AI-generated elements *behind* the preserved user. These elements should be inspired by the '${themeName}' theme and incorporate specific objects/styles from the provided reference theme description (if any), or the default stylistic cues for '${themeName}' if no specific description is provided.
3.  All generated elements (including any robots or thematic characters from descriptions) MUST ONLY be in this new, additively augmented background, BEHIND the preserved human user. ABSOLUTELY NO ELEMENTS SHOULD COVER, OBSCURE, OR REMOVE THE USER'S ACTUAL HUMAN FACE.
You can also provide a brief text description of the newly generated image, detailing changes to the background, how it incorporates the theme, adds robots/characters, and how it evolves from any previous state.`
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
      transformationDescription = "AI image generation failed to return a new image. Displaying the previous image. The user's face, body, and pose should have remained unchanged. Background elements should have been additively placed behind the user.";
    } else if (!transformationDescription || transformationDescription.trim() === "") {
        transformationDescription = `The user's photo was transformed. The background was additively augmented *behind them*, including new thematic robots/characters in the background.
This was inspired by ${input.referenceThemeDescription && input.referenceThemeDescription.trim() ? "a pre-generated theme description: "+input.referenceThemeDescription : "the general '"+input.choice+"' theme"}.
The human user in their original photo, critically their actual human face, body form, and pose, was intended to be kept clear, prominent, and completely unchanged and unobscured in the foreground.`;
    }

    return {
      transformedPhotoDataUri: transformedPhotoDataUri,
      transformationDescription: transformationDescription,
    };
  }
);
