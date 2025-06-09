
'use server';
/**
 * @fileOverview Transforms a user's image based on their quiz answers and a pre-generated theme description.
 * This flow uses a pre-generated description of reference themes to guide an image generation model
 * to create a new background while preserving the user. Transformations are intended to be additive,
 * and robots/characters should appear in the background scenery. The user's face must always remain clear and unobscured.
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
      "A photo of the user (THE USER PHOTO), potentially already modified by previous steps, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  choice: z.enum(['Code', 'Chaos']).describe('The user\'s choice for the current question.'),
  questionNumber: z.number().describe('The question number in the quiz.'),
  referenceThemeDescription: z.string().optional().describe(
    "A pre-generated textual description of the chosen theme's reference elements, objects, props, and overall style for the current question. This description is derived from analyzing one or more reference images for the theme."
  ),
});
export type TransformImageInput = z.infer<typeof TransformImageInputSchema>;

const TransformImageOutputSchema = z.object({
  transformedPhotoDataUri: z
    .string()
    .describe("The transformed photo of the user, as a data URI."),
  transformationDescription: z.string().describe('A description of the transformation applied, focusing on elements added to the background, including any robots or characters.'),
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

    let coreInstructions = `**TASK: EVOLVE THE USER'S BACKGROUND ADDITIVELY, INCLUDING THEMATIC ROBOTS/CHARACTERS, WHILE PERFECTLY PRESERVING THE USER, ESPECIALLY THEIR FACE.**

You will be given "THE USER PHOTO". This photo contains a person, and its background may have been modified by previous choices.
Your primary goals are to:
1.  **IDENTIFY and PERFECTLY PRESERVE THE PERSON** in "THE USER PHOTO". This person, including their **FACE (MOST IMPORTANTLY)**, body, clothing, and pose, MUST remain **100% UNCHANGED, CLEAR, VISIBLE, and UNOBSCURED** in the foreground. They are the main subject. Any changes should ONLY happen in the background BEHIND them. **ABSOLUTELY NO ELEMENTS SHOULD COVER, OBSCURE, OR REMOVE THE USER'S FACE.**
2.  **SUBTLY EVOLVE and ENHANCE THE EXISTING BACKGROUND** of "THE USER PHOTO". Do NOT completely replace the background unless this is the very first transformation (question 1). Instead, integrate new elements, styles, and theme-appropriate robots/characters (as detailed below) inspired by the current theme description *into the existing background*. Changes must be additive. **NEW ELEMENTS MUST NOT COVER OR OBSCURE THE USER'S FACE OR BODY.**
3.  The new elements, stylistic adjustments, and any robots/characters in the background MUST be inspired by the chosen theme: **${themeName}**.
`;

    if (input.referenceThemeDescription && input.referenceThemeDescription.trim()) {
      coreInstructions += `\n4.  **BACKGROUND ENHANCEMENT DETAILS (Using Reference Theme Description):**
    The new background's style and content should be heavily influenced by this detailed description for the '${themeName}' theme (question #${input.questionNumber}): "${input.referenceThemeDescription}".
    - Focus on incorporating elements from this description additively to what's already in the background.
    - If this description details specific types of robots, droids, or automatons, ensure they are depicted as INTEGRAL PARTS OF THE BACKGROUND SCENERY, interacting with the environment, walking in the distance, flying by, or integrated into machinery.
    - If robots are not explicitly mentioned but would fit the overall described aesthetic (e.g., a high-tech lab, a chaotic battlefield), consider adding suitable background robots that visually align with the style, objects, and mood of this description. For instance, sleek maintenance drones or security bots in a 'Code' theme's high-tech area, or rugged, perhaps damaged or glitching, combat droids or rogue automatons in a 'Chaos' theme's war-torn or unpredictable setting.
    - All such additions must be behind the user and enhance the scene without altering or obscuring the user in any way, especially their face.`;
      console.log(`Using pre-generated reference description for '${themeName}' (Question ${input.questionNumber}). Guiding AI to add theme-appropriate background robots based on this and general theme, ensuring user and face preservation.`);
    } else {
      // Fallback descriptions
      coreInstructions += `\n4.  **BACKGROUND ENHANCEMENT DETAILS (Using Default Theme Logic):**`;
      if (themeName === 'Code') {
        coreInstructions += ` The background evolution for 'Code' should add clean, futuristic, structured elements, possibly incorporating neon orange (hex #FF8C00) accents. Think circuit patterns, glowing geometric shapes, or sleek digital interfaces appearing within the existing environment. Crucially, **add some fitting robots or drones (e.g., sleek, analytical, maintenance, or security types) into the background scenery.** These additions must not obscure the user.`;
      } else { // Chaos
        coreInstructions += ` The background evolution for 'Chaos' should add glitchy, abstract, aggressive elements, possibly incorporating neon yellow (hex #04D9FF) accents. Think distorted digital artifacts, chaotic energy lines, or fragmented light effects appearing within the existing environment. Crucially, **add some fitting robots or automatons (e.g., damaged, rogue, unpredictable, or heavily armed types) into the background scenery.** These additions must not obscure the user.`;
      }
      console.log(`No pre-generated reference description provided for '${themeName}' (Question ${input.questionNumber}). Using default theme description with explicit focus on adding background robots and preserving the user and their face.`);
    }

     coreInstructions += `\n\n**CRITICAL RULES (RECAP - VERY IMPORTANT):**
*   **THE PERSON FROM "THE USER PHOTO", ESPECIALLY THEIR FACE, MUST NOT BE ALTERED, REPLACED, OR OBSCURED IN ANY WAY, SHAPE, OR FORM.** They are an observer or participant, not the subject of transformation. NO NEWLY GENERATED ELEMENTS SHOULD EVER COVER OR HIDE ANY PART OF THE USER, PARTICULARLY THEIR FACE.
*   **CHANGES ARE ADDITIVE TO THE BACKGROUND:** The goal is to evolve the background, not discard previous changes entirely. New thematic elements (including robots) should integrate with what's already there, BEHIND THE USER.
*   **ROBOTS/CHARACTERS ARE BACKGROUND ELEMENTS:** All robots, droids, or other characters suggested by the theme or description MUST be depicted as part of the background environment, not as a transformation of the user. For instance, show them walking in the distance, flying by, integrated into machinery, or as part of a crowd/army in the background. They should not interact directly with the preserved user and must not obscure the user.`;

    finalImagePromptParts.push({ text: coreInstructions });

    finalImagePromptParts.push({ text: "\n\n**THE USER PHOTO (Identify person, keep them 100% unchanged AND THEIR FACE 100% VISIBLE AND UNOBSCURED, EVOLVE their background additively based on all instructions above, ensuring any new robots/characters are in the background BEHIND THE USER):**" });
    finalImagePromptParts.push({ media: {url: input.photoDataUri} });
    
    finalImagePromptParts.push({
      text: `\n\n**FINAL INSTRUCTION: Generate the image.**
1.  Take the person from "THE USER PHOTO" and ensure they are perfectly preserved and unchanged in the foreground. **THEIR FACE MUST BE COMPLETELY CLEAR, VISIBLE, AND UNOBSCURED.**
2.  **Evolve their existing background** by additively incorporating new elements, styles, and theme-appropriate ROBOTS/CHARACTERS as described above, inspired by the '${themeName}' theme and the provided current step description/logic. All new elements go into the background.
3.  Ensure all generated elements, especially robots or other characters, ONLY appear in this evolving background, **BEHIND the preserved person**. **ABSOLUTELY NOTHING SHOULD BE PLACED IN FRONT OF, ON TOP OF, OR OVER THE USER'S FACE OR BODY.**
Provide a brief text description of the newly generated background, focusing on what new elements were added (including any new robots/characters) and how they incorporate the theme and object/style references from the current step.`
    });

    console.log("DEBUG: Final Image Generation - Prompt Parts being sent to AI (contains data URIs):", JSON.stringify(finalImagePromptParts, null, 2).substring(0, 1000) + "..."); // Log only first 1000 chars

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
      transformedPhotoDataUri = input.photoDataUri; // Fallback to previous image
      transformationDescription = "AI image generation failed to return a new image. Displaying the previous image state. No new background robots were added due to this failure. The user's appearance was intended to be preserved.";
    } else if (!transformationDescription || transformationDescription.trim() === "") {
        transformationDescription = `The background of the user's photo was further evolved based on their choice of '${input.choice}' for question #${input.questionNumber}.
New elements, including theme-appropriate background robots/characters, inspired by ${input.referenceThemeDescription && input.referenceThemeDescription.trim() ? "the specific theme description: \""+input.referenceThemeDescription.substring(0,100)+"...\"" : "the general '"+input.choice+"' theme directives"} were intended to be added.
The user in their original photo, especially their face, was intended to be kept clear, prominent, and unchanged in the foreground.`;
    }

    return {
      transformedPhotoDataUri: transformedPhotoDataUri,
      transformationDescription: transformationDescription,
    };
  }
);

